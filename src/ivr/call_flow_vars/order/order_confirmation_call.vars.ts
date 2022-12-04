import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';
import { CustomersService } from 'src/customers/customers.service';

export class OrderConfirmationCallVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  customerNumber: string;

  onFailedCallBackUrl: string;
  onFailedCallBackPayload: string;
  x_api_key: string;

  worker_name_bangla: string;
  microarea_name: string;
  task_start_time: string;
  order_address: string;

  callToCustomerCallBackUrl: string;
  orderAcceptCallBackUrl: string;
  orderCancelCallBackUrl: string;
  callToOfficeCallBackUrl: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
  ) {
    const instance = new OrderConfirmationCallVars();

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
    instance.orderCancelCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/accept/confirmation/cancel';

    return instance;
  }
}
