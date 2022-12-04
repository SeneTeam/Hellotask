import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { type } from 'os';
import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { IvrCallTypes } from '../ivr-call-types.enum';
import { IvrCallResponses } from './ivr_call_responses.entity';

registerEnumType(IvrCallTypes, {
  name: 'IvrCallTypes',
});

@Entity()
@ObjectType()
export class IvrPlacedCalls {
  @Field(() => String)
  @PrimaryColumn()
  id: string;

  @Column()
  recipient: string;

  // recipient worker of the call
  @Field(() => Worker, { description: 'worker', nullable: true })
  @ManyToOne(() => Worker, (worker) => worker.ivrPlacedCalls)
  worker: Worker;

  @Index()
  @Column()
  workerId: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  callFlowJson: object;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  callFlowVars: object;

  @Field(() => IvrCallTypes, { description: 'Call Type', nullable: true })
  @Column({
    type: 'enum',
    enum: IvrCallTypes,
  })
  callType: IvrCallTypes;

  // Many to one relationship with order
  @ManyToOne(() => Order, (order) => order.ivrPlacedCalls, { nullable: true })
  order: Order;

  @Index()
  @Column({ nullable: true })
  orderId: string;

  // one to many relationship with IvrCallResponses
  @Field(() => [IvrCallResponses], {
    description: 'Call Responses',
    nullable: true,
  })
  @OneToMany(
    () => IvrCallResponses,
    (ivrCallResponses) => ivrCallResponses.call,
  )
  responses: IvrCallResponses[];

  @Index()
  @Field(() => Date, { description: 'createdAt' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
