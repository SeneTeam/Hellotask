import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Order } from 'src/orders/entities/order.entity';
import { Worker } from '../../workers/entities/worker.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABSENT = 'absent',
}

export enum TaskType {
  REGULAR = 'regular',
  BACKUP = 'backup',
  TRIAL = 'trial',
  INSTANT = 'instant',
}

registerEnumType(TaskStatus, {
  name: 'TaskStatusEnum',
  description: 'Task status',
});

registerEnumType(TaskType, {
  name: 'TaskTypeEnum',
  description: 'Task type',
});

@ObjectType()
@Entity()
export class Task {
  // UUID column and field
  @Field(() => String, { description: 'ID of the task' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // many to one relationship with order
  @Field(() => Order, { description: 'order' })
  @ManyToOne(() => Order, (order) => order.tasks, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  order: Order;

  // @Column({ type: 'string', name: 'orderId', nullable: true })
  // orderId: String;

  // taskStartTime field and column
  @Field(() => Date, { description: 'Task start time' })
  @Column({ type: 'timestamptz' })
  taskStartTime: Date;

  // taskEndTime field and column
  @Field(() => Date, { description: 'Task end time' })
  @Column({ type: 'timestamptz' })
  taskEndTime: Date;

  // taskStatus field and column
  @Field(() => TaskStatus, { description: 'Task status' })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  taskStatus: TaskStatus;

  // taskType field and column
  @Field(() => TaskType, { description: 'Task type' })
  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.REGULAR,
  })
  taskType: TaskType;

  // One to One relationship with Worker
  @Field(() => Worker, { description: 'Worker of the worker status' })
  @ManyToOne(() => Worker, (worker) => worker.worker_status)
  worker: Worker;

  @Column({ nullable: true })
  workerId: number;
}
