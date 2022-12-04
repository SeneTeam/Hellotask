import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { CustomersService } from 'src/customers/customers.service';

// a singleton class for order proposal call flow variables
export class OrderProposalCallVars {
  order_id: string;
  worker_id: number;
  recipient: string; // recipient of the call
  x_api_key: string;

  onFailedCallBackUrl: string; // url to call when the call fails

  worker_name_bangla: string; // name of the worker in bangla
  microarea_name: string;

  payment_amount: string;

  order_address: string;

  backupAcceptCallBackUrl: string;
  backupRejectCallBackUrl: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    customerService: CustomersService,
    paymentAmount: number,
  ) {
    const instance = new OrderProposalCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.x_api_key = "jhL9SJUa3M2hzNsF4W8YWtvvFsXrhoj5";

    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;

    instance.payment_amount = paymentAmount.toString();

    // !TODO: instance address has to be figured out
    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    instance.backupAcceptCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/task/backup-accept';
    instance.backupRejectCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/task/backup-reject';

    return instance;
  }
}
