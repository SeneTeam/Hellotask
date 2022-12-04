import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';

export class OrderCancelCallVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  customerNumber: string;

  onFailedCallBackUrl: string;

  worker_name_bangla: string;
  microarea_name: string;
  task_start_time: string;

  constructor() {}

  static async init(order: Order, worker: Worker) {
    const instance = new OrderCancelCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.customerNumber = order.customer.phone_number;

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.task_start_time = getTimeBangla(order.orderStartTime);

    return instance;
  }
}
