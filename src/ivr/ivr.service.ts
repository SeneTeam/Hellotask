import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
// import * as Mustache from 'mustache';
import { render } from 'mustache';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { IvrCallFlows } from './entities/ivr_call_flows.entity';
import { Repository, MoreThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IvrCallTypes } from './ivr-call-types.enum';
import {
  CreateIvrCallFlowDto,
  UpdateIvrCallFlowDto,
} from './dto/ivrCallFlow.dto';
import { uuid } from 'uuidv4';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { IvrPlacedCalls } from './entities/ivr_placed_calls.entity';
import { IvrCallResponses } from './entities/ivr_call_responses.entity';
import { AcceptOrderDto } from './dto/accept-order.dto';
import { IvrMessageFlag } from './ivr-msg-flag.enum';
import { Worker } from 'src/workers/entities/worker.entity';
import { Order } from 'src/orders/entities/order.entity';
import {
  OrderWorker,
  WorkerOrderRole,
} from 'src/orders/entities/order-worker.entity';
import {
  OrderStatus,
  OrderStatuses,
} from 'src/orders/entities/order-status.entity';
import { OrdersService } from 'src/orders/orders.service';
import { BaseIvrCallbackDto } from './dto/base-ivr-callback.dto';
import { RejectOrderDto } from './dto/reject-order.dto';
import { PUB_SUB } from 'src/pub-sub/pub-sub.module';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { callbackify } from 'util';
import { NotificationService } from 'src/notification/notification.service';
import { IvrCallRequest } from './entities/ivr_call_request.entity';
import { WorkersService } from 'src/workers/workers.service';
import { CustomersService } from 'src/customers/customers.service';
import { Task, TaskStatus, TaskType } from '../task/entities/task.entity';
import { Estimate } from '../orders/entities/estimate.entity';
import { WorkTimePreferenceUpdateCall } from './call_flow_vars/work-time-preference/work_time_preference_update_call.vars';
import { TimePreferenceIvrCallbackDto } from './dto/time-preference-callback.dto';
import { WorkerTimePreferenceResponse } from '../workers/entities/worker-time-preference-response.entity';
import {
  WorkerStatus,
  WorkerStatusEnum,
} from '../workers/entities/worker-status.entity';

@Injectable()
export class IvrService {
  private readonly logger = new Logger(IvrService.name);
  constructor(
    @InjectRepository(IvrCallFlows, 'mongo')
    private ivrCallFlowsRepository: Repository<IvrCallFlows>,

    @InjectRepository(IvrPlacedCalls)
    private ivrPlacedCallsRepository: Repository<IvrPlacedCalls>,

    @InjectRepository(IvrCallResponses)
    private ivrCallResponsesRepository: Repository<IvrCallResponses>,

    @InjectRepository(IvrCallRequest)
    private ivrCallRequestRepository: Repository<IvrCallRequest>,

    @InjectRepository(Worker)
    private workerRepository: Repository<Worker>,

    @InjectRepository(WorkerTimePreferenceResponse)
    private workerTimeRepository: Repository<WorkerTimePreferenceResponse>,

    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(OrderWorker)
    private orderWorkerRepository: Repository<OrderWorker>,

    @InjectRepository(Task)
    private taskRepository: Repository<Task>,

    @InjectRepository(OrderStatus)
    private orderStatusRepository: Repository<OrderStatus>,

    @InjectRepository(WorkerStatus)
    private workerStatusRepository: Repository<WorkerStatus>,

    // @Inject(OrdersService)
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,

    @Inject(HttpService)
    private httpService: HttpService,

    @Inject(PUB_SUB) private pubSub: RedisPubSub, // @InjectQueue('orders') private readonly ordersQueue: Queue,

    @Inject(NotificationService)
    private notificationService: NotificationService,

    @Inject(WorkersService)
    private workersService: WorkersService,

    @Inject(CustomersService)
    private customersService: CustomersService,

    @InjectRepository(Estimate)
    private readonly estimateRepository: Repository<Estimate>,
  ) {}

  // service method to get IVR callflow by id or name
  async getIvrCallFlow(options?: { id?: string; name?: string }) {
    let callflow = new IvrCallFlows();
    if (options.id)
      callflow = await this.ivrCallFlowsRepository.findOne({
        where: { id: options.id, deletedAt: null },
      });
    if (options.name)
      callflow = await this.ivrCallFlowsRepository.findOne({
        where: { name: options.name, deletedAt: null },
      });

    if (callflow) return callflow;
    // throw new http not found exception
    else
      throw new HttpException('IVR callflow not found', HttpStatus.NOT_FOUND);
  }

  // service method to get all IVR callflows
  async getIvrCallFlows() {
    return await this.ivrCallFlowsRepository.find({
      where: { deletedAt: null },
    });
  }

  // service method to create new IVR callflow
  async createIvrCallFlow(
    CreateIvrCallFlowDto: CreateIvrCallFlowDto,
  ): Promise<IvrCallFlows> {
    const ivrCallFlow: IvrCallFlows = new IvrCallFlows();
    ivrCallFlow.id = uuid();
    ivrCallFlow.name = CreateIvrCallFlowDto.name;
    ivrCallFlow.callFlowJson = JSON.parse(CreateIvrCallFlowDto.callFlowJson);
    ivrCallFlow.callType = CreateIvrCallFlowDto.callType;
    return await this.ivrCallFlowsRepository.save(ivrCallFlow);
  }

  // service method to update ( including deactivate ) IVR callflow
  async updateIvrCallFlow(
    id: string,
    updateIvrCallFlowDto: UpdateIvrCallFlowDto,
  ): Promise<IvrCallFlows> {
    const ivrCallFlow: IvrCallFlows = await this.getIvrCallFlow({ id });

    if (updateIvrCallFlowDto.name) ivrCallFlow.name = updateIvrCallFlowDto.name;

    if (updateIvrCallFlowDto.callFlowJson)
      ivrCallFlow.callFlowJson = JSON.parse(updateIvrCallFlowDto.callFlowJson);

    if (updateIvrCallFlowDto.callType)
      ivrCallFlow.callType = updateIvrCallFlowDto.callType;

    if (updateIvrCallFlowDto.deactivate) {
      ivrCallFlow.deactivatedAt = new Date();
    }
    // else set deactivatedAt to null
    else {
      ivrCallFlow.deactivatedAt = null;
    }

    return await this.ivrCallFlowsRepository.save(ivrCallFlow);
  }

  // service method to delete IVR callflow
  async deleteIvrCallFlow(id: string): Promise<IvrCallFlows> {
    const ivrCallFlow: IvrCallFlows = await this.getIvrCallFlow({ id });

    // set deletedAt to now in UTC
    ivrCallFlow.deletedAt = new Date();

    return await this.ivrCallFlowsRepository.save(ivrCallFlow);
  }

  async placeIVRCall(
    IVRCallFlowName: string,
    IVRCallFlowdata: any,
    order: Order,
    worker: Worker,
  ) {
    const callFlowRequestBody = await this.getIvrCallFlow({
      name: IVRCallFlowName,
    });

    const preparedCallFlowRequestBody = render(
      JSON.stringify(callFlowRequestBody.callFlowJson),
      // vars,
      IVRCallFlowdata,
    );

    // console.log('preparedCallFlowRequestBody', preparedCallFlowRequestBody);

    // send request to callflow api
    const ivr_api_url = process.env.IVR_CALL_REQUEST_URL;
    const ivr_api_key = process.env.IVR_API_KEY;

    // create header
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + ivr_api_key,
    };

    const response = await this.httpService
      .post(ivr_api_url, preparedCallFlowRequestBody, { headers })
      .pipe(
        map((res) => {
          return res.data;
        }),
      );

    // convert obeservable to promise
    return await lastValueFrom(response)
      .then(async (res) => {
        const ivrPlacedCall: IvrPlacedCalls = new IvrPlacedCalls();

        ivrPlacedCall.id = res.callId;
        ivrPlacedCall.callFlowJson = await this.getIvrCallFlow({
          name: IVRCallFlowName,
        })['callFlowJson'];
        ivrPlacedCall.callFlowVars = IVRCallFlowdata;
        ivrPlacedCall.callType = IvrCallTypes.order;
        ivrPlacedCall.recipient = worker.phone_number;
        ivrPlacedCall.order = order;
        ivrPlacedCall.worker = worker;
        const call = await this.ivrPlacedCallsRepository.save(ivrPlacedCall);

        // console.log('call', call);

        await this.updateIvrCallResponse(
          call,
          null,
          IvrMessageFlag.worker_connecting,
          `➡️ Calling to offer order`,
        );

        return res;
      })
      .catch((err) => {
        throw new HttpException(err, HttpStatus.BAD_REQUEST);
      });
  }

  async acceptOrder(acceptOrderDto: AcceptOrderDto) {
    const ivrPlacedCall = await this.ivrPlacedCallsRepository.findOne({
      where: { id: acceptOrderDto.callId },
      relations: {
        worker: true,
        order: true,
        responses: true,
      },
    });

    const worker = await this.workerRepository.findOne({
      where: { id: Number(acceptOrderDto.worker_id) },
    });

    const order = await this.orderRepository.findOne({
      where: { id: acceptOrderDto.order_id },
      relations: {
        OrderWorkers: true,
        orderStatuses: true,
        customer: true,
        estimate: true,
      },
      order: {
        orderStatuses: {
          createdAt: 'DESC',
        },
      },
    });

    if (!order) {
      return new HttpException('Order Not found', HttpStatus.NOT_FOUND);
    }

    if (
      order.orderStatuses[0].status == OrderStatuses.cancelled_without_penalty
    ) {
      return new HttpException('Order is cancelled', HttpStatus.BAD_REQUEST);
    }

    if (!ivrPlacedCall) {
      this.logger.error('❌ Accept Response: Call not found');
      throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
    }

    if (order.orderStatuses[0].status == OrderStatuses.accepted) {
      this.logger.error('🤪 Accept Response: Order already accepted');
      throw new HttpException('Order already accepted', HttpStatus.BAD_REQUEST);
    }

    // send fcm notification to customer
    const fcmToken = order.customer.fcm_token;
    const fcmResponse = await this.notificationService.sendNotificationToToken(
      fcmToken,
      'Order Accepted',
      `Your order has been accepted by ${worker.english_name}`,
      '',
      '',
      {
        type: 'order_accepted',
        order_id: order.id,
        message: `Your order has been accepted by ${worker.english_name}`,
      },
    );

    console.log(fcmResponse);

    const orderWorker = new OrderWorker();
    orderWorker.order = order;
    orderWorker.worker = worker;
    orderWorker.role = WorkerOrderRole.primary;
    orderWorker.workerEta = acceptOrderDto.eta;

    await this.orderWorkerRepository.save(orderWorker);

    this.ordersService.updateOrderStatus(order.id, OrderStatuses.accepted);

    this.logger.log(
      `📞✅ Accept Response: Order ${order.id} accepted by ${worker.english_name}`,
    );

    const order_estimate: Estimate = await this.estimateRepository.findOne({
      where: { id: order.estimate.id },
      order: { createdAt: 'DESC' },
      relations: ['_package'],
    });

    // if package has trial
    if (order && order.estimate && order_estimate._package['has_trial']) {
      const taskStartTime = order.orderStartTime;
      const order_total_time = order.totalTimePerTask;
      const taskEndTime = new Date(
        taskStartTime.getTime() + order_total_time * 60000,
      );

      const task = new Task();
      task.order = order;
      task.taskStartTime = taskStartTime;
      task.taskEndTime = taskEndTime;
      task.taskStatus = TaskStatus.PENDING;
      task.taskType = TaskType.TRIAL;

      for (let i = 0; i < 3; i++) {
        await this.taskRepository.save(task);
        await new Promise((r) => setTimeout(r, 500));
      }

      this.logger.log(
        `A new trial task ${task.id} has been created for order ${order.id}`,
      );
    }

    // if order is a instant
    if (order && order.estimate && order_estimate._package['task_count'] == 1) {
      const taskStartTime = order.orderStartTime;
      const order_total_time = order.totalTimePerTask;
      const taskEndTime = new Date(
        taskStartTime.getTime() + order_total_time * 60000,
      );

      const task = new Task();
      task.order = order;
      task.taskStartTime = taskStartTime;
      task.taskEndTime = taskEndTime;
      task.taskStatus = TaskStatus.PENDING;
      task.taskType = TaskType.INSTANT;

      // This is a shitty workaround!
      // TypeORM is a complete shit!
      // Run! Run! Run! while you still can!
      for (let i = 0; i < 3; i++) {
        await this.taskRepository.save(task);
        await new Promise((r) => setTimeout(r, 500));
      }

      this.logger.log(
        `A new instant task ${task.id} has been created for order ${order.id}`,
      );

      await this.ordersService.callOrderConfirmation(order.id, worker.id);
    }

    await this.updateIvrCallResponse(
      ivrPlacedCall,
      acceptOrderDto,
      IvrMessageFlag.worker_accepted,
      `📦✅🥳 Worker has accepted the order`,
    );

    // Schedule an SMS to Worker [ Address of the customer ]
    const customerAddress = await this.customersService.readAddress(
      order.estimate.customerAddressId,
    );

    if (order && order.estimate && order_estimate._package['has_trial']) {
      await this.ordersService.callWorkerReminder(order.id, worker.id);
    }

    if (order && order.estimate && order_estimate._package['task_count'] == 1) {
      await this.ordersService.taskWorkerTrackingETA50Passed(
        order.id,
        worker.id,
        'Instant',
      );
    }

    this.notificationService.sendSMS(
      worker.phone_number,
      `কাস্টমারের ঠিকানাঃ ${customerAddress}`,
    );

    // return 200 response
    return {
      status: 'success',
      message: 'Order accepted',
    };
  }

  async cancelOrder(orderId: string) {
    // const order = await this.orderRepository.findOne({
    //   where: { id: orderId },
    //   relations: {
    //     tasks: true,

    //   },
    // });

    const order = await this.ordersService.getOrderById(orderId);

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

    await this.ordersService.updateOrderStatus(
      orderId,
      OrderStatuses.cancelled_without_penalty,
    );

    order.tasks.forEach(async (task) => {
      await this.taskRepository.update(task.id, {
        taskStatus: TaskStatus.CANCELLED,
      });
    });

    return order;
  }

  async rejectOrder(rejectOrderDto: RejectOrderDto) {
    const ivrPlacedCall = await this.ivrPlacedCallsRepository.findOne({
      where: { id: rejectOrderDto.callId },
      relations: {
        worker: true,
        order: {
          orderStatuses: true,
        },
        responses: true,
      },
      order: {
        order: {
          orderStatuses: {
            createdAt: 'DESC',
          },
        },
      },
    });

    if (ivrPlacedCall.order.orderStatuses[0].status == OrderStatuses.accepted) {
      this.logger.error('📞😛 Reject Response: Order already accepted');
    }

    await this.updateIvrCallResponse(
      ivrPlacedCall,
      rejectOrderDto,
      IvrMessageFlag.worker_rejected,
      `❌ Worker has rejected the order`,
    );

    this.ordersService.scheduleCall(ivrPlacedCall.order.id);

    this.logger.log(
      `📞✅ Reject Response: Order ${ivrPlacedCall.order.id} rejected by ${ivrPlacedCall.worker.english_name}`,
    );

    // return 200 response
    return {
      status: 'success',
      message: 'Order rejected',
    };
  }

  async cancelOrderOnConfirmation(rejectOrderDto: RejectOrderDto) {
    const ivrPlacedCall = await this.ivrPlacedCallsRepository.findOne({
      where: {
        id: rejectOrderDto.callId,
        orderId: rejectOrderDto.order_id,
      },
      relations: {
        worker: true,
        order: {
          orderStatuses: true,
        },
        responses: true,
      },
      order: {
        order: {
          orderStatuses: {
            createdAt: 'DESC',
          },
        },
      },
    });

    if (ivrPlacedCall.order.orderStatuses[0].status == OrderStatuses.accepted) {
      this.logger.log(
        `📞❌ Cancel Response: Order ${ivrPlacedCall.order.id} cancelled by ${ivrPlacedCall.worker.english_name}`,
      );
      await this.updateIvrCallResponse(
        ivrPlacedCall,
        rejectOrderDto,
        IvrMessageFlag.worker_cancelled,
        `❌ Worker has cancelled the order after accepting`,
      );

      await this.ordersService.updateOrderStatus(
        ivrPlacedCall.order.id,
        OrderStatuses.cancelled_with_penalty,
      );
    }
    // return 200 response
    return {
      status: 'success',
      message: 'Order rejected',
    };
  }

  async receiveCall(callbackDto: BaseIvrCallbackDto) {
    const ivrPlacedCall = await this.ivrPlacedCallsRepository.findOne({
      where: { id: callbackDto.callId },
      relations: {
        order: true,
        worker: true,
      },
    });

    const order = await this.orderRepository.findOne({
      where: { id: callbackDto.order_id },
    });

    if (!ivrPlacedCall) {
      this.logger.error('📞❌ Receive Response: Call not found');
      throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
    }

    if (!order) {
      this.logger.error('📞❌ Receive Response: Order not found');
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    const worker = await this.workerRepository.findOne({
      where: { id: Number(callbackDto.worker_id) },
    });

    await this.updateIvrCallResponse(
      ivrPlacedCall,
      callbackDto,
      IvrMessageFlag.worker_connected,
      `✅ Communication established with worker`,
    );

    // return 200 response
    return {
      status: 'success',
      message: 'Communication established',
    };
  }

  async updateIvrCallResponse(
    call: IvrPlacedCalls,
    response: any,
    messageFlag: IvrMessageFlag,
    message: string,
  ): Promise<IvrCallResponses> {
    const _call: IvrPlacedCalls = await this.ivrPlacedCallsRepository.findOne({
      where: {
        id: call.id,
        worker: {
          id: call.worker.id,
        },
      },
      relations: {
        responses: true,
        order: true,
        worker: true,
      },
      order: {
        responses: {
          createdAt: 'DESC',
        },
      },
    });

    const ivrCallResponse = new IvrCallResponses();
    ivrCallResponse.call = _call;
    ivrCallResponse.response = response;
    ivrCallResponse.messageFlag = messageFlag;
    ivrCallResponse.message = message;

    // retry count will be updated for some IvrMessageFlag
    const countUpdateFlag = [
      IvrMessageFlag.worker_rejected,
      IvrMessageFlag.worker_not_reachable,
    ];

    if (_call.responses.length > 0 && countUpdateFlag.includes(messageFlag)) {
      ivrCallResponse.retryCount = _call.responses[0].retryCount + 1;
    }

    // save response
    const res = await this.ivrCallResponsesRepository.save(ivrCallResponse);

    this.logger.log(
      `📞♻️  Response: ${messageFlag} : ${message} 👧 ${_call.worker.english_name}`,
    );

    this.pubSub.publish('ivrResponse', {
      ivrResponse: {
        call: _call,
        flag: messageFlag,
        message: message,
        response_created_at: res.createdAt,
      },
    });
    return res;
  }

  async callbackRequest(phone_number: string) {
    // Save To ivr_call_requests
    const ivrCallRequest = new IvrCallRequest();
    ivrCallRequest.phone_number = phone_number;
    ivrCallRequest.createdAt = new Date();

    // ------------------- Try to Queue the Call -------------------

    // Check if worker exists with this phone number
    const worker = await this.workerRepository.findOne({
      where: { phone_number: phone_number },
      relations: {
        OrderWorkers: true,
      },
    });

    if (worker) {
      ivrCallRequest.worker = worker;
    }

    // Create a New Call Request
    const ivrCallRequestResponse = await this.ivrCallRequestRepository.save(
      ivrCallRequest,
    );

    // If worker exists, create a new call request
    if (worker) {
      this.logger.log(
        `📞✅ Callback Request: Worker with phone number ${phone_number} found`,
      );

      const callbackData =
        await this.workersService.prepareCallbackDataForWorker(
          ivrCallRequestResponse.worker,
        );

      if (callbackData) {
        const callFlowId = callbackData.callFlowId;
        const ivrCallFlowVars = callbackData.IVRCallFlowVars;
        const order = callbackData.order;

        setTimeout(() => {
          this.placeIVRCall(callFlowId, ivrCallFlowVars, order, worker);
        }, 10000);
        // await this.placeIVRCall(callFlowId, ivrCallFlowVars, order, worker);
      }

      // Create A Call to Worker
      this.logger.log(
        `📞✅ Callback Request: Creating a call to worker ${worker.english_name} - ${callbackData.callFlowId}`,
      );

      return {
        status: 'success',
        message: 'Call Request Queued Successfully',
      };
    } else {
      // Throw error if worker not found
      this.logger.error(
        `📞❌ Callback Request: Worker with phone number ${phone_number} not found`,
      );
      throw new HttpException(
        'Worker with this phone number not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async workerOnTheWay(callbackDto: BaseIvrCallbackDto) {
    const ivrPlacedCall = await this.ivrPlacedCallsRepository.findOne({
      where: { id: callbackDto.callId },
      relations: {
        order: true,
        worker: true,
      },
    });

    const order = await this.orderRepository.findOne({
      where: { id: callbackDto.order_id },
    });

    if (!ivrPlacedCall) {
      this.logger.error('📞❌ Receive Response: Call not found');
      throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
    }

    if (!order) {
      this.logger.error('📞❌ Receive Response: Order not found');
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    await this.updateIvrCallResponse(
      ivrPlacedCall,
      callbackDto,
      IvrMessageFlag.worker_on_the_way,
      `✅ Worker is on the way`,
    );

    // return 200 response
    return {
      status: 'success',
      message: 'Worker is on the way',
    };
  }

  async workTimePreferenceCall(worker_id: number) {
    const worker = await this.workersService.findOneWorkerById(worker_id);

    const callFlowRequestBody = await this.getIvrCallFlow({
      name: 'WORK_TIME_PREFERENCE_UPDATE_CALL',
    });

    const workTimePreferenceUpdateCall =
      await WorkTimePreferenceUpdateCall.init(worker);

    const preparedCallFlowRequestBody = render(
      JSON.stringify(callFlowRequestBody.callFlowJson),
      workTimePreferenceUpdateCall,
    );

    const ivr_api_url = process.env.IVR_CALL_REQUEST_URL;
    const ivr_api_key = process.env.IVR_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + ivr_api_key,
    };

    const response = await this.httpService
      .post(ivr_api_url, preparedCallFlowRequestBody, { headers })
      .pipe(
        map((res) => {
          return res.data;
        }),
      );

    return await lastValueFrom(response).then(async (res) => {
      await this.workersService.createNewTimePreferenceResponse(worker_id, res);
      return res;
    });
  }

  async retryWorkTimePreferenceCall(call_id: string) {
    const callResponse = await this.workerTimeRepository.findOne({
      where: { callId: call_id },
    });

    const worker = await this.workersService.findOneWorkerById(
      callResponse.workerId,
    );

    const callFlowRequestBody = await this.getIvrCallFlow({
      name: 'WORK_TIME_PREFERENCE_UPDATE_CALL',
    });

    const workTimePreferenceUpdateCall =
      await WorkTimePreferenceUpdateCall.init(worker);

    const preparedCallFlowRequestBody = render(
      JSON.stringify(callFlowRequestBody.callFlowJson),
      workTimePreferenceUpdateCall,
    );

    const ivr_api_url = process.env.IVR_CALL_REQUEST_URL;
    const ivr_api_key = process.env.IVR_API_KEY;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + ivr_api_key,
    };

    const response = await this.httpService
      .post(ivr_api_url, preparedCallFlowRequestBody, { headers })
      .pipe(
        map((res) => {
          return res.data;
        }),
      );

    return await lastValueFrom(response).then(async (res) => {
      await this.workersService.updateTimePreferenceResponse(call_id, res);
      return res;
    });
  }

  async updateWorkingTime(
    timePreferenceCallbackDto: TimePreferenceIvrCallbackDto,
  ) {
    const workerTime = await this.workerTimeRepository.findOne({
      where: { callId: timePreferenceCallbackDto.callId },
    });

    if (!workerTime) {
      this.logger.error('📞❌ Receive Response: Call not found');
      return new HttpException('Call not found', HttpStatus.NOT_FOUND);
    }

    let _is_agreed = false;
    let _is_disagreed = false;
    if (timePreferenceCallbackDto.is_agreed === 'true') {
      _is_agreed = true;
    }
    if (timePreferenceCallbackDto.is_agreed === 'false') {
      _is_disagreed = true;
    }

    workerTime.is_agreed = _is_agreed;
    workerTime.is_disagreed = _is_disagreed;
    workerTime.prefered_time = timePreferenceCallbackDto.working_time;

    return await this.workerTimeRepository.save(workerTime);
  }

  async getIvrResponseOfOrder(order_id: string) {
    const order = await this.ordersService.getOrderById(order_id);

    if (!order) {
      return new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    const ivrResponses = [];

    order.ivrPlacedCalls.map((call) => {
      call.responses.map((response) => {
        delete response.response;
        ivrResponses.push(response);
      });
    });

    ivrResponses.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return ivrResponses;
  }

  async scheduleCallReceived(
    timePreferenceCallbackDto: TimePreferenceIvrCallbackDto,
  ) {
    const workerTime = await this.workerTimeRepository.findOne({
      where: { callId: timePreferenceCallbackDto.callId },
    });

    if (!workerTime) {
      return new HttpException('Call not found', HttpStatus.NOT_FOUND);
    }

    workerTime.is_received = true;

    return await this.workerTimeRepository.save(workerTime);
  }
}
