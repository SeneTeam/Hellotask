import { forwardRef, Module } from '@nestjs/common';
import { IvrService } from './ivr.service';
import { IvrController } from './ivr.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IvrPlacedCalls } from './entities/ivr_placed_calls.entity';
import { IvrCallResponses } from './entities/ivr_call_responses.entity';
import { IvrCallFlows } from './entities/ivr_call_flows.entity';
import { CaslModule } from 'nest-casl';
import { permissions } from './ivr.permissions';
import { HttpModule } from '@nestjs/axios';
import { OrdersModule } from 'src/orders/orders.module';
import { WorkersModule } from 'src/workers/workers.module';
import { CustomersModule } from 'src/customers/customers.module';
import { NotificationModule } from 'src/notification/notification.module';
import { IvrCallRequest } from './entities/ivr_call_request.entity';
import { Task } from '../task/entities/task.entity';
import { TaskModule } from '../task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { BullModule } from '@nestjs/bull';
import { IvrCallConsumer } from './ivr.processor';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      IvrPlacedCalls,
      IvrCallResponses,
      IvrCallRequest,
    ]),
    TypeOrmModule.forFeature([IvrCallFlows], 'mongo'),
    CaslModule.forFeature({ permissions }),
    HttpModule,
    WorkersModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => TaskModule),
    CustomersModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'ivrCalls',
    }),
  ],
  controllers: [IvrController],
  providers: [IvrService, IvrCallConsumer, CronService],
  exports: [IvrService],
})
export class IvrModule {}
