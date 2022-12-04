import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';
import { CustomersService } from 'src/customers/customers.service';

export class TaskWorkerTrackingEtaExceededVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  x_api_key: string;
  customerNumber: string;

  onFailedCallBackUrl: string;

  worker_name_bangla: string;
  microarea_name: string;

  almostThereCallBackUrl: string;
  startWorkingCallBackUrl: string;
  callToCustomerCallBackUrl: string;

  task_start_time: string;
  order_address: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
  ) {
    const instance = new TaskWorkerTrackingEtaExceededVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.customerNumber = order.customer.phone_number;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.task_start_time = getTimeBangla(order.orderStartTime);
    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    instance.almostThereCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/almost-there';
    instance.startWorkingCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/start-working';
    instance.callToCustomerCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/call-to-customer';

    return instance;
  }
}
