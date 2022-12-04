import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { In, Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { WorkersService } from '../workers/workers.service';

@Injectable()
export class CronService {
  constructor(
    // @Inject(FIREBASE_ADMIN_INJECT)
    // private readonly firebaseAdmin: FirebaseAdminSDK,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @Inject(WorkersService)
    private readonly workersService: WorkersService,
    @InjectQueue('ivrCalls') private readonly ivrCallQueue: Queue,
  ) {}

  @Cron('00 00 15 * * *')
  async triggerDailyCalling() {
    const activeWorkers: Worker[] = [];

    const workers = await this.workerRepository.find({
      // where: { id: In([4778, 4782]) },
      relations: {
        worker_status: true,
      },
      order: {
        worker_status: {
          created_at: 'DESC',
        },
      },
    });

    if (workers.length == 0) {
      return new HttpException('No Worker found', HttpStatus.NOT_FOUND);
    }

    workers.forEach((worker) => {
      if (worker.worker_status.length > 0) {
        if (worker.worker_status[0].status === 'active') {
          activeWorkers.push(worker);
        }
      }
    });

    let _delay = 0;
    let count = 1;
    for (const _worker of activeWorkers) {
      if (count % 20 === 0) {
        _delay = _delay + 1;
      }

      await this.ivrCallQueue.add(
        'workTimePreferenceCall',
        {
          worker_id: _worker.id,
        },
        {
          delay: _delay * 60 * 1000,
          attempts: 1,
        },
      );
      count = count + 1;
    }
    return;
  }
}
