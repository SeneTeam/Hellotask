import { $conditions } from '@casl/ability/dist/types/RuleIndex';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Not } from 'typeorm';
import { NotificationService } from '../notification/notification.service';
import { OrderStatuses } from '../orders/entities/order-status.entity';
import { OrdersService } from '../orders/orders.service';
import { CreateTaskInput } from './dto/create-task.input';
import { Task, TaskStatus, TaskType } from './entities/task.entity';
import { Order } from '../orders/entities/order.entity';
import { Worker } from '../workers/entities/worker.entity';
import { CallbackTaskWorkerActiveTaskVars } from '../ivr/call_flow_vars/callbacks/callback_task_worker_active_task.vars';
import { IvrService } from '../ivr/ivr.service';
import { FinanceService } from '../finance/finance.service';
import { IvrCallRequest } from '../ivr/entities/ivr_call_request.entity';
import { CallbackTaskWorkerWithinEtaVars } from '../ivr/call_flow_vars/callbacks/callback_task_worker_within_eta.vars';
import { CustomersService } from '../customers/customers.service';
import { NotEquals } from 'class-validator';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    @Inject(NotificationService)
    private notificationService: NotificationService,
    @Inject(IvrService) private readonly ivrService: IvrService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(FinanceService) private readonly financeService: FinanceService,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(IvrCallRequest)
    private ivrCallRequestRepository: Repository<IvrCallRequest>,
    @Inject(CustomersService)
    private readonly customerService: CustomersService,
  ) {}
  // createTask
  async createTask(createTaskInput: CreateTaskInput) {
    // create a new task object
    const task = new Task();
    Object.assign(task, createTaskInput);

    // save the task object to the database
    return await this.taskRepository.save(task);
  }

  async getTasksByOrderId(orderId: string) {
    // get the tasks by order id
    return this.taskRepository.find({
      where: { order: { id: orderId } },
      relations: {
        order: {
          OrderWorkers: {
            worker: true,
          },
          customer: true,
          ivrPlacedCalls: {
            responses: true,
          }
        },
      },
      order: {
        taskStartTime: 'DESC',
      },
    });
  }

  async startCurrentPendingTaskByOrderId(orderId: string) {
    // get the tasks by order id and today's date
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    const dateTomorrow = new Date();
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);
    dateTomorrow.setHours(0, 0, 0, 0);

    const task = await this.taskRepository.findOne({
      where: {
        order: { id: orderId },
        taskStatus: TaskStatus.PENDING,
        taskStartTime: MoreThan(dateToday),
        taskEndTime: LessThan(dateTomorrow),
      },
      relations: {
        order: {
          orderStatuses: true,
          OrderWorkers: true,
          customer: true,
        },
      },
    });

    if (!task) {
      this.logger.error(`No Pending Task Found for Order ${orderId} for Today`);
      return new HttpException('Task Not found', HttpStatus.NOT_FOUND);
    }

    // update the task status to in_progress
    task.taskStatus = TaskStatus.IN_PROGRESS;

    // update task start time
    task.taskStartTime = new Date();

    // update worker on task
    const lastWorkerIndex = task.order.OrderWorkers.length - 1;
    task.workerId = Number(task.order.OrderWorkers[lastWorkerIndex].workerId);
    await this.taskRepository.save(task);

    // update order status to on_going
    var order_status = false;
    task.order.orderStatuses.forEach(async (orderStatus) => {
      if (orderStatus.status == OrderStatuses.on_going) {
        order_status = true;
      }
    });

    if (order_status == false) {
      await this.ordersService.updateOrderStatus(
        task.order.id,
        OrderStatuses.on_going,
      );
    }

    // send fcm notification to customer
    const fcmToken = task.order.customer.fcm_token;
    const fcmResponse = await this.notificationService.sendNotificationToToken(
      fcmToken,
      'Work Started',
      'Your worker has started working at your place',
      "",
      "",
      {
        "type": 'task_satrted',
        "order_id": task.order.id,
        "task_id": task.id,
        "message": `Your worker has started working at your place`,
      }
    );

    console.log(fcmResponse);
    return;
  }

  async completeCurrentInProgressTaskByOrderId(orderId: string) {
    // get the tasks by order id and task start time is greater than today and end time is less than tomorrow
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    const dateTomorrow = new Date();
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);
    dateTomorrow.setHours(0, 0, 0, 0);

    const task = await this.taskRepository.findOne({
      where: {
        order: { id: orderId },
        taskStatus: TaskStatus.IN_PROGRESS,
        taskStartTime: MoreThan(dateToday),
        taskEndTime: LessThan(dateTomorrow),
      },
      relations: {
        order: {
          orderStatuses: true,
          OrderWorkers: true,
          customer: true,
          estimate: true,
        },
      },
    });

    if (!task) {
      this.logger.error(
        `No on going Task Found for Order ${orderId} for Today`,
      );
      return new HttpException('Task Not found', HttpStatus.NOT_FOUND);
    }

    task.taskStatus = TaskStatus.COMPLETED;
    task.taskEndTime = new Date();
    await this.taskRepository.save(task);

    // Commit Task to Finance System
    this.financeService.commitTask(task);

    // update order status to on_going
    if (task.taskType == TaskType.INSTANT) {
      var order_status = false;
      task.order.orderStatuses.forEach(async (orderStatus) => {
        if (orderStatus.status == OrderStatuses.completed) {
          order_status = true;
        }
      });

      if (order_status == false) {
        await this.ordersService.updateOrderStatus(
          task.order.id,
          OrderStatuses.payment_pending,
        );
      }
    }

    // send fcm notification to customer
    const fcmToken = task.order.customer.fcm_token;
    const fcmResponse = await this.notificationService.sendNotificationToToken(
      fcmToken,
      'Works Completed',
      'Your worker has completed the work',
      "",
      "",
      {
        "type": 'task_completed',
        "order_id": task.order.id,
        "task_id": task.id,
        "message": 'Your worker has completed the work',
      }
    );

    return;
  }

  async createTasksForOrderAfterTrialComplete(orderId: string) {
    // Get The Order
    const order = await this.ordersService.getOrderById(orderId);

    // Get Weekend for Order [ ENUM of Saturday ... Friday ]
    const orderWeekend = order.weekend;

    // Get Completed Tasks for this Order
    const completedTasks = await this.taskRepository.find({
      where: {
        order: { id: orderId },
        taskStatus: TaskStatus.COMPLETED,
      },
    });

    // Remaining Task Count
    const remainingTasks = order.estimate.work_count - completedTasks.length;

    // Create Date Array for Remaining Tasks excluding orderWeekend
    const dateArray = this.createDateArray(remainingTasks, orderWeekend);

    // Extract Only Time from Order Start Time
    const taskStartTime = order.orderStartTime.toISOString().split('T')[1];
    const taskDurationMinutes = order.totalTimePerTask;

    // Create Tasks for Remaining Dates
    dateArray.forEach(async (date) => {
      const datex = new Date(date);
      datex.setHours(0, 0, 0, 0);

      const task = new Task();
      task.order = order;
      task.taskStartTime = new Date(`${datex}T${taskStartTime}`);
      task.taskEndTime = new Date(
        `${datex}T${taskStartTime}` + taskDurationMinutes * 60000,
      );
      task.taskStatus = TaskStatus.PENDING;
      await this.taskRepository.save(task);
    });
  }

  createDateArray(remainingTasks: number, orderWeekend: string): Date[] {
    // Create Date Array for Remaining Tasks excluding orderWeekend
    const dateArray: Date[] = [];
    let date = new Date();
    let count = 0;
    while (count < remainingTasks) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== this.getWeekendNumber(orderWeekend)) {
        dateArray.push(date);
        count++;
      }
    }
    return dateArray;
  }

  getWeekendNumber(weekend: string): number {
    switch (weekend) {
      case 'Saturday':
        return 6;
      case 'Sunday':
        return 0;
      case 'Monday':
        return 1;
      case 'Tuesday':
        return 2;
      case 'Wednesday':
        return 3;
      case 'Thursday':
        return 4;
      case 'Friday':
        return 5;
    }
  }

  async taskStartEndByCustomer(order_id, worker_id: number) {
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    const worker = await this.workerRepository.findOne({
      where: { id: worker_id },
      relations: {
        OrderWorkers: true,
      },
    });

    if (!worker) {
      this.logger.error(`No Worker Found with ID ${worker_id}`);
      return new HttpException('Worker Not found', HttpStatus.NOT_FOUND);
    }

    const checkInprogress = await this.checkWorkerIfInprogress(order_id, worker);
    if (checkInprogress) {
      return new HttpException('Worker has another on going task.', HttpStatus.BAD_REQUEST);
    }

    const order = await this.ordersService.getOrderById(order_id);

    if (!order) {
      this.logger.error(`No Order Found with ID ${order_id}`);
      return new HttpException('Order Not found', HttpStatus.NOT_FOUND);
    }

    const ivrCallRequest = new IvrCallRequest();
    ivrCallRequest.phone_number = worker.phone_number;
    ivrCallRequest.worker = worker;
    await this.ivrCallRequestRepository.save(ivrCallRequest);

    const havePendingTaskToday = await this.taskRepository.findOne({
      where: {
        order: {
          id: order_id,
        },
        taskStatus: TaskStatus.PENDING,
        taskStartTime: MoreThan(dateToday),
      },
      order: {
        taskStartTime: 'ASC',
      },
      relations: {
        order: {
          customer: {
            customer_addresses: true,
          },
          microarea: true,
          estimate: true,
        },
      },
    });

    const haveInProgressTaskToday = await this.taskRepository.findOne({
      where: {
        order: {
          id: order_id,
        },
        taskStatus: TaskStatus.IN_PROGRESS,
        taskStartTime: MoreThan(dateToday),
      },
      order: {
        taskStartTime: 'ASC',
      },
      relations: {
        order: {
          customer: {
            customer_addresses: true,
          },
          microarea: true,
          estimate: true,
        },
      },
    });

    let callFlowId;
    let ivrCallFlowVars;
    let task = null;

    if (havePendingTaskToday) {
      task = havePendingTaskToday;
      callFlowId = 'CALLBACK_TASK_WORKER_WITHIN_ETA';
      ivrCallFlowVars = await CallbackTaskWorkerWithinEtaVars.init(
        order,
        worker,
        this.customerService,
      );
    } else if (haveInProgressTaskToday) {
      task = haveInProgressTaskToday;
      callFlowId = 'CALLBACK_TASK_WORKER_ACTIVE_TASK';
      ivrCallFlowVars = await CallbackTaskWorkerActiveTaskVars.init(
        order,
        worker,
      );
    } else {
      return new HttpException('No Task Found', HttpStatus.NOT_FOUND);
    }

    await this.ivrService.placeIVRCall(
      callFlowId,
      ivrCallFlowVars,
      order,
      worker,
    );

    this.logger.log(
      `📞✅ Callback Request: Creating a call to worker ${worker.english_name} - ${callFlowId}`,
    );

    return task;

    // const worker = await this.workerRepository.findOne({
    //   where: { id: worker_id },
    // });

    // if (!worker) {
    //   this.logger.error(`No Worker Found for this Order ${worker_id}`);
    //   return new HttpException('Worker Not found', HttpStatus.NOT_FOUND);
    // }

    // const callbackResponse =  await this.ivrService.callbackRequest(worker.phone_number);

    // if( !callbackResponse.task ){
    //   this.logger.error(`No Task Found for this Order ${order_id}`);
    //   return new HttpException('Task Not found', HttpStatus.NOT_FOUND);
    // }
    // return callbackResponse.task;
  }

  async checkWorkerIfInprogress(order_id: string, worker: Worker) {
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    const dateTomorrow = new Date();
    dateTomorrow.setDate(dateTomorrow.getDate() + 1);
    dateTomorrow.setHours(0, 0, 0, 0);

    const task = await this.taskRepository.find({
      where: {
        order: {
          id: Not(order_id),
        },
        worker: {
          id: worker.id,
        },
        taskStatus: TaskStatus.IN_PROGRESS,
        taskStartTime: MoreThan(dateToday),
        taskEndTime: LessThan(dateTomorrow),
      },
    });

    if (task.length > 0) {
      return true;
    }
    return false;
  }
}
