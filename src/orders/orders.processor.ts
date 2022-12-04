import { $conditions } from '@casl/ability/dist/types/RuleIndex';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { env } from 'process';
import { CustomersResolver } from 'src/customers/customers.resolver';
import { CustomersService } from 'src/customers/customers.service';
import { OrderConfirmationCallVars } from 'src/ivr/call_flow_vars/order/order_confirmation_call.vars';
import { OrderProposalCallVars } from 'src/ivr/call_flow_vars/order/order_proposal_call.vars';
import { IvrCallResponses } from 'src/ivr/entities/ivr_call_responses.entity';
import { IvrPlacedCalls } from 'src/ivr/entities/ivr_placed_calls.entity';
import { IvrCallTypes } from 'src/ivr/ivr-call-types.enum';
import { IvrMessageFlag } from 'src/ivr/ivr-msg-flag.enum';
import { IvrService } from 'src/ivr/ivr.service';
import { PUB_SUB } from 'src/pub-sub/pub-sub.module';
import { TaskService } from 'src/task/task.service';
import { Worker } from 'src/workers/entities/worker.entity';
import { WorkersService } from 'src/workers/workers.service';
import { ArrayContains, Not, Repository } from 'typeorm';
import { TaskReminderCallVars } from '../ivr/call_flow_vars/task/task_reminder_call.vars';
import { TaskWorkerTrackingEta50PassedVars } from '../ivr/call_flow_vars/task/task_worker_tracking_eta_50_passed.vars';
import { NotificationService } from '../notification/notification.service';
import { EstimateType } from './dto/estimate.type';
import { WorkerContainer } from './dto/worker-container';
import { OrderStatuses } from './entities/order-status.entity';
import { OrderWorker, WorkerOrderRole } from './entities/order-worker.entity';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Processor('orders')
export class OrdersConsumer {
  private readonly logger = new Logger('Order Processor');

  constructor(
    @Inject(OrdersService) private readonly ordersService: OrdersService,
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(CustomersService)
    private readonly customerService: CustomersService,
    @Inject(WorkersService)
    private readonly workersService: WorkersService,
    @Inject(IvrService) private readonly ivrService: IvrService,
    @InjectQueue('orders') private readonly ordersQueue: Queue,
    @InjectRepository(IvrPlacedCalls)
    private readonly ivrPlacedCallsRepository: Repository<IvrPlacedCalls>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(PUB_SUB) private pubSub: RedisPubSub,
    @InjectRepository(OrderWorker)
    private readonly orderWorkerRepository: Repository<OrderWorker>,
    @Inject(NotificationService)
    private notificationService: NotificationService,
  ) {}

  @Process('searchWorker')
  async searchWorker(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    // const order = await this.ordersService.getOrderById(order_id);
    const _order = await this.ordersService.getOrderById(order_id);

    if (!_order) {
      throw new BadRequestException('Order not found');
    }

    if (
      _order.orderStatuses[0].status ===
        OrderStatuses.cancelled_without_penalty ||
      _order.orderStatuses[0].status === OrderStatuses.failed
    ) {
      return;
    }

    await this.ordersService.updateOrderStatus(
      _order.id,
      OrderStatuses.searching,
    );

    const order = await this.ordersService.getOrderById(order_id);

    const freeWorkers: Worker[] = await this.ordersService.getFreeWorkers(
      order.microarea.id,
      await this.ordersService.getTaskDateList(order),
    );

    const willingWorkers: Worker[] = [];

    if (freeWorkers.length > 0) {
      for (const freeWorker of freeWorkers) {
        const preferenceResponse =
          await this.workersService.checkIfWorkerOnline(freeWorker.id);
        if (preferenceResponse && preferenceResponse['is_agreed']) {
          const preferedTime =
            await this.workersService.getWorkerTimePreferenceResponse(
              preferenceResponse,
              order.id,
            );

          if (preferedTime) {
            willingWorkers.push(freeWorker);
          }
        }
      }
    }

    // if (freeWorkers.length === 0) {
    //   await this.ordersService.updateOrderStatus(
    //     order.id,
    //     OrderStatuses.failed,
    //   );
    //   return;
    // }

    if (freeWorkers.length === 0 || willingWorkers.length === 0) {
      await this.ordersService.updateOrderStatus(
        order.id,
        OrderStatuses.failed,
      );

      const fcmToken = order.customer.fcm_token;
      const fcmResponse =
        await this.notificationService.sendNotificationToToken(
          fcmToken,
          'Order Failed',
          `There is no availabe worker for your order`,
          '',
          '',
          {
            type: 'order_failed',
            order_id: order.id,
            message: `There is no availabe worker for your order`,
          },
        );
      console.log(fcmResponse);

      return;
    }

    // updating searchable worker count
    delete order.orderStatuses;
    order.potentialWorkers = willingWorkers;
    await this.orderRepository.save(order);

    this.logger.log(
      `🔍👧 Found ${willingWorkers.length} free workers for order id ${order_id}`,
    );

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

    return;
  }

  @Process('callWorker')
  async callWorker(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    const order = await this.ordersService.getOrderById(order_id);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (
      order.orderStatuses[0].status ===
        OrderStatuses.cancelled_without_penalty ||
      order.orderStatuses[0].status === OrderStatuses.failed
    ) {
      return;
    }

    const worker = await this.ordersService.getNextWorkerToCall(
      order.id,
      false,
    );

    if (!worker) {
      const fcmToken = order.customer.fcm_token;
      const fcmResponse =
        await this.notificationService.sendNotificationToToken(
          fcmToken,
          'Order Failed',
          `No worker accetped your order`,
          '',
          '',
          {
            type: 'no_worker_accepted',
            order_id: order.id,
            message: `No worker accetped your order`,
          },
        );
      console.log(fcmResponse);
      return;
    }

    const orderProposalCallVars: OrderProposalCallVars =
      await OrderProposalCallVars.init(
        order,
        worker,
        this.ordersService,
        this.customerService,
      );

    const ivrResponse = await this.ivrService.placeIVRCall(
      'ORDER_PROPOSAL_CALL',
      orderProposalCallVars,
      order,
      worker,
    );
    await this.ordersQueue.add(
      'discardCheck',
      {
        order_id: order_id,
        call_id: ivrResponse.callId,
      },
      {
        delay: parseInt(env.DISCARD_CALL_TIMEOUT),
        attempts: 1,
      },
    );

    return;
  }

  @Process('discardCheck')
  async discardCheck(job: Job<unknown>) {
    const call_id = job.data['call_id'] as string;

    const call: IvrPlacedCalls = await this.ivrPlacedCallsRepository.findOne({
      where: { id: call_id },
      relations: {
        responses: true,
        order: true,
        worker: true,
      },
    });

    if (!call) {
      throw new BadRequestException('Call not found');
    }

    const order = await this.ordersService.getOrderById(call.order.id);

    if (
      order.orderStatuses[0].status === OrderStatuses.cancelled_without_penalty
    ) {
      return;
    }

    if (!order) {
      return;
    }

    // if the call answered
    if (
      call.responses.some(
        (r: IvrCallResponses) =>
          r.messageFlag === IvrMessageFlag.worker_connected,
      )
    ) {
      if (
        call.responses.some(
          (r: IvrCallResponses) =>
            r.messageFlag === IvrMessageFlag.worker_accepted,
        )
      ) {
        return;
      }
      // the call was answered but no conclusive response was given
      // we will consider this call as rejected
      await this.ivrService.updateIvrCallResponse(
        call,
        null,
        IvrMessageFlag.worker_rejected,
        `🚫 Worker could not provide a conclusive response`,
      );

      await this.ordersQueue.add(
        'callWorker',
        {
          order_id: call.order.id,
        },
        {
          // delay: 2000,
          attempts: 1,
        },
      );
    } else {
      await this.ivrService.updateIvrCallResponse(
        call,
        null,
        IvrMessageFlag.worker_not_reachable,
        `💤 is not reachable`,
      );
      await this.ordersQueue.add(
        'callWorker',
        {
          order_id: call.order.id,
        },
        {
          //delay: 2000,
          attempts: 1,
        },
      );
    }
  }

  @Process('orderConfirmationCall')
  async orderConfirmationCall(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    const worker_id = job.data['worker_id'] as number;

    const order = await this.ordersService.getOrderById(order_id);
    const worker = await this.workersService.findOneWorkerById(worker_id);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (
      order.orderStatuses[0].status === OrderStatuses.cancelled_without_penalty
    ) {
      return;
    }

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    const orderConfirmationCallVars: OrderConfirmationCallVars =
      await OrderConfirmationCallVars.init(order, worker, this.customerService);

    const ivrResponse = await this.ivrService.placeIVRCall(
      'ORDER_CONFIRMATION_CALL',
      orderConfirmationCallVars,
      order,
      worker,
    );

    return;
  }

  // -------------------- Backup Worker --------------------

  @Process('searchBackupWorker')
  async searchBackupWorker(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    const order = await this.ordersService.getOrderById(order_id);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    await this.ordersService.updateOrderStatus(
      order.id,
      OrderStatuses.searching_backup,
    );

    const freeWorkers: Worker[] = await this.ordersService.getFreeWorkers(
      order.microarea.id,
      await this.ordersService.getTaskDateList(order),
    );

    // Exclude Worker Already Assigned to Order
    const orderWorkers = await this.orderWorkerRepository.find({
      where: {
        orderId: order.id,
        role: ArrayContains([
          WorkerOrderRole.primary,
          WorkerOrderRole.secondary,
        ]),
      },
    });

    const orderWorkerIds = orderWorkers.map((orderWorker) => {
      return orderWorker.workerId;
    });

    const filteredFreeWorkers = freeWorkers.filter((freeWorker) => {
      return !orderWorkerIds.includes(freeWorker.id.toString());
    });

    if (filteredFreeWorkers.length === 0) {
      await this.ordersService.updateOrderStatus(
        order.id,
        OrderStatuses.failed,
      );
      return;
    }

    // updating searchable worker count
    order.potentialBackupWorkers = filteredFreeWorkers;
    this.orderRepository.save(order);

    this.logger.log(
      `🔍👧 Found ${filteredFreeWorkers.length} free workers for order id ${order_id}`,
    );

    await this.ordersQueue.add(
      'callBackupWorker',
      {
        order_id: order_id,
      },
      {
        delay: 20,
        attempts: 1,
      },
    );

    return;
  }

  @Process('callBackupWorker')
  async callBackupWorker(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    const order = await this.ordersService.getOrderById(order_id);

    if (!order) {
      throw new BadRequestException('Order Not Found');
    }

    const worker = await this.ordersService.getNextWorkerToCall(order.id, true);

    if (!worker) {
      return;
    }

    // Backup Worker Call
    const orderProposalCallVars: OrderProposalCallVars =
      await OrderProposalCallVars.init(
        order,
        worker,
        this.ordersService,
        this.customerService,
      );

    const ivrResponse = await this.ivrService.placeIVRCall(
      'ORDER_PROPOSAL_CALL',
      orderProposalCallVars,
      order,
      worker,
    );
    await this.ordersQueue.add(
      'discardCheck',
      {
        order_id: order_id,
        call_id: ivrResponse.callId,
      },
      {
        delay: parseInt(env.DISCARD_CALL_TIMEOUT),
        attempts: 1,
      },
    );

    return;
  }

  @Process('workerReminderCall')
  async workerReminderCall(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    const worker_id = job.data['worker_id'] as number;

    const order = await this.ordersService.getOrderById(order_id);
    const worker = await this.workersService.findOneWorkerById(worker_id);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (
      order.orderStatuses[0].status === OrderStatuses.cancelled_without_penalty
    ) {
      return;
    }

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    const taskReminderCallVars: TaskReminderCallVars =
      await TaskReminderCallVars.init(order, worker, this.customerService);

    const ivrResponse = await this.ivrService.placeIVRCall(
      'TASK_REMINDER_CALL',
      taskReminderCallVars,
      order,
      worker,
    );

    return;
  }

  @Process('taskWorkerTrackingETA50Passed')
  async taskWorkerTrackingETA50Passed(job: Job<unknown>) {
    const order_id = job.data['order_id'] as string;
    const worker_id = job.data['worker_id'] as number;

    const order = await this.ordersService.getOrderById(order_id);
    const worker = await this.workersService.findOneWorkerById(worker_id);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (
      order.orderStatuses[0].status ===
        OrderStatuses.cancelled_without_penalty ||
      order.orderStatuses[0].status === OrderStatuses.on_going
    ) {
      return;
    }

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    const taskWorkerTrackingEta50PassedVars: TaskWorkerTrackingEta50PassedVars =
      await TaskWorkerTrackingEta50PassedVars.init(
        order,
        worker,
        this.customerService,
      );

    const ivrResponse = await this.ivrService.placeIVRCall(
      'TASK_WORKER_TRACKING_ETA_50_PASSED',
      taskWorkerTrackingEta50PassedVars,
      order,
      worker,
    );

    return;
  }
}
