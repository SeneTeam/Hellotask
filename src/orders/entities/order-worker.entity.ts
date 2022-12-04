import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum WorkerOrderRole {
  primary = 'primary',
  secondary = 'secondary',
  backup = 'backup',
}

export enum WorkerReleaseReasons {
  completed = 'Order completed',
  CustomerCancelled = 'Customer cancelled order',
  CustomerDemanded = 'Customer demanded to change the worker',
  workerRefused = 'Worker Refused to work on this order',
  workerUnavailable = 'Worker is unavailable',
  others = 'Others',
}

export enum Rating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

registerEnumType(WorkerOrderRole, {
  name: 'WorkerOrderRole',
});

registerEnumType(WorkerReleaseReasons, {
  name: 'WorkerReleaseReasons',
});

registerEnumType(Rating, {
  name: 'Rating',
});

@Entity()
@ObjectType()
export class OrderWorker {
  // UUID column and
  @Field(() => String, { description: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Order column and field
  @Field(() => String, { description: 'orderId' })
  @Column()
  orderId: string;

  // worker column and field
  @Field(() => String, { description: 'workerId' })
  @Column()
  workerId: string;

  // assignedAt column and field
  @Field(() => Date, { description: 'assignedAt' })
  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt: Date;

  // @Field(() => WorkerEta, { description: 'ETA of the worker' })

  // role column
  @Field(() => WorkerOrderRole, { description: 'role' })
  @Column({
    type: 'enum',
    enum: WorkerOrderRole,
    default: WorkerOrderRole.primary,
  })
  role: WorkerOrderRole;

  // dischargedAt column and field
  @Field(() => Date, { description: 'dischargedAt' })
  @Column({ type: 'timestamptz', nullable: true })
  releasedAt: Date;

  // releaseReason column and field
  @Field(() => WorkerReleaseReasons, { description: 'releaseReason' })
  @Column({
    type: 'enum',
    enum: WorkerReleaseReasons,
    nullable: true,
  })
  releaseReason: WorkerReleaseReasons;

  // releasedBy column and field
  @Field(() => String, { description: 'releasedBy' })
  @Column({ nullable: true })
  releaseNote: string;

  // review column and field
  @Field(() => String, { description: 'review' })
  @Column({ nullable: true })
  review: string;

  // rating column and field
  @Field(() => Rating, { description: 'rating' })
  @Column({
    type: 'enum',
    enum: Rating,
    nullable: true,
  })
  rating: Rating;

  // many to one relationship with order
  @Field(() => Order, { description: 'order' })
  @ManyToOne(() => Order, (order) => order.OrderWorkers)
  order: Order;

  // many to one relationship with worker
  @Field(() => Worker, { description: 'worker' })
  @ManyToOne(() => Worker, (worker) => worker.OrderWorkers)
  worker: Worker;

  // workerEta column and field
  @Field(() => Number, { description: 'workerEta' })
  @Column()
  workerEta: number;
}
