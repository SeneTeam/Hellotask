import { forwardRef, Global, Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { HttpModule } from '@nestjs/axios';
import { CustomersModule } from 'src/customers/customers.module';
import { Order } from '../orders/entities/order.entity';
import { CaslModule } from 'nest-casl';
import { permissions } from './finance.permissions';
import { OrderStatus } from '../orders/entities/order-status.entity';

@Global()
@Module({
  controllers: [FinanceController],
  imports: [
    TypeOrmModule.forFeature([Invoice, Payment, Order, OrderStatus]),
    CaslModule.forFeature({ permissions }),
    HttpModule,
    forwardRef(() => CustomersModule),
  ],
  providers: [FinanceService],
  exports: [TypeOrmModule, FinanceService],
})
export class FinanceModule {}
