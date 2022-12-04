import { $conditions } from '@casl/ability/dist/types/RuleIndex';
import { HttpService } from '@nestjs/axios';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { render } from 'mustache';
import { env } from 'process';
import { map } from 'rxjs';
import { CustomersResolver } from 'src/customers/customers.resolver';
import { CustomersService } from 'src/customers/customers.service';
import { OrderConfirmationCallVars } from 'src/ivr/call_flow_vars/order/order_confirmation_call.vars';
import { OrderProposalCallVars } from 'src/ivr/call_flow_vars/order/order_proposal_call.vars';
import { IvrCallResponses } from 'src/ivr/entities/ivr_call_responses.entity';
import { IvrPlacedCalls } from 'src/ivr/entities/ivr_placed_calls.entity';
import { IvrCallTypes } from 'src/ivr/ivr-call-types.enum';
import { IvrMessageFlag } from 'src/ivr/ivr-msg-flag.enum';
import { IvrService } from 'src/ivr/ivr.service';
import { PUB_SUB } from 'src/pub-sub/pub-sub.module';
import { TaskService } from 'src/task/task.service';
import { Worker } from 'src/workers/entities/worker.entity';
import { WorkersService } from 'src/workers/workers.service';
import { MoreThan, Repository } from 'typeorm';
import { WorkerTimePreferenceResponse } from '../workers/entities/worker-time-preference-response.entity';
import { WorkTimePreferenceUpdateCall } from './call_flow_vars/work-time-preference/work_time_preference_update_call.vars';

@Processor('ivrCalls')
export class IvrCallConsumer {
  private readonly logger = new Logger('Ivr Calls');

  constructor(
    @Inject(HttpService)
    private httpService: HttpService,
    @Inject(WorkersService)
    private readonly workersService: WorkersService,
    @Inject(IvrService)
    private readonly ivrService: IvrService,
    @InjectQueue('ivrCalls') private readonly ivrCallQueue: Queue,
    @InjectRepository(WorkerTimePreferenceResponse)
    private workerTimePreference: Repository<WorkerTimePreferenceResponse>,
  ) {}

  @Process('workTimePreferenceCall')
  async searchWorker(job: Job<unknown>) {
    const worker_id = job.data['worker_id'] as number;
    const placeCall = await this.ivrService.workTimePreferenceCall(worker_id);

    if (placeCall) {
      this.logger.log(`Worker ${worker_id} called`);
    }

    await this.ivrCallQueue.add(
      'retryPreferenceCall',
      {
        call_id: placeCall.callId,
      },
      {
        delay: 25 * 60 * 1000,
        attempts: 1,
      },
    );

    return;
  }

  @Process('retryPreferenceCall')
  async retryWorker(job: Job<unknown>) {
    const call_id = job.data['call_id'] as string;

    const preferedCallResponse = await this.workerTimePreference.findOne({
      where: { callId: call_id },
    });

    if (!preferedCallResponse) {
      return new BadRequestException('Call not found');
    }

    if (
      preferedCallResponse['is_agreed'] ||
      preferedCallResponse['is_disagreed']
    ) {
      return;
    }

    if (preferedCallResponse && preferedCallResponse.retryCount < 3) {
      const placeCall = await this.ivrService.retryWorkTimePreferenceCall(
        call_id,
      );

      if (placeCall) {
        this.logger.log(`Worker ${preferedCallResponse.workerId} called`);
      }

      await this.ivrCallQueue.add(
        'retryPreferenceCall',
        {
          call_id: placeCall.callId,
        },
        {
          delay: 25 * 60 * 1000,
          attempts: 1,
        },
      );
    }

    return;
  }
}
