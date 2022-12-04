import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum OrderStatuses {
  placed = 'order placed', // order is placed by customer, no processing has started
  accepted = 'order accepted', // order is accepted by a worker
  on_going = 'order on going', // order is on going, now create tasks for this order
  rejected = 'order rejected', // order is rejected by hellotask
  payment_failed = 'payment failed', // 💀 payment failed by customer within time
  payment_pending = 'payment pending', // 💀 payment failed by customer within time
  failed = 'order failed', // order is failed to be servered by hellotask
  cancelled_with_penalty = 'order cancelled with penalty', // order is cancelled by customer with penalty
  cancelled_without_penalty = 'order cancelled without penalty', // order is cancelled by customer without penalty
  completed = 'order completed', // order is completed successfully
  searching = 'searching for workers', // order is searching for workere
  re_searching = 're-searching for workers', // order is re-searching for workers
  searching_backup = 'searching for backup workers', // order is searching for backup workers
  dropped = 'order dropped', // paid order was accepted by a worker but dropped by her later
  on_trial = 'order on trial', // order is on trial
  trial_feedback_positive_by_worker = 'trial feedback positive by worker', // trial feedback is positive by worker
  trial_feedback_negative_by_worker = 'trial feedback negative by worker', // trial feedback is negative by worker
  trial_due_research = 'trial due for initiating re-search', // trial feedback was positive from worker but negative from customer now customer has to pay for the trial to start re-search
  trial_due_cancel = 'trial due for cancelling', // trial feedback was negative from worker and customer wants to cancel the order
}

registerEnumType(OrderStatuses, {
  name: 'OrderStatuses',
});

@Entity()
@ObjectType()
export class OrderStatus {
  // id column and field
  @Field(() => String, { description: 'id' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // status column and field
  @Field(() => OrderStatuses, { description: 'status' })
  @Column({
    type: 'enum',
    enum: OrderStatuses,
    default: OrderStatuses.placed,
  })
  status: OrderStatuses;

  // createdAt column and field
  @Field(() => Date, { description: 'createdAt' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Many to one relationship with order
  @Field(() => Order, { description: 'Order' })
  @ManyToOne(() => Order, (order) => order.orderStatuses)
  order: Order;
}
