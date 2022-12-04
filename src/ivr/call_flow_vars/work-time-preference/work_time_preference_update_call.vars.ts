import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';
import { CustomersService } from 'src/customers/customers.service';

export class WorkTimePreferenceUpdateCall {
  worker_id: number;
  recipient: string;
  x_api_key: string;

  onFailedCallBackUrl: string;
  onReceiveCallBackUrl: string;

  worker_name_bangla: string;
  microarea_name: string;

  updateWorkingTimeCallBackUrl: string;
  updateMicroareaCallBackUrl: string;
  requestRejectedCallBackUrl: string;

  constructor() {}

  static async init(worker: Worker) {
    const instance = new WorkTimePreferenceUpdateCall();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;

    instance.updateWorkingTimeCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/callback/update-working-time';
    instance.updateMicroareaCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/callback/update-microarea';
    instance.requestRejectedCallBackUrl =
      'https://live.api.hellotask.tech/ivr/callback/request-rejected';
    instance.onReceiveCallBackUrl =
      'https://live.api.hellotask.tech/ivr/schedule-call/received';

    return instance;
  }
}
