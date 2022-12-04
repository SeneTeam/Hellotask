import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Worker } from './worker.entity';

// enum for worker status
export enum WorkerStatusEnum {
  TRAINEE = 'trainee', // worker is interested to work with us, now we are training him/her
  TRAINING_FAILED = 'training_failed', // worker failed to pass the training
  TRAINING_SUCCESS = 'training_success', // worker passed the training
  ACTIVE = 'active', // worker training is complete, he/she is ready to work
  INACTIVE = 'inactive', // worker is trained but he/she doesn't want to work with us for now
  DEACTIVATED = 'deactivated', // worker is deactivated by us
  SUSPENDED = 'suspended', // worker is suspended by us most likely because of bad performance or wrong deeds
}

// register worker status enum
registerEnumType(WorkerStatusEnum, {
  name: 'WorkerStatusEnum',
});

@Entity()
@ObjectType()
export class WorkerStatus {
  // auto increment id column and field
  @Field(() => Int, { description: 'ID of worker status' })
  @PrimaryGeneratedColumn()
  id: number;

  // many to one relationship with worker
  @Field(() => Worker, { description: 'Worker of the worker status' })
  @ManyToOne(() => Worker, (worker) => worker.worker_status)
  worker: Worker;

  @Column({ nullable: true })
  workerId: number;

  // worker status column and field
  @Field(() => WorkerStatusEnum, { description: 'Worker status of the worker' })
  @Column({
    type: 'enum',
    enum: WorkerStatusEnum,
    default: WorkerStatusEnum.TRAINEE,
  })
  status: WorkerStatusEnum;

  //Created At column and field
  @Field(() => Date, { description: 'Created At' })
  @CreateDateColumn()
  // @Column({ nullable: true })
  created_at: Date;

  // note column and field
  @Field(() => String, { description: 'Note of the worker status' })
  @Column({ nullable: true })
  note: string;

  // #TODO: add 'updated_by' column and field here with reference to 'User' entity
}
