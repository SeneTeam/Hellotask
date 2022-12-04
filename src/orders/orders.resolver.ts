import {
  Resolver,
  Query,
  Mutation,
  Args,
  ObjectType,
  Field,
  Subscription,
} from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { EstimateOrderInput } from './dto/estimate-order.input';
import { Inject, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { CurrentUser } from 'src/auth/gql.user.decorator';
import { OrderEstimationResponse } from './dto/estimate-order.output';
import { Customer } from 'src/customers/entities/customer.entity';
import { Weekend } from './orders.holiday.enum';
import {
  Payment,
  PaymentMethodForCustomers,
} from 'src/finance/entities/payment.entity';
import { FinanceService } from 'src/finance/finance.service';
import { PaymentUrlOutput } from './dto/payment-url.output';
import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PUB_SUB } from 'src/pub-sub/pub-sub.module';
import { Worker } from 'src/workers/entities/worker.entity';
import { PaginateInput } from 'src/common/dto/paginate.input';
import { IvrResponseSub } from 'src/ivr/dto/ivr-response-sub';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(FinanceService) private readonly financeService: FinanceService,
    @Inject(PUB_SUB) private pubSub: RedisPubSub,
  ) {}

  // estimate order query
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Order)
  @Query(() => OrderEstimationResponse, { name: 'estimateOrder' })
  async estimateOrder(
    @Args('estimateOrderInput') estimateOrderInput: EstimateOrderInput,
    @CurrentUser() user,
  ) {
    return this.ordersService.estimate(user, estimateOrderInput);
  }

  // placeOrder mutation
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Order)
  @Mutation(() => Order)
  async placeOrder(
    @CurrentUser() customer: Customer,
    @Args('orderStartTime') orderStartTime: Date,
    @Args('weekend', { nullable: true }) weekend: Weekend,
  ) {
    return await this.ordersService.placeOrder(
      customer,
      orderStartTime,
      weekend,
    );
  }

  // @UseGuards(GqlAuthGuard, AccessGuard)
  // @UseAbility(Actions.read, Order)
  // @Query(() => Order, { name: 'getOrderById' })
  // async getOrderById(@Args('id', { type: () => String }) id: string) {
  //   return await this.ordersService.getOrderById(id);
  // }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Order)
  @Query(() => [Order], { name: 'getAllOrders' })
  async getAllOrders(
    @Args('paginate', { nullable: true, defaultValue: { skip: 0, take: 10 } })
    paginateInput: PaginateInput,
  ) {
    return await this.ordersService.getAllOrders(paginateInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Order)
  @Query(() => [Order], { name: 'getOrdersByCustomerId' })
  async getOrdersByCustomerId(
    @Args('paginate', { nullable: true, defaultValue: { skip: 0, take: 10 } })
    paginateInput: PaginateInput,
    @CurrentUser() customer: Customer,
  ) {
    return await this.ordersService.getOrdersByCustomerId(
      paginateInput,
      customer.id,
    );
  }

  // createPaymentUrl mutation
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Order)
  @Mutation(() => PaymentUrlOutput, { name: 'createPaymentUrl' })
  async createPaymentUrl(
    @Args('orderId') orderId: string,
    // @Args('invoiceId') invoiceId: string,
    @Args('paymentMethod') paymentMethod: PaymentMethodForCustomers,
  ) {
    return await this.financeService.createPayment(orderId, paymentMethod);
  }

  @Subscription(() => Payment, {
    name: 'paymentReceived',
    filter(payload, variables) {
      return payload.paymentReceived.invoice.id === variables.invoiceId;
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IpnListener(@Args('invoiceId') invoiceId: string) {
    return this.pubSub.asyncIterator('paymentReceived');
  }

  @Subscription(() => IvrResponseSub, {
    name: 'ivrResponse',
    filter(payload, variables) {
      return payload.ivrResponse.call.order.id === variables.orderId;
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IvrResponseListener(@Args('orderId') orderId: string) {
    return this.pubSub.asyncIterator('ivrResponse');
  }

  @Subscription(() => Order, {
    name: 'newOrder',
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  newOrderListener() {
    return this.pubSub.asyncIterator('newOrder');
  }

  // mutation getAllActiveOrdersByMicroareaId
  @Query(() => [Worker], { name: 'getFreeWorkers' })
  async getFreeWorkers(@Args('microareaId') microareaId: number) {
    const taskTimeList = [
      {
        taskStartTime: new Date('2023-10-04T00:14:00.000Z'),
        taskEndTime: new Date('2023-10-04T08:15:00.000Z'),
      },
      // {
      //   startTime: new Date('2022-10-05T02:10:00.000Z'),
      //   endTime: new Date('2022-10-05T08:15:00.000Z'),
      // },
    ];
    return await this.ordersService.getFreeWorkers(microareaId, taskTimeList);
  }

  // query to get order by id
  @Query(() => Order, { name: 'getOrderById', nullable: true })
  async getOrderById(@Args('id', { type: () => String }) id: string) {
    return await this.ordersService.getOrderById(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.cancel, Order)
  @Mutation(() => Order, { name: 'cancelOrder' })
  async cancelOrder(@Args('orderId', { type: () => String }) orderId: string) {
    return await this.ordersService.cancelOrder(orderId);
  }

  @Mutation(() => Order, { name: 'updateOrderDisclaimer' })
  async updateOrderDisclaimer(
    @Args('orderId', { type: () => String }) orderId: string,
  ) {
    return await this.ordersService.updateOrderDisclaimer(orderId);
  }
}
