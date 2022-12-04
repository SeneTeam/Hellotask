import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';

export class TaskCancelCallVars {
  order_id: string;
  worker_id: number;
  recipient: string;

  onFailedCallBackUrl: string;
  onFailedCallBackPayload: string;

  worker_name_bangla: string;
  working_time: string;
  microarea_name: string;

  constructor() {}

  static async init(order: Order, worker: Worker) {
    const instance = new TaskCancelCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';
    instance.onFailedCallBackPayload = JSON.stringify({
      order_id: order.id,
    });

    instance.worker_name_bangla = worker.bangla_name;
    instance.working_time = getTimeBangla(order.orderStartTime);
    instance.microarea_name = order.microarea.name;

    return instance;
  }
}
