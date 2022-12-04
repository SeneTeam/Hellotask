import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Customer } from 'src/customers/entities/customer.entity';
import { Invoice } from 'src/finance/entities/invoice.entity';
import { IvrPlacedCalls } from 'src/ivr/entities/ivr_placed_calls.entity';
import { Microarea } from 'src/locations/entities/microarea.entity';
import { Task } from 'src/task/entities/task.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Weekend } from '../orders.holiday.enum';
import { Estimate } from './estimate.entity';
import { OrderStatus } from './order-status.entity';
import { OrderWorker } from './order-worker.entity';

registerEnumType(Weekend, {
  name: 'Weekend',
});

@ObjectType()
@Entity()
export class Order {
  // uuid string field and column
  @Field(() => String, { description: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /*
   * Note: Even though this relationship could be established through estimate.customer.
   * But, we are establishing it here to make it easier to query orders by customer.
   ! This is a redundant relationship! Not ideal but useful here.
   ~ Sayom Shakib
   */
  @ManyToOne(() => Customer, (customer) => customer.orders)
  customer: Customer;

  @Index()
  @Field(() => String, { description: 'user id' })
  @Column({ nullable: true })
  customerId: string;

  // one to one relationship with estimate
  @Field(() => Estimate, { description: 'estimate' })
  @OneToOne(() => Estimate)
  @JoinColumn()
  estimate: Estimate;

  @Index()
  @Field(() => String, { description: 'estimate id' })
  @Column({ nullable: true })
  estimateId: string;

  // orderStartTime timestamp field and column
  @Field(() => Date, { description: 'orderStartTime' })
  @Column({ type: 'timestamptz', nullable: true })
  orderStartTime: Date;

  // initialWorkerSearchStartTime timestamp field and column
  @Field(() => Date, {
    description: 'initialWorkerSearchStartTime',
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  initialWorkerSearchStartTime: Date;

  // initialWorkerSearchJobId number field and column
  @Field(() => Number, {
    description: 'initialWorkerSearchJobId',
    nullable: true,
  })
  @Column({ nullable: true })
  initialWorkerSearchJobId: number;

  // weekend field and column
  @Field(() => Weekend, { description: 'weekend', nullable: true })
  @Column({ type: 'enum', enum: Weekend, nullable: true })
  weekend: Weekend;

  // orderPlaceTime timestamp field and column
  @Field(() => Date, { description: 'orderPlaceTime', nullable: true })
  @CreateDateColumn({ type: 'timestamptz' })
  orderPlacedAt: Date;

  // updatedAt timestamp field and column
  @Field(() => Date, { description: 'updatedAt' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Field(() => Boolean, { description: 'disclaimed' })
  @Column({ nullable: false, default: false })
  is_disclaimed: boolean;

  @Field(() => Number, { description: 'totalTimePerTask' })
  @Column({ nullable: true })
  totalTimePerTask: number;

  // one to many relationship with OrderWorker
  @Field(() => [OrderWorker], { description: 'orderWorkers' })
  @OneToMany(() => OrderWorker, (orderWorker) => orderWorker.order)
  OrderWorkers: OrderWorker[];

  // one to many relationship with task
  @Field(() => [Task], { description: 'tasks', nullable: true })
  @OneToMany(() => Task, (task) => task.order)
  tasks: Task[];

  // one to many relationship with invoice
  @Field(() => [Invoice], { description: 'invoices', nullable: true })
  @OneToMany(() => Invoice, (invoice) => invoice.order)
  invoices: Invoice[];

  // orderStatuses field and column
  @Field(() => [OrderStatus], { description: 'orderStatuses', nullable: true })
  @OneToMany(() => OrderStatus, (orderStatus) => orderStatus.order)
  orderStatuses: OrderStatus[];

  @ManyToOne(() => Microarea, (microarea) => microarea.orders)
  microarea: Microarea;

  // one to many relationship with IvrPlacedcalls
  @Field(() => [IvrPlacedCalls], {
    description: 'Placed calls for this order',
    nullable: true,
  })
  @OneToMany(() => IvrPlacedCalls, (ivrPlacedCalls) => ivrPlacedCalls.order)
  ivrPlacedCalls: IvrPlacedCalls[];

  @Column({ nullable: false, default: 0 })
  searchCursor: number;

  @ManyToMany(() => Worker)
  @JoinTable()
  // potentialWorkers field
  @Field(() => [Worker], {
    description: 'List of workers who are currently free for this order',
    nullable: true,
  })
  potentialWorkers: Worker[];

  @ManyToMany(() => Worker)
  @JoinTable()
  // potentialBackupWorkers field
  @Field(() => [Worker], {
    description:
      'List of workers who are currently free for this order as backup',
    nullable: true,
  })
  potentialBackupWorkers: Worker[];
}
