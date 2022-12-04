import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';

export class OrderWorkerUnassignedCallVars {
  order_id: string;
  worker_id: number;
  recipient: string;

  onFailedCallBackUrl: string;
  onFailedCallBackPayload: string;

  worker_name_bangla: string;
  task_start_time: string;
  microarea_name: string;
  worker_worked_days: string;
  worker_due: string;
  default_payment_method: string;

  constructor() {}

  static async init(order: Order, worker: Worker) {
    const instance = new OrderWorkerUnassignedCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';
    instance.onFailedCallBackPayload = JSON.stringify({
      order_id: order.id,
    });

    instance.worker_name_bangla = worker.bangla_name;
    instance.task_start_time = getTimeBangla(order.orderStartTime);
    instance.microarea_name = order.microarea.name;

    // !TODO: worker_worked_days and worker_due has to be calculated
    instance.worker_worked_days = '1';
    instance.worker_due = '100';

    // !TODO: default_payment_method has to be figured out
    instance.default_payment_method =
      worker.workerPaymentMethods[0].payment_method;

    return instance;
  }
}
