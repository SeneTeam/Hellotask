import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { CustomersService } from 'src/customers/customers.service';

export class TaskReminderCallVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  customerNumber: string;
  x_api_key: string;

  onFailedCallBackUrl: string;

  worker_name_bangla: string;
  microarea_name: string;
  ETA: string;

  willGoCallBackUrl: string;
  callToOfficeCallBackUrl: string;
  task_start_time: string;
  order_address: string;
  payment_per_day: string;
  willNotGoCallBackUrl: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
  ) {
    const instance = new TaskReminderCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.x_api_key = "jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5";
    
    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    //! TODO: ETA
    instance.ETA = 'এক ঘণ্টা তিরিশ মিনিট';

    instance.task_start_time = order.orderStartTime.toLocaleTimeString();
    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    //! TODO: payment per day
    instance.payment_per_day = '1000';

    //! TODO: willGoCallBackUrl
    instance.willGoCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/task/will-go';
    instance.willNotGoCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/task/will-not-go';

    return instance;
  }
}
