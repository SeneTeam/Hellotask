import { Injectable } from '@nestjs/common';
import { SubjectBeforeFilterHook, Request } from 'nest-casl';
import { CustomersService } from './customers.service';
import { CustomerAddress } from './entities/customer-address.entity';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerHook
  implements SubjectBeforeFilterHook<Customer, Request>
{
  constructor(readonly customerService: CustomersService) {}

  async run({ params }: Request) {
    return this.customerService.getCustomerById(params.id);
  }
}
