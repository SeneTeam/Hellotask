import { Injectable } from '@nestjs/common';
import { SubjectBeforeFilterHook, Request } from 'nest-casl';
import { CustomersService } from './customers.service';
import { CustomerAddress } from './entities/customer-address.entity';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerAddressHook
  implements SubjectBeforeFilterHook<CustomerAddress, Request>
{
  constructor(readonly customerService: CustomersService) {}

  async run({ params }: Request) {
    // console.log('CustomerAddressHook.run', params);
    // return this.customerService.getCustomerAddressesByCustomerId(params.id)[0];
    return this.customerService.getCustomerAddressById(params.id);
  }
}
