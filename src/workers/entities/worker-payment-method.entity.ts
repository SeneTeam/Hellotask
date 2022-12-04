import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { json } from 'stream/consumers';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Worker } from './worker.entity';

export enum PaymnetMethod {
  BKASH = 'bkash',
  NAGAD = 'nagad',
  ROCKET = 'rocket',
}

registerEnumType(PaymnetMethod, {
  name: 'PaymnetMethod',
});

@Entity()
@ObjectType()
export class WorkerPaymentMethod {
  // auto increment id column and field
  @Field(() => Int, { description: 'ID' })
  @PrimaryGeneratedColumn()
  id: number;

  // payment method number column and field
  @Field(() => PaymnetMethod, {
    description: 'Payment method of the worker',
  })
  @Column({
    nullable: true,
    type: 'enum',
    enum: PaymnetMethod,
    default: null,
  })
  payment_method: PaymnetMethod;

  // account number column and field
  @Field(() => String, { description: 'Account number of the worker' })
  @Column({ nullable: true })
  account_number: string;

  // account meta column and field
  @Field(() => GraphQLJSON)
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  account_meta: JSON;

  // isDefault column and field
  @Field(() => Boolean, { description: 'Is default of the worker' })
  // default is true, if more than one payment method is added, then it will be false
  @Column({ nullable: false, default: true })
  is_default: boolean;

  // worker column and field
  @Field(() => Worker, { description: 'Worker' })
  @ManyToOne(() => Worker, (worker) => worker.workerPaymentMethods)
  worker: Worker;

  @Column({ nullable: true })
  workerId: number;

  // isDeleted column and field
  @Field(() => Boolean, { description: 'Is deleted of the worker' })
  @Column({ nullable: false, default: false })
  isDeleted: boolean;
}
