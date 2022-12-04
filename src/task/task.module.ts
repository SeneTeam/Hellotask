import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskResolver } from './task.resolver';
import { Task } from './entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from 'src/orders/orders.module';
import { NotificationModule } from '../notification/notification.module';
import { CaslModule } from 'nest-casl';
import { permissions } from './task.permission';
import { WorkersModule } from '../workers/workers.module';
import { IvrModule } from 'src/ivr/ivr.module';
import { IvrCallRequest } from '../ivr/entities/ivr_call_request.entity';
import { CustomersModule } from '../customers/customers.module';

@Module({
  providers: [TaskResolver, TaskService],
  imports: [
    TypeOrmModule.forFeature([Task, IvrCallRequest]),
    CaslModule.forFeature({ permissions }),
    forwardRef(() => OrdersModule),
    forwardRef(() => IvrModule),
    NotificationModule,
    WorkersModule,
    CustomersModule,
  ],
  exports: [TypeOrmModule, TaskService],
})
export class TaskModule {}
