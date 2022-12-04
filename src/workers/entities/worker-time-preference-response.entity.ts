import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Worker } from './worker.entity';

// enum for worker prefered time
export enum PreferedTime {
  MORNING = 'morning', // worker is interested to work in morning
  EVENING = 'evening', // worker is interested to work in evening
  ANY_TIME = 'any_time', // worker is interested to work in any time
}

// register worker status enum
registerEnumType(PreferedTime, {
  name: 'PreferedTime',
});

@Entity()
@ObjectType()
export class WorkerTimePreferenceResponse {
  @Field(() => Int, { description: 'ID of worker status' })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  callId: string;

  @Field(() => Worker, { description: 'Worker of the worker status' })
  @ManyToOne(() => Worker, (worker) => worker.workerTimePreferenceResponse)
  worker: Worker;

  @Column({ nullable: true })
  workerId: number;

  @Field(() => Boolean, { description: 'Worker agreed to work tomorrow' })
  @Column({ nullable: false, default: false })
  is_agreed: boolean;

  @Field(() => Boolean, { description: 'Worker disagreed to work tomorrow' })
  @Column({ nullable: false, default: false })
  is_disagreed: boolean;

  @Field(() => Boolean, { description: 'Worker received the call' })
  @Column({ nullable: false, default: false })
  is_received: boolean;

  @Field(() => PreferedTime, { description: 'Prefered time of the worker' })
  @Column({
    nullable: true,
    type: 'enum',
    enum: PreferedTime,
  })
  prefered_time: PreferedTime;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  response: object;

  @Column({ default: 1 })
  retryCount: number;

  @Field(() => String, { description: 'Created at' })
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
