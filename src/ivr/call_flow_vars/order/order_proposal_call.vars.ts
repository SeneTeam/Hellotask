import { getDayNameBangla } from 'src/common/day-convertion';
import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { OrdersService } from 'src/orders/orders.service';
import { Inject } from '@nestjs/common';
import { CustomerAddress } from 'src/customers/entities/customer-address.entity';
import { CustomersService } from 'src/customers/customers.service';
import { getTimeBangla } from 'src/common/get-time-bangla';

// a singleton class for order proposal call flow variables
export class OrderProposalCallVars {
  order_id: string;
  worker_id: number;
  recipient: string; // recipient of the call

  onFailedCallBackUrl: string; // url to call when the call fails
  onFailedCallBackPayload: string; // stringified json of the callback payload

  worker_name_bangla: string; // name of the worker in bangla
  microarea_name: string;
  work_count: number;
  task_count: number;

  // possible values: "আপা, আপনি এই বসায় এর আগেও কাজ করেছেন" or null
  worked_in_instance_address_prompt: string;

  task_start_time: string;
  order_worker_commission: string;
  daily_task_prompt: string;

  // possible values: "এই কাজে আপনি সাপ্তাহিক ছুটি আছে পাবেন ____বার" or null
  order_holiday_prompt: string;

  // possible value: "কাজটি করতে চাইলে আপনাকে গ্রাহকের বাসায় গিয়ে
  // প্রথম দিন কাজ করে আসতে হবে। আপনার কাজ গ্রাহকের ভাল লাগলে তবেই
  // প্যাকেজটি কনফার্ম হবে" or null
  trial_message_prompt: string;

  // instance will be the human readable version of the address
  //! TODO: instance address has to be figured out
  order_address: string;

  orderAcceptCallBackUrl: string;
  orderRejectCallBackUrl: string;
  onReceiveCallBackUrl: string;

  // possible values: "কাজটা কনফার্ম এর কল পাওয়ার পরেই কেবল আপনি কাজে যাবেন। তার আগে না।" or null
  address_confirmed_check_prompt: string;

  constructor() {}

  static async init(
    order: Order,
    worker: Worker,
    orderService: OrdersService,
    customerService: CustomersService,
  ) {
    const instance = new OrderProposalCallVars();

    instance.worker_id = worker.id;
    instance.recipient = worker.phone_number;
    instance.order_id = order.id;
    instance.onFailedCallBackUrl = 'https://eoj5k9gefkll9qt.m.pipedream.net';
    instance.onFailedCallBackPayload = JSON.stringify({
      order_id: order.id,
    });

    instance.worker_name_bangla = worker.bangla_name;
    instance.microarea_name = order.microarea.name;
    instance.work_count = order.estimate.work_count;
    instance.task_count = order.estimate._package.task_count;
    instance.task_start_time = getTimeBangla(order.orderStartTime);

    order.estimate._package.title != 'Instant'
      ? (instance.daily_task_prompt = `এই বাসায় প্রতিদিন ${getTimeBangla(
          order.orderStartTime,
        )} থেকে`)
      : (instance.daily_task_prompt = ` এখনই গিয়ে`);

    instance.order_worker_commission =
      order.estimate.worker_commission.toString();

    if (orderService.ifWorkerServedForCustomer(worker.id, order.customer.id)) {
      instance.worked_in_instance_address_prompt =
        'আপনি এই বাসায় আগেও কাজ করেছেন';
    } else {
      instance.worked_in_instance_address_prompt = '';
    }
    
    if (order.estimate._package.has_weekend) {
      instance.order_holiday_prompt =
        'এই কাজটিতে আপনার সাপ্তাহিক ছুটি ' + getDayNameBangla(order.weekend);
    }

    // !TODO: instance address has to be figured out
    instance.order_address = await customerService.readAddress(
      order.estimate.customerAddressId,
    );

    instance.orderAcceptCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/accept';
    instance.orderRejectCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/order/reject';
    instance.onReceiveCallBackUrl =
      'https://stage.api.hellotask.tech/ivr/call/recieve';

    return instance;
  }
}
