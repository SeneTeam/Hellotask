import { Injectable } from '@nestjs/common';
import { SubjectBeforeFilterHook, Request } from 'nest-casl';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@Injectable()
export class CustomerHook implements SubjectBeforeFilterHook<Order, Request> {
  constructor(readonly customerService: OrdersService) {}

  async run({ params }: Request) {
    return this.customerService.getOrderById(params.id);
  }
}
