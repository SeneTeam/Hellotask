import { forwardRef, Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';
import { Customer } from './entities/customer.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerAddress } from './entities/customer-address.entity';
import { LocationsModule } from 'src/locations/locations.module';
import { CaslModule } from 'nest-casl';

import { permissions } from './customers.permissions';
import { CustomerLocationLog } from './entities/customer-location-log';
import { HttpModule } from '@nestjs/axios';
import { FinanceModule } from 'src/finance/finance.module';

@Module({
  providers: [CustomersResolver, CustomersService],
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerAddress, CustomerLocationLog]),
    CaslModule.forFeature({ permissions }),
    LocationsModule,
    HttpModule,
    forwardRef(() => FinanceModule),
  ],
  exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}
