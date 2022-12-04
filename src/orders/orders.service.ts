import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EstimateOrderInput, WorksInput } from './dto/estimate-order.input';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Between, In, MoreThan, Not, Raw, Repository } from 'typeorm';
import { CustomersService } from 'src/customers/customers.service';
import { LocationsService } from 'src/locations/locations.service';
import { Microarea } from 'src/locations/entities/microarea.entity';
import { CustomerFactors } from 'src/customers/dto/customer-factors';
import { lastValueFrom, map } from 'rxjs';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrderEstimationResponse } from './dto/estimate-order.output';
import { Estimate } from './entities/estimate.entity';
import { PackagesService } from 'src/packages/packages.service';
import { Weekend } from './orders.holiday.enum';
import { Package } from 'src/packages/entities/package.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { env } from 'process';
import { FinanceService } from 'src/finance/finance.service';
import { Invoice, InvoiceType } from 'src/finance/entities/invoice.entity';
import { OrderStatus, OrderStatuses } from './entities/order-status.entity';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { TaskService } from 'src/task/task.service';
import { Task, TaskStatus } from 'src/task/entities/task.entity';
import { WorkersService } from 'src/workers/workers.service';
import { Worker } from 'src/workers/entities/worker.entity';
import { OrderWorker } from './entities/order-worker.entity';
import { EstimateType } from './dto/estimate.type';
import { getTimeStr } from 'src/common/time-int-to-str';
import { IvrMessageFlag } from 'src/ivr/ivr-msg-flag.enum';
import { IvrCallResponses } from 'src/ivr/entities/ivr_call_responses.entity';
import { IvrPlacedCalls } from 'src/ivr/entities/ivr_placed_calls.entity';
import { PUB_SUB } from 'src/pub-sub/pub-sub.module';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { OrderCancelCallVars } from '../ivr/call_flow_vars/order/order_cancel.vars';
import { IvrService } from '../ivr/ivr.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderWorker)
    private readonly orderWorkerRepository: Repository<OrderWorker>,
    @InjectRepository(Estimate)
    private readonly estimateRepository: Repository<Estimate>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(OrderStatus)
    private readonly orderStatusRepository: Repository<OrderStatus>,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Microarea)
    private readonly microareaRepository: Repository<Microarea>,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(LocationsService)
    private readonly locationsService: LocationsService,
    @Inject(PackagesService)
    private readonly packagesService: PackagesService,
    @Inject(FinanceService)
    private readonly financeService: FinanceService,
    @Inject(WorkersService)
    private readonly workersService: WorkersService,
    @Inject(IvrService)
    private readonly ivrService: IvrService,

    @InjectRepository(IvrPlacedCalls)
    private readonly ivrPlacedCallsRepository: Repository<IvrPlacedCalls>,
    @InjectRepository(IvrCallResponses)
    private readonly ivrCallResponsesRepository: Repository<IvrCallResponses>,

    @InjectQueue('orders') private readonly ordersQueue: Queue,
    // @Inject(forwardRef(() => TaskService))
    // private readonly taskService: TaskService,
    @Inject(PUB_SUB) private pubSub: RedisPubSub,
  ) {}
  private logger = new Logger('OrdersService');
  async validateWorks(estimateOrderInput: EstimateOrderInput) {
    var min_duration = 0;
    var max_duration = 0;
    var total_time_min = 0;
    var total_time_max = 0;

    const customerAddress = await this.customersService.getCustomerAddressById(
      estimateOrderInput.customerAddressId,
    );
    const customerAddressMicroareas: Microarea[] =
      await this.locationsService.resolveLocation(
        customerAddress.location.coordinates[0],
        customerAddress.location.coordinates[1],
      );
    const worksResponse = await this.customersService.getWorkforMicroarea(
      customerAddressMicroareas[0],
      estimateOrderInput.customerAddressId,
      await this.customersService.getCustomerFactors(
        estimateOrderInput.customerAddressId,
      ),
    );

    const works = worksResponse.works;

    // for each work in estimateOrderInput.works
    for (const work of estimateOrderInput.works) {
      // get work from works key same as work.work_id
      const workFromWorks = works[work.work_id];
      // check if work is available
      if (!workFromWorks || !workFromWorks.available) {
        throw new HttpException(
          'Work ' + work.work_id + ' is not available',
          HttpStatus.BAD_REQUEST,
        );
      }
      const _package = await this.packagesService.getPackgeById(
        estimateOrderInput.packageId,
      );

      if (_package['title'] === 'Instant') {
        min_duration = workFromWorks.min_duration_single_task;
        max_duration = workFromWorks.max_duration;
        total_time_min = workFromWorks.total_time_min_single_task;
        total_time_max = workFromWorks.total_time_max_single_task;
      } else {
        min_duration = workFromWorks.min_duration;
        max_duration = workFromWorks.max_duration;
        total_time_min = workFromWorks.total_time_min;
        total_time_max = workFromWorks.total_time_max;
      }

      if (work.time < min_duration) {
        throw new HttpException(
          'Work ' +
            work.work_id +
            ' requires minimum time of ' +
            workFromWorks.min_duration +
            ' minutes',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (work.time > max_duration) {
        throw new HttpException(
          'Work ' +
            work.work_id +
            ' exceeds maximum time of ' +
            workFromWorks.max_duration +
            'minutes',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let totalWorkTime = 0;
    estimateOrderInput.works.forEach((work) => {
      totalWorkTime += work.time;
    });

    if (totalWorkTime > total_time_max) {
      throw new HttpException(
        'Total work time exceeds maximum work time',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (totalWorkTime < total_time_min) {
      throw new HttpException(
        'Total work time is less than minimum required work time',
        HttpStatus.BAD_REQUEST,
      );
    }

    return estimateOrderInput.works;
  }

  async getEstimationFromApi(
    customerId: string,
    customerFactors: CustomerFactors,
    microareaDetails: any,
    task_count: number,
    works: WorksInput[],
    promoCode?: string,
  ) {
    const url = process.env.FINANCE_API_ENDPOINT + '/works/estimate';
    const apiKey = process.env.FINANCE_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    };

    const data = {
      customer: {
        id: customerId,
        factors: customerFactors,
      },
      microarea_details: microareaDetails,
      tasks_count: task_count,
      promo_code: promoCode,
      works: works,
    };

    // send POST request to finance API
    const response = await this.httpService.post(url, data, { headers }).pipe(
      map((res) => {
        return res.data;
      }),
    );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async estimate(customer: any, estimateOrderInput: EstimateOrderInput) {
    const works = await this.validateWorks(estimateOrderInput);
    const customerFactors: CustomerFactors =
      await this.customersService.getCustomerFactors(
        estimateOrderInput.customerAddressId,
      );

    const microareaDetails =
      await this.customersService.getMicroareaDetailsByCustomerAddressId(
        estimateOrderInput.customerAddressId,
      );

    const estimation: OrderEstimationResponse = await this.getEstimationFromApi(
      customer.id,
      customerFactors,
      microareaDetails,
      // estimateOrderInput.taskCount,
      await (
        await this.packagesService.getPackgeById(estimateOrderInput.packageId)
      ).task_count,
      works,
      estimateOrderInput.promoCode,
    );

    const activeWorkers =
      await this.workersService.getActiveWorkersByMicroareaId(
        microareaDetails.microarea_id,
      );

    if (activeWorkers.length === 0) {
      return new HttpException(
        'No maids available in your area.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const estimate: Estimate = new Estimate();
    estimate.estimate = JSON.parse(JSON.stringify(estimation));
    estimate.customer = customer;
    estimate.customer_address =
      await this.customersService.getCustomerAddressById(
        estimateOrderInput.customerAddressId,
      );

    // convert estimation.validity to utc date and set to estimate.validity
    estimate.validity = new Date(Date.parse(estimation.validity));

    // get package
    const _package: Package = await this.packagesService.getPackgeById(
      estimateOrderInput.packageId,
    );

    if (!_package) {
      throw new HttpException('Invalid package id', HttpStatus.BAD_REQUEST);
    }

    estimate._package = _package;
    estimate.work_count = works.length;
    estimate.worker_commission = estimation.pricing.worker;
    await this.estimateRepository.save(estimate);

    return estimation;
  }

  async getAllOrders(paginateInput: PaginateInput) {
    const orders: Order[] = await this.orderRepository.find({
      skip: paginateInput.skip,
      take: paginateInput.take,
      relations: {
        customer: true,
        estimate: {
          _package: true,
        },
        orderStatuses: true,
        ivrPlacedCalls: {
          responses: true,
          worker: true,
        },
        OrderWorkers: {
          worker: true,
        },
        invoices: {
          payments: true,
        },
      },
      order: {
        orderPlacedAt: 'DESC',
      },
    });

    return orders;
  }

  async getOrderById(id: string) {
    // query order by id in db with relations
    return await this.orderRepository.findOne({
      where: { id: id },
      relations: {
        orderStatuses: true,
        ivrPlacedCalls: {
          responses: true,
          worker: true,
        },
        microarea: true,
        OrderWorkers: {
          worker: true,
        },
        customer: true,
        estimate: {
          _package: true,
        },
        invoices: {
          payments: true,
        },
        tasks: true,
        potentialWorkers: true,
      },
      order: {
        orderStatuses: {
          createdAt: 'DESC',
        },
      },
    });
  }

  async getOrdersByCustomerId(
    paginateInput: PaginateInput,
    customerId: string,
  ) {
    const orders = await this.orderRepository.find({
      skip: paginateInput.skip,
      take: paginateInput.take,
      where: { customerId: customerId },
      relations: {
        orderStatuses: true,
        ivrPlacedCalls: {
          responses: true,
        },
        microarea: true,
        OrderWorkers: {
          worker: true,
        },
        estimate: {
          _package: true,
        },
        invoices: {
          payments: true,
        },
        tasks: true,
        // potentialWorkers: {
        //   ivrPlacedCalls: {
        //     worker: true,
        //     order: true,
        //     responses: true,
        //   },
        // },
      },
      order: {
        orderPlacedAt: 'DESC',
        // orderStatuses: {
        //   createdAt: 'DESC',
        // },
      },
    });

    orders.map((order) => {
      order.orderStatuses.sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    });

    return orders;
  }

  async getEstimateById(id: string) {
    // query estimate by id in db
    return await this.estimateRepository.findOne({ where: { id } });
  }

  async validateOrder(
    estimate: Estimate,
    orderStartTime: Date,
    weekend: Weekend,
  ): Promise<boolean> {
    // if estimate._packgage.has_weekend is true and weekend is not provided throw error
    if (estimate._package.has_weekend && !weekend) {
      throw new HttpException(
        'Weekend is required for this order package',
        HttpStatus.BAD_REQUEST,
      );
    }

    // if estimate._packgage.has_weekend is false and weekend is provided throw error
    if (!estimate._package.has_weekend && weekend) {
      throw new HttpException(
        'Weekend is not applicable for this order package',
        HttpStatus.BAD_REQUEST,
      );
    }

    // type casting estimate.estimate to EstimateType
    const _estimate: EstimateType = estimate.estimate as any as EstimateType;

    // get work hours for all works
    const TaskMins = _estimate.works.map((work) => work.work_time);

    // calculate total work duration in minutes
    const totalTaskMins = TaskMins.reduce((a, b) => a + b, 0);

    // calculate order end time by adding total work duration to order start time
    const orderEndTime: Date = new Date(orderStartTime);
    orderEndTime.setMinutes(orderEndTime.getMinutes() + totalTaskMins);

    // get allowed order start time
    const dayStartTime = parseInt(env.DAY_START_TIME);

    // get allowed work end time
    const workEndTime = parseInt(env.WORK_END_TIME);

    // allowedStartTime is on the next day of orderStartTime and in the time of dayStartTime
    const allowedStartTime = new Date(
      orderStartTime.getFullYear(),
      orderStartTime.getMonth(),
      orderStartTime.getDate(),
      dayStartTime / 100,
      dayStartTime % 100,
    );

    // allowedEndTime is on the next day of orderEndTime and in the time of dayEndTime
    const allowedEndTime = new Date(
      orderStartTime.getFullYear(),
      orderStartTime.getMonth(),
      orderStartTime.getDate(),
      workEndTime / 100,
      workEndTime % 100,
    );
    console.log(orderStartTime, orderEndTime, allowedStartTime, allowedEndTime);

    // if orderStartTime is before allowedStartTime throw error
    if (orderStartTime < allowedStartTime || orderStartTime > allowedEndTime) {
      throw new HttpException(
        'Order start time is before allowed start time',
        // 'Please order between 7:00 AM to 6:00 PM',
        HttpStatus.BAD_REQUEST,
      );
    }

    // if orderEndTime is after allowedEndTime throw error
    if (orderEndTime > allowedEndTime) {
      throw new HttpException(
        'Your task end time is after allowed end time (9:00 PM)',
        // 'Please order between 7:00 AM to 6:00 PM',
        HttpStatus.BAD_REQUEST,
      );
    }

    return true;
  }

  async getTaskDateList(order: Order) {
    // get task_count number of work date from order start date excluding weekends
    const taskStartDates = this.getWorkDates(
      order.orderStartTime,
      order.estimate._package.task_count,
      order.weekend,
    );

    // type casting order.estimate.estimate to EstimateType
    const estimate: EstimateType = order.estimate
      .estimate as any as EstimateType;

    // get all work hours
    const TaskMins = estimate.works.map((work) => work.work_time);

    // get total work hours
    const totalTaskMins = TaskMins.reduce((a, b) => a + b, 0);

    return this.getWorkStartAndEndTimes(
      taskStartDates, // array of task start dates
      totalTaskMins, // total work hours
    );
  }

  getSearchDelay(): number {
    // get current time
    const now = new Date();

    // get allowed search time
    const dayStartTime = parseInt(env.DAY_START_TIME);
    const dayEndTime = parseInt(env.DAY_END_TIME);

    // get only hour and minutes from current time in HHMM format as an integer
    const nowInt = parseInt(now.toISOString().slice(11, 16).replace(':', ''));

    // if nowInt is within dayStartTime and dayEndTime return 10 ms
    if (nowInt >= dayStartTime && nowInt <= dayEndTime) {
      return parseInt(env.MINIMUM_SEARCH_DELAY);
    }

    if (nowInt > dayEndTime && nowInt <= 2359) {
      const nextDayStartTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        dayStartTime / 100,
        dayStartTime % 100,
      );

      return nextDayStartTime.getTime() - now.getTime();
    }

    if (nowInt >= 0 && nowInt < dayStartTime) {
      const nextDayStartTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        dayStartTime / 100,
        dayStartTime % 100,
      );

      return nextDayStartTime.getTime() - now.getTime();
    }
  }

  async placeOrder(customer: Customer, orderStartTime: Date, weekend: Weekend) {
    const unpaidOrders = await this.orderRepository.find({
      where: {
        customerId: customer.id,
      },
      relations: {
        orderStatuses: true,
      },
      order: {
        orderStatuses: {
          createdAt: 'DESC',
        },
      },
    });

    for (const order of unpaidOrders) {
      if (order.orderStatuses[0].status === OrderStatuses.payment_pending) {
        return new HttpException(
          'You have an unpaid order',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // get last estimate for customer where validity is greater than current date
    const estimate: Estimate = await this.estimateRepository.findOne({
      where: { customerId: customer.id, validity: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
      relations: ['customer', 'customer_address', '_package'],
    });

    if (!estimate) {
      throw new HttpException(
        'No valid estimate found for customer',
        HttpStatus.BAD_REQUEST,
      );
    }

    // if estimate has already been ordered throw error
    const estimateOrdered = await this.orderRepository.findOne({
      where: { estimateId: estimate.id },
    });

    if (estimateOrdered) {
      throw new HttpException(
        'Estimate has already been ordered',
        HttpStatus.BAD_REQUEST,
      );
    }

    // validate order
    await this.validateOrder(estimate, orderStartTime, weekend);

    // create order
    const order: Order = new Order();
    order.customer = customer;
    order.estimate = estimate;
    order.orderStartTime = orderStartTime;
    order.orderPlacedAt = new Date();
    order.weekend = weekend;
    order.totalTimePerTask = estimate.estimate['total_time_per_task'];

    // getMicroareaDetailsByCustomerAddressId
    const microareaDetails =
      await this.customersService.getMicroareaDetailsByCustomerAddressId(
        estimate.customerAddressId,
      );

    order.microarea = await this.locationsService.findOneMicroareaById(
      microareaDetails.microarea_id,
    );

    // save order
    const stored_order: Order = await this.orderRepository.save(order);

    // update order status to placed
    await this.updateOrderStatus(stored_order.id, OrderStatuses.placed);

    this.logger.log(
      `📦 Order ${stored_order.id} placed for customer ${customer.name}`,
    );

    const job = await this.ordersQueue.add(
      'searchWorker',
      { order_id: stored_order.id },
      {
        delay: this.getSearchDelay(),
        attempts: 1,
      },
    );

    const freeWorkers: Worker[] = await this.getFreeWorkers(
      microareaDetails.microarea_id,
      await this.getTaskDateList(stored_order),
    );
    stored_order.potentialWorkers = freeWorkers;

    stored_order.initialWorkerSearchJobId = Number(job.id);
    // stored_order.initialWorkerSearchStartTime = now + this.getSearchDelay()
    stored_order.initialWorkerSearchStartTime = new Date(
      new Date().getTime() + this.getSearchDelay(),
    );

    await this.orderRepository.save(stored_order);

    this.pubSub.publish('newOrder', {
      newOrder: stored_order,
    });

    return stored_order;
  }

  async updateOrderStatus(orderId: string, orderStatus: OrderStatuses) {
    // get order by id
    const order: Order = await this.getOrderById(orderId);
    if (!order) {
      return new HttpException('Invalid order id', HttpStatus.BAD_REQUEST);
    }

    const orderStatusEntity: OrderStatus = new OrderStatus();
    orderStatusEntity.order = order;
    orderStatusEntity.status = orderStatus;
    await this.orderStatusRepository.save(orderStatusEntity);
    order.orderStatuses.push(orderStatusEntity);

    this.logger.log(`📦 Order ${order.id} status updated to ${orderStatus}`);

    if (orderStatus === OrderStatuses.cancelled_without_penalty) {
      //create a new order cancel call flow
      let worker_id = 0;
      order.ivrPlacedCalls.forEach(async (call) => {
        call.responses.forEach(async (_response) => {
          if (_response.messageFlag === 'worker_accepted') {
            worker_id = _response.response['worker_id'];
          }
        });
      });

      if (worker_id !== 0) {
        const worker = await this.workersService.findOneWorkerById(worker_id);
        if (worker) {
          const orderCancelCallVars: OrderCancelCallVars =
            await OrderCancelCallVars.init(order, worker);

          const call = await this.ivrService.placeIVRCall(
            'ORDER_CANCEL_CALL',
            orderCancelCallVars,
            order,
            worker,
          );

          await this.ivrService.updateIvrCallResponse(
            call,
            null,
            IvrMessageFlag.work_cancelled,
            `✅ Customer canceled the order after worker accepted`,
          );

          this.logger.log(
            `📦 Order ${order.id} cancel call flow initiated for ${worker.bangla_name}`,
          );
        }
      }
    }

    return await this.orderRepository.save(order);
  }

  getWorkDates(
    orderStartTime: Date,
    task_count: number,
    weekend: Weekend,
  ): Date[] {
    orderStartTime = new Date(orderStartTime);

    const workDates: Date[] = [];
    let i = 0;
    while (i < task_count) {
      // increment orderStartTime by 1 day
      orderStartTime.setDate(orderStartTime.getDate() + 1);
      const dayName = orderStartTime.toLocaleString('en-us', {
        weekday: 'long',
      });
      if (dayName !== weekend) {
        // push a copy of orderStartTime to workDates
        workDates.push(new Date(orderStartTime));
        i++;
      }
    }
    return workDates;
  }

  getWorkStartAndEndTimes(workStartDates: Date[], taskTimeMins: number) {
    const workStartAndEndTimes: { taskStartTime: Date; taskEndTime: Date }[] =
      [];

    workStartDates.forEach((workStartDate) => {
      const workStartTime: Date = new Date(workStartDate);
      const workEndTime: Date = new Date(workStartDate);
      workEndTime.setMinutes(workEndTime.getMinutes() + taskTimeMins);
      workStartAndEndTimes.push({
        taskStartTime: workStartTime,
        taskEndTime: workEndTime,
      });
    });

    return workStartAndEndTimes;
  }

  async getFreeWorkers(
    microareaId: number,
    taskTimeList: { taskStartTime: Date; taskEndTime: Date }[],
  ) {
    // getAllActiveWorkersByMicroareaId
    const activeWorkers: Worker[] =
      await this.workersService.getActiveWorkersByMicroareaId(microareaId);

    // get all orders in the microarea sorted by orderstatuses.created_at desc and orderworker.assignAt desc
    const orders: Order[] = await this.orderRepository.find({
      where: {
        microarea: {
          id: microareaId,
        },
      },
      relations: {
        orderStatuses: true,
        microarea: true,
        tasks: true,
        OrderWorkers: {
          worker: true,
        },
      },
      order: {
        orderStatuses: {
          createdAt: 'DESC',
        },
        OrderWorkers: {
          assignedAt: 'DESC',
        },
      },
    });

    // get all active orders in the microarea
    const activeOrders: Order[] = [];
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        if (
          order.orderStatuses.length > 0 &&
          order.orderStatuses[0].status === OrderStatuses.accepted
        ) {
          activeOrders.push(order);
        }
      });
    } else {
      return activeWorkers;
    }

    const conflictOrders: Order[] = [];
    // for all active orders
    activeOrders.forEach((order) => {
      // for all tasks in order
      order.tasks.forEach((task) => {
        // for all taskTimeList
        taskTimeList.forEach((taskTime) => {
          // if task.taskStartTime < sampleTaskTime.taskStartTime && task.taskEndTime > sampleTaskTime.taskStartTime
          // or if task.taskStartTime >= sampleTaskTime.taskStartTime && task.taskStartTime > sampleTaskTime.taskEndTime
          if (
            // (task.taskStartTime < taskTime.taskStartTime &&
            //   task.taskEndTime > taskTime.taskStartTime) ||
            // (task.taskStartTime >= taskTime.taskStartTime &&
            //   task.taskStartTime <= taskTime.taskEndTime)
            task.taskStartTime <= taskTime.taskEndTime ||
            task.taskEndTime >= taskTime.taskStartTime
          ) {
            // push order to conflictOrders
            conflictOrders.push(order);
          }
        });
      });
    });

    if (!conflictOrders || conflictOrders.length === 0) {
      return activeWorkers;
    }

    // filter out conflictOrders.OrderWorkers.worker from activeWorkers
    return activeWorkers.filter((activeWorker) => {
      return !conflictOrders.some((conflictOrder) => {
        return conflictOrder.OrderWorkers.some(
          (orderWorker) => orderWorker.worker.id === activeWorker.id,
        );
      });
    });
  }

  async ifWorkerServedForCustomer(worker_id: number, customer_id: string) {
    const orders: Order[] = await this.orderRepository.find({
      where: {
        customer: {
          id: customer_id,
        },
      },
      relations: {
        OrderWorkers: {
          worker: true,
        },
      },
    });

    if (orders && orders.length > 0) {
      return orders.some((order) => {
        return order.OrderWorkers.some(
          (orderWorker) => orderWorker.worker.id === worker_id,
        );
      });
    }

    return false;
  }

  async getNextWorkerToCall(order_id: string, is_backup = false) {
    const order: Order = await this.getOrderById(order_id);
    if (!order) {
      throw new HttpException('Invalid order id', HttpStatus.BAD_REQUEST);
    }

    let potentialWorkers: Worker[];

    if (!is_backup) {
      potentialWorkers = order.potentialWorkers;
    } else {
      potentialWorkers = order.potentialBackupWorkers;
    }

    const searchCursor: number = order.searchCursor % potentialWorkers.length;

    if (
      order.orderStatuses.some((orderStatus) => {
        return orderStatus.status === OrderStatuses.accepted;
      })
    ) {
      return null;
    }
    if (
      order.searchCursor >
      parseInt(env.MAX_RETRY_PER_WORKER) * potentialWorkers.length
    ) {
      if (
        order.orderStatuses.some((orderStatus) => {
          return orderStatus.status === OrderStatuses.failed;
        })
      ) {
        return null;
      }
      await this.updateOrderStatus(order_id, OrderStatuses.failed);
      return null;
    }

    const calls = await this.ivrPlacedCallsRepository.find({
      where: {
        order: {
          id: order_id,
        },
        worker: {
          id: potentialWorkers[searchCursor].id,
        },
      },
      relations: {
        responses: true,
      },
      order: {
        responses: {
          createdAt: 'DESC',
        },
      },
    });

    try {
      if (
        calls[0].responses[0].retryCount > parseInt(env.MAX_RETRY_PER_WORKER) ||
        calls[0].responses[0].messageFlag === IvrMessageFlag.worker_rejected
      ) {
        // this worker has reached max retry count
        order.searchCursor++;
        await this.orderRepository.save(order);
        return this.getNextWorkerToCall(order_id);
      }
    } catch (err) {}

    order.searchCursor++;
    await this.orderRepository.save(order);
    return potentialWorkers[searchCursor];
  }

  async scheduleCall(order_id: string) {
    await this.ordersQueue.add(
      'callWorker',
      {
        order_id: order_id,
      },
      {
        delay: 20,
        attempts: 1,
      },
    );
    return true;
  }

  async callOrderConfirmation(order_id: string, worker_id: number) {
    await this.ordersQueue.add(
      'orderConfirmationCall',
      {
        order_id: order_id,
        worker_id: worker_id,
      },
      {
        delay: 60000,
        attempts: 1,
      },
    );
  }

  async callWorkerReminder(order_id: string, worker_id: number) {
    // calculate delay time
    const order: Order = await this.orderRepository.findOne({
      where: {
        id: order_id,
      },
      relations: {
        ivrPlacedCalls: {
          responses: true,
        },
      },
    });

    const acceptedResponse = order.ivrPlacedCalls.map((call) => {
      return call.responses.find((response) => {
        return response.messageFlag === IvrMessageFlag.worker_accepted;
      });
    });

    const result = acceptedResponse.filter(function (e) {
      return e != null;
    });

    const eta = result[0]['response']['eta'];
    const orderStartTime = order.orderStartTime;
    const eta_time = new Date(orderStartTime.getTime() - eta * 60000);
    const delay = eta_time.getTime() - new Date().getTime();

    await this.ordersQueue.add(
      'workerReminderCall',
      {
        order_id: order_id,
        worker_id: worker_id,
      },
      {
        delay: delay,
        attempts: 2,
      },
    );

    this.logger.log(
      `a new reminder call created for order ${order_id} and worker ${worker_id} at ${eta_time}`,
    );
  }

  async taskWorkerTrackingETA50Passed(
    order_id: string,
    worker_id: number,
    _package: string,
  ) {
    // calculate delay time
    const order: Order = await this.orderRepository.findOne({
      where: {
        id: order_id,
      },
      relations: {
        ivrPlacedCalls: {
          responses: true,
        },
      },
    });

    const acceptedResponse = order.ivrPlacedCalls.map((call) => {
      return call.responses.find((response) => {
        return response.messageFlag === IvrMessageFlag.worker_accepted;
      });
    });

    const result = acceptedResponse.filter(function (e) {
      return e != null;
    });

    const eta = result[0]['response']['eta'];
    const eta50 = eta / 2;
    let delay = 0;

    if (_package == 'Monthly') {
      const orderStartTime = order.orderStartTime;
      const eta_time = new Date(orderStartTime.getTime() - eta50 * 60000);
      delay = eta_time.getTime() - new Date().getTime();
    }

    if (_package == 'Instant') {
      const orderStartTime = new Date();
      const eta_time = new Date(orderStartTime.getTime() + eta50 * 60000);
      delay = eta_time.getTime() - new Date().getTime();
    }

    await this.ordersQueue.add(
      'taskWorkerTrackingETA50Passed',
      {
        order_id: order_id,
        worker_id: worker_id,
      },
      {
        delay: delay,
        attempts: 2,
      },
    );
  }

  async cancelOrder(order_id: string) {
    const order = await this.getOrderById(order_id);

    if (!order) {
      return new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    if (
      order.orderStatuses[0].status === OrderStatuses.cancelled_without_penalty
    ) {
      return new HttpException(
        'Order is already canceled without penalty',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      order.orderStatuses[0].status === OrderStatuses.cancelled_with_penalty
    ) {
      return new HttpException(
        'Order is already canceled with penalty',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.updateOrderStatus(
      order_id,
      OrderStatuses.cancelled_without_penalty,
    );

    order.tasks.forEach(async (task) => {
      if (task.taskStatus === TaskStatus.PENDING) {
        await this.taskRepository.update(task.id, {
          taskStatus: TaskStatus.CANCELLED,
        });
      }
    });

    return order;
  }

  async updateOrderDisclaimer(order_id: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: order_id,
      },
    });

    if (!order) {
      return new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    if (order.is_disclaimed) {
      return new HttpException(
        'Order is already disclaimed',
        HttpStatus.BAD_REQUEST,
      );
    }

    order.is_disclaimed = true;
    await this.orderRepository.save(order);

    return order;
  }
}
