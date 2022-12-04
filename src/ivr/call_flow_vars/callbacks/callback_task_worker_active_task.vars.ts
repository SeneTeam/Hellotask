import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';

export class CallbackTaskWorkerActiveTaskVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  customerNumber: string;
  x_api_key: string;
  worker_phone: string;

  onFailedCallBackUrl: string;

  worker_bangla_name: string;
  microarea_name: string;

  endTaskCallBackUrl: string;
  callToPoliceCallBackUrl: string;
  callToOfficeCallBackUrl: string;

  static async init(order: Order, worker: Worker) {
    const instance = new CallbackTaskWorkerActiveTaskVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.customerNumber = order.customer.phone_number;
    instance.worker_phone = worker.phone_number;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_bangla_name = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.endTaskCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/worker-end-task';
    instance.callToPoliceCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/end/call-to-police';
    instance.callToOfficeCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/end/call-to-office';

    return instance;
  }
}
