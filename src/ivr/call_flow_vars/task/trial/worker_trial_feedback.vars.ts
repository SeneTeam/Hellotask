import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getDayNameBangla } from 'src/common/day-convertion';

export class WorkerTrialFeedbackVars {
  order_id: string;
  worker_id: number;
  recipient: string;
  x_api_key: string;

  onFailedCallBackUrl: string;
  onFailedCallBackPayload: string;

  worker_name_bangla: string;
  microarea_name: string;
  task_count: string;
  order_worker_comission: string;
  order_holiday_prompt: string;
  order_holiday: string;

  orderAcceptCallBackUrl: string;
  orderRejectCallBackUrl: string;

  rootOption2CallBackUrl: string;
  rootOption2CallBackMethod: string;

  constructor() {}

  static async init(order: Order, worker: Worker) {
    const instance = new WorkerTrialFeedbackVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';
    instance.onFailedCallBackPayload = JSON.stringify({
      order_id: order.id,
      worker_id: worker.id,
    });

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;
    instance.task_count = order.estimate._package.task_count.toString();
    instance.order_worker_comission =
      order.estimate.worker_commission.toString();

    if (order.estimate._package.has_weekend) {
      instance.order_holiday_prompt =
        'এই কাজটিতে আপনার সাপ্তাহিক ছুটি ' + getDayNameBangla(order.weekend);
    }

    instance.orderAcceptCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/accept';
    instance.orderRejectCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/reject';

    return instance;
  }
}
