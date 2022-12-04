import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersResolver } from './workers.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from './entities/worker.entity';
import { WorkerPaymentMethod } from './entities/worker-payment-method.entity';
import { IdentityDoc } from './entities/identity-doc.entity';
import { WorkerStatus } from './entities/worker-status.entity';
import { HttpModule } from '@nestjs/axios';
import { LocationsModule } from 'src/locations/locations.module';
import { CaslModule } from 'nest-casl';
import { permissions } from './workers.permission';
import { OrderWorker } from 'src/orders/entities/order-worker.entity';
import { FinanceModule } from 'src/finance/finance.module';
import { Task } from '../task/entities/task.entity';
import { CustomersModule } from '../customers/customers.module';
import { WorkerTimePreferenceResponse } from './entities/worker-time-preference-response.entity';

@Module({
  providers: [WorkersResolver, WorkersService],
  imports: [
    TypeOrmModule.forFeature([
      Worker,
      WorkerPaymentMethod,
      IdentityDoc,
      WorkerStatus,
      Task,
      WorkerTimePreferenceResponse
    ]),
    CaslModule.forFeature({ permissions }),
    HttpModule,
    LocationsModule,
    FinanceModule,
    CustomersModule
  ],
  exports: [TypeOrmModule, WorkersService],
})
export class WorkersModule {}
