import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { lastValueFrom, map, tap } from 'rxjs';
import { CustomersService } from 'src/customers/customers.service';
import { CustomerEwalletCreditInput } from 'src/customers/dto/ewallet-credit.dto';
import { CustomerEwalletDebitInput } from 'src/customers/dto/ewallet-debit.dto';
import { Customer } from 'src/customers/entities/customer.entity';
import { Order } from 'src/orders/entities/order.entity';
import { PUB_SUB } from 'src/pub-sub/pub-sub.module';
import { WorkerWalletCreditInput } from 'src/workers/dto/wallet-credit.dto';
import { WorkerWalletDebitInput } from 'src/workers/dto/wallet-debit.dto';
import { IsNull, Not, Repository } from 'typeorm';
import {
  OrderStatus,
  OrderStatuses,
} from '../orders/entities/order-status.entity';
import { OrdersService } from '../orders/orders.service';
import { Task } from '../task/entities/task.entity';
import { IpnBodyDto } from './dto/ipn-body.dto';
import { Invoice, InvoiceType } from './entities/invoice.entity';
import { Payment, PaymentMethodForCustomers } from './entities/payment.entity';

@Injectable()
export class FinanceService {
  private logger = new Logger('OrdersService');
  constructor(
    private readonly httpService: HttpService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(PUB_SUB) private pubSub: RedisPubSub,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderStatus)
    private readonly orderStatusRepository: Repository<OrderStatus>,
  ) {}

  async createInvoice(order: Order) {
    const url = process.env.FINANCE_API_ENDPOINT + '/invoice';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      customer: {
        id: order.customer.id,
        name: order.customer.name,
      },
      order: {
        id: order.id,
      },
      microarea_details:
        this.customersService.getMicroareaDetailsByCustomerAddressId(
          order.estimate.customer_address.id,
        ),
      invoice: order.estimate.estimate,
    };

    // send POST request to finance API
    const response = await this.httpService.post(url, data, { headers }).pipe(
      map(async (res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        const invoiceResponse: any = res;
        const invoice: Invoice = new Invoice();
        invoice.id = invoiceResponse.data.id;
        invoice.type = InvoiceType.primary;
        invoice.order = order;
        invoice.invoice = invoiceResponse;
        return await this.invoiceRepository.save(invoice);
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { invoice: { id: invoiceId } },
      relations: ['invoice'],
    });
  }

  async customerEwalletCredit(
    user = null,
    customerEwalletCreditInput: CustomerEwalletCreditInput,
  ) {
    const customer = await this.customersService.getCustomerById(
      customerEwalletCreditInput.customer_id,
    );

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    const url = process.env.FINANCE_API_ENDPOINT + '/ewallet/credit';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      customer: {
        id: customerEwalletCreditInput.customer_id,
      },
      amount: customerEwalletCreditInput.amount,
      reference: customerEwalletCreditInput.reference ?? null,
      updated_by: {
        id: user ? user.id : null,
      },
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async customerEwalletDebit(
    user = null,
    customerEwalletDebitInput: CustomerEwalletDebitInput,
  ) {
    const customer = await this.customersService.getCustomerById(
      customerEwalletDebitInput.customer_id,
    );

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    // check current balance of customer
    const currentBalance = await this.customersService.getEwalletBalance(
      customerEwalletDebitInput.customer_id,
    );

    if (currentBalance < customerEwalletDebitInput.amount) {
      throw new HttpException(
        'Insufficient balance in customer ewallet',
        HttpStatus.BAD_REQUEST,
      );
    }

    const url = process.env.FINANCE_API_ENDPOINT + '/ewallet/debit';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      customer: {
        id: customerEwalletDebitInput.customer_id,
      },
      amount: customerEwalletDebitInput.amount,
      reference: customerEwalletDebitInput.reference ?? null,
      updated_by: {
        id: user ? user.id : null,
      },
      invoice_id: customerEwalletDebitInput.invoice_id,
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async workerWalletCredit(
    user = null,
    workerWalletCreditInput: WorkerWalletCreditInput,
  ) {
    const url = process.env.FINANCE_API_ENDPOINT + '/workerwallet/credit';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      worker: {
        id: workerWalletCreditInput.worker_id,
      },
      amount: workerWalletCreditInput.amount,
      reference: workerWalletCreditInput.reference ?? null,
      updated_by: {
        id: user ? user.id : null,
      },
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async workerWalletDebit(
    user = null,
    workerWalletDebitInput: WorkerWalletDebitInput,
  ) {
    const url = process.env.FINANCE_API_ENDPOINT + '/workerwallet/debit';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      worker: {
        id: workerWalletDebitInput.worker_id,
      },
      amount: workerWalletDebitInput.amount,
      reference: workerWalletDebitInput.reference ?? null,
      updated_by: {
        id: user ? user.id : null,
      },
      invoice: {
        id: workerWalletDebitInput.invoice_id,
      },
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async receivePayment(ipnBodyDto: IpnBodyDto) {
    // get all payments for this invoice
    const payments: Payment[] = await this.paymentRepository.find({
      where: [
        {
          invoice: { id: ipnBodyDto.invoice_id },
          payment_received_at: Not(IsNull()),
        },
        {
          invoice: { id: ipnBodyDto.invoice_id },
          payment_dropped_at: Not(IsNull()),
        },
      ],
      relations: ['invoice'],
    });

    // if no payments found, raise bad request error
    if (payments.length > 0) {
      throw new HttpException(
        'No payments found for this invoice, or payment has already been received',
        HttpStatus.BAD_REQUEST,
      );
    }

    // get last payment for this invoice and payment method
    const lastPayment = await this.paymentRepository.findOne({
      where: {
        invoice: { id: ipnBodyDto.invoice_id },
        payment_method: ipnBodyDto.payment_method,
        payment_received_at: IsNull(),
        payment_dropped_at: IsNull(),
      },
      relations: ['invoice'],
      order: {
        created_at: 'DESC',
      },
    });

    // update payment received at
    lastPayment.payment_received_at = new Date();
    lastPayment.transaction_id = ipnBodyDto.txn_id;
    lastPayment.reference = ipnBodyDto.reference;

    // store last payment
    const storedPayment: Payment = await this.paymentRepository.save(
      lastPayment,
    );

    // set payment_dropped_at to now for all other payments
    await this.paymentRepository.update(
      {
        invoice: { id: ipnBodyDto.invoice_id },
        payment_received_at: IsNull(),
        payment_dropped_at: IsNull(),
      },
      {
        payment_dropped_at: new Date(),
      },
    );
    const _payment = await this.paymentRepository.findOne({
      where: {
        id: storedPayment.id,
      },
      relations: {
        invoice: {
          order: true,
        },
      },
    });

    await this.updateOrderStatusAfterPayment(
      _payment.invoice.order.id,
      OrderStatuses.completed,
    );

    this.pubSub.publish('paymentReceived', { paymentReceived: storedPayment });
    return storedPayment;
  }

  async createPayment(
    orderId: string,
    // invoiceId: string,
    paymentMethod: PaymentMethodForCustomers,
  ) {
    // create invoice
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        estimate: {
          customer_address: true,
        },
      },
    });

    if (!order) {
      return new HttpException('Invalid Order Id', HttpStatus.NOT_FOUND);
    }

    const invoice: Invoice = await this.createInvoice(order);

    // Get Customer from Invoice
    const customer: Customer = invoice.order.customer;

    const url = process.env.FINANCE_API_ENDPOINT + '/payments/create';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };
    const invoiceId = invoice.id;
    const data = {
      invoice: {
        id: invoiceId,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone_number,
      },
      payment_method: paymentMethod,
    };
    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        const payment: Payment = new Payment();
        payment.invoice = await this.invoiceRepository.findOne({
          where: { id: invoiceId },
        });
        payment.payment_method = paymentMethod;
        payment.payment_url = res.data.payment_url;

        const new_payment = await this.paymentRepository.save(payment);
        return { payment_url: new_payment.payment_url, invoice_id: invoiceId };
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async commitTask(task: Task) {
    const url = process.env.FINANCE_API_ENDPOINT + '/tasks/';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    // Set Time to 0, 0, 0
    const taskDate = new Date(task.taskStartTime);
    taskDate.setHours(0, 0, 0);

    // Get Task Duration
    const taskDuration = task.order.estimate.estimate['total_time_per_task'];

    const data = {
      task: {
        id: task.id,
        date: taskDate,
        start_time: task.taskStartTime,
        end_time: task.taskEndTime,
        estimate_time: taskDuration,
      },
      customer: {
        id: task.order.customerId,
      },
      order: {
        id: task.order.id,
      },
      worker: {
        id: task.workerId ?? 0,
      },
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async getEstimateOvertime(orderId: string) {
    const url = process.env.FINANCE_API_ENDPOINT + '/works/overtime';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        estimate: {
          customer_address: true,
        },
      },
    });

    if (!order) {
      return new HttpException('Invalid Order Id', HttpStatus.NOT_FOUND);
    }

    const data = {
      order: {
        id: order.id,
      },
      customer: {
        id: order.customer.id,
      },
      microarea_details:
        this.customersService.getMicroareaDetailsByCustomerAddressId(
          order.estimate.customer_address.id,
        ),
      estimate: order.estimate.estimate,
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async createInvoiceOvertime(order: Order) {
    const url = process.env.FINANCE_API_ENDPOINT + '/invoice/overtime';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const overtimeEstimate = await this.getEstimateOvertime(order.id);

    const data = {
      customer: {
        id: order.customer.id,
        name: order.customer.name,
      },
      order: {
        id: order.id,
      },
      microarea_details:
        await this.customersService.getMicroareaDetailsByCustomerAddressId(
          order.estimate.customer_address.id,
        ),
      estimate: overtimeEstimate,
    };

    // send POST request to finance API
    const response = await this.httpService.post(url, data, { headers }).pipe(
      map(async (res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        const invoiceResponse: any = res;
        const _invoice: Invoice = new Invoice();
        // _invoice.id = invoiceResponse.data.id;
        _invoice.type = InvoiceType.primary;
        _invoice.order = order;
        _invoice.invoice = invoiceResponse;
        Object.assign(_invoice, invoiceResponse);
        return await this.invoiceRepository.save(_invoice);
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async createPaymentOvertime(
    orderId: string,
    paymentMethod: PaymentMethodForCustomers,
  ) {
    // Create Invoice
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        customer: true,
        estimate: {
          customer_address: true,
        },
      },
    });

    if (!order) {
      return new HttpException('Invalid Order Id', HttpStatus.NOT_FOUND);
    }

    // Create Overtime Invoice
    const invoice: Invoice = await this.createInvoiceOvertime(order);

    // Get Customer from Invoice
    const customer: Customer = invoice.order.customer;

    const url = process.env.FINANCE_API_ENDPOINT + '/payments/create';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };
    const invoiceId = invoice.id;
    const data = {
      invoice: {
        id: invoice.id,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone_number,
        address: 'Dhaka, Bangladesh',
      },
      payment_method: paymentMethod,
    };

    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    return await lastValueFrom(response)
      .then(async (res) => {
        const payment: Payment = new Payment();
        payment.invoice = await this.invoiceRepository.findOne({
          where: { id: invoiceId },
        });
        payment.payment_method = paymentMethod;
        payment.payment_url = res.data.payment_url;

        const new_payment = await this.paymentRepository.save(payment);
        return { payment_url: new_payment.payment_url, invoice_id: invoiceId };
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async updateOrderStatusAfterPayment(
    orderId: string,
    orderStatus: OrderStatuses,
  ) {
    const order: Order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        orderStatuses: true,
      },
      order: {
        orderStatuses: {
          createdAt: 'DESC',
        },
      },
    });

    if (!order) {
      return new HttpException('Invalid order id', HttpStatus.BAD_REQUEST);
    }

    const orderStatusEntity: OrderStatus = new OrderStatus();
    orderStatusEntity.order = order;
    orderStatusEntity.status = orderStatus;
    await this.orderStatusRepository.save(orderStatusEntity);
    order.orderStatuses.push(orderStatusEntity);

    this.logger.log(`📦 Order ${order.id} status updated to ${orderStatus}`);

    return;
  }
}
