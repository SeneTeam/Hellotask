import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { CaslModule } from 'nest-casl';
import { permissions } from './orders.permissions';
import { CustomersModule } from 'src/customers/customers.module';
import { LocationsModule } from 'src/locations/locations.module';
import { Estimate } from './entities/estimate.entity';
import { PackagesModule } from 'src/packages/packages.module';
import { BullModule } from '@nestjs/bull';
import { OrdersConsumer } from './orders.processor';
import { OrderWorker } from './entities/order-worker.entity';
import { WorkersModule } from 'src/workers/workers.module';
import { FinanceModule } from 'src/finance/finance.module';
import { OrderStatus } from './entities/order-status.entity';
import { TaskModule } from 'src/task/task.module';
import { IvrModule } from 'src/ivr/ivr.module';
import { IvrPlacedCalls } from 'src/ivr/entities/ivr_placed_calls.entity';
import { IvrCallResponses } from 'src/ivr/entities/ivr_call_responses.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Order,
      Estimate,
      OrderWorker,
      OrderStatus,
      IvrPlacedCalls,
      IvrCallResponses,
    ]),
    CaslModule.forFeature({ permissions }),
    CustomersModule,
    LocationsModule,
    PackagesModule,
    WorkersModule,
    FinanceModule,
    NotificationModule,
    forwardRef(() => IvrModule),
    forwardRef(() => TaskModule),
    // BullModule.registerQueueAsync({
    //   name: 'orders',
    // }),
    BullModule.registerQueue({
      name: 'orders',
    }),
  ],
  providers: [OrdersResolver, OrdersService, OrdersConsumer],
  exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule {}
