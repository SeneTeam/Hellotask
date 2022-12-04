import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';
import { CustomersService } from 'src/customers/customers.service';

export class TaskWorkerTrackingEta50PassedVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  x_api_key: string;
  customerNumber: string;

  onFailedCallBackUrl: string;
  onFailedCallBackPayload: string;

  worker_name_bangla: string;
  microarea_name: string;

  orderAcceptCallBackUrl: string;
  onTheWayCallBackUrl: string;
  notOnTheWayCallBackUrl: string;
  startWorkingCallBackUrl: string;
  callToCustomerCallBackUrl: string;
  callToOfficeCallBackUrl: string;

  task_start_time: string;
  order_address: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
  ) {
    const instance = new TaskWorkerTrackingEta50PassedVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.customerNumber = order.customer.phone_number;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';
    instance.onFailedCallBackPayload = JSON.stringify({
      order_id: order.id,
    });

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.task_start_time = getTimeBangla(order.orderStartTime);
    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    instance.orderAcceptCallBackUrl =
    'https://stage.api.hellotask.tech/ivr/order/accept';
    instance.onTheWayCallBackUrl =
    'https://stage.api.hellotask.tech/ivr/order/on-the-way';
    instance.notOnTheWayCallBackUrl =
    'https://stage.api.hellotask.tech/ivr/order/not-on-the-way';
    instance.startWorkingCallBackUrl =
    'https://stage.api.hellotask.tech/ivr/order/worker-start-task';
    instance.callToCustomerCallBackUrl =
    'https://stage.api.hellotask.tech/ivr/order/call-to-customer';
    instance.callToOfficeCallBackUrl =
    'https://stage.api.hellotask.tech/ivr/order/call-to-office';

    return instance;
  }
}
