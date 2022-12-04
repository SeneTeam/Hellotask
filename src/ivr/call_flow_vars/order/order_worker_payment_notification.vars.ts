import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';

export class OrderWorkerPaymentNotificationVars {
  order_id: string;
  worker_id: number;
  recipient: string;

  onFailedCallBackUrl: string;
  onFailedCallBackPayload: string;

  worker_name_bangla: string;
  microarea_name: string;
  task_count: number;
  order_worker_commission: string;
  worker_payment_account: string;

  constructor() {}

  static async init(order: Order, worker: Worker) {
    const instance = new OrderWorkerPaymentNotificationVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';
    instance.onFailedCallBackPayload = JSON.stringify({
      order_id: order.id,
    });

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.task_count = order.estimate._package.task_count;
    instance.order_worker_commission =
      order.estimate.worker_commission.toString();

    instance.worker_payment_account =
      worker.workerPaymentMethods[0].payment_method;
    return instance;
  }
}
