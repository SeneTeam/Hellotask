import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { getTimeBangla } from 'src/common/get-time-bangla';
import { CustomersService } from 'src/customers/customers.service';

export class CallbackTaskWorkerWithinEtaVars {
  worker_id: number;
  order_id: string;
  recipient: string;
  worker_phone: string;
  x_api_key: string;
  customerNumber: string;

  onFailedCallBackUrl: string;

  worker_name_bangla: string;
  microarea_name: string;

  callToCustomerCallBackUrl: string;
  startWorkingCallBackUrl: string;
  callToOfficeCallBackUrl: string;

  payment_per_day: string;

  willGoCallBackUrl: string;
  willNotGoCallBackUrl: string;

  task_start_time: string;
  order_address: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
  ) {
    const instance = new CallbackTaskWorkerWithinEtaVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.worker_phone = worker.phone_number;
    instance.x_api_key = 'jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5';
    instance.customerNumber = order.customer.phone_number;

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.callToCustomerCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/call/customer';
    instance.startWorkingCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/worker-start-task';
    instance.callToOfficeCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/call/office';

    //! TODO: payment per day
    instance.payment_per_day = '1000';

    instance.willGoCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/task/within-eta/accept';
    instance.willNotGoCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/task/within-eta/reject';

    instance.task_start_time = getTimeBangla(order.orderStartTime);

    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    return instance;
  }
}
