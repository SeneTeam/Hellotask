import { Worker } from 'src/workers/entities/worker.entity';

export class CallbackWorkerGeneralVars {
  worker_id: number;
  recipient: string;
  worker_phone: string;
  x_api_key: string;

  onFailedCallBackUrl: string;

  worker_name_bangla: string;
  worker_due: string;
  worker_payment_account: string;

  callToOfficeCallBackUrl: string;
  deactivateIdCallBackUrl: string;

  static async init(worker: Worker) {
    const instance = new CallbackWorkerGeneralVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.worker_phone = worker.phone_number;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    // instance.worker_payment_account =
    //   worker.workerPaymentMethods[0].payment_method;

    instance.worker_payment_account = 'bkash';

    //! TODO: Query from Finance API
    instance.worker_due = '0';

    instance.callToOfficeCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/call/office';
    instance.deactivateIdCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/call/deactivate';

    return instance;
  }
}
