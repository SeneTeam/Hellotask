import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';
import { CustomersService } from 'src/customers/customers.service';

export class WorkerTrialSuccessCallVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  x_api_key: string;
  customerNumber: string;

  onFailedCallBackUrl: string;

  worker_name_bangla: string;
  microarea_name: string;
  task_count: string;
  trial_message_prompt: string;
  task_start_date: string;
  task_start_times: string;

  CallToCustomerUrl: string;

  CallToOfficeUrl: string;

  order_address: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
  ) {
    const instance = new WorkerTrialSuccessCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.customerNumber = order.customer.phone_number;
    instance.x_api_key = "jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5";

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;
    instance.task_count = order.estimate._package.task_count.toString();
    instance.trial_message_prompt = 'যেটা একদিন করে এসেছেন, সেটা ';

    // TODO: start_date has to be figured out
    instance.task_start_date = order.orderStartTime.toLocaleDateString();

    instance.task_start_times = getTimeBangla(order.orderStartTime);

    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    return instance;
  }
}
