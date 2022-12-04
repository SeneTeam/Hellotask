import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { SourcingZone } from 'src/locations/entities/sourcing_zone.entity';
import { Microarea } from 'src/locations/entities/microarea.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkerPaymentMethod } from './worker-payment-method.entity';
import GraphQLJSON from 'graphql-type-json';
import { WorkerStatus } from './worker-status.entity';
import { IdentityDoc } from './identity-doc.entity';
import { OrderWorker } from 'src/orders/entities/order-worker.entity';
import { IvrPlacedCalls } from 'src/ivr/entities/ivr_placed_calls.entity';
import { IvrCallRequest } from 'src/ivr/entities/ivr_call_request.entity';
import { Task } from '../../task/entities/task.entity';
import { WorkerTimePreferenceResponse } from './worker-time-preference-response.entity';

// enum for worker type
export enum WorkerType {
  MAID = 'maid',
}

// register worker type enum
registerEnumType(WorkerType, {
  name: 'WorkerType',
});

@Entity()
@ObjectType()
export class Worker {
  // auto increment id column and field
  @Field(() => Int, { description: 'ID of worker' })
  @PrimaryGeneratedColumn()
  id: number;

  // name column and field
  @Field(() => String, { description: 'Bangla Name of the worker' })
  @Column()
  bangla_name: string;

  // english name column and field
  @Field(() => String, { description: 'English Name of the worker' })
  @Column({ nullable: true })
  english_name: string;

  // phone number column and field
  @Field(() => String, { description: 'Phone number of the worker' })
  @Column({})
  phone_number: string;

  // worker type column and field
  @Field(() => WorkerType, { description: 'Worker type of the worker' })
  @Column({
    type: 'enum',
    enum: WorkerType,
    default: WorkerType.MAID,
  })
  worker_type: WorkerType;

  // present address column and field
  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Present address of the worker',
  })
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  present_address?: JSON;

  // permanent address column and field
  // @Field(() => GraphQLJSON)
  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  // })
  // permanent_address: JSON;

  // permanent address column and field as a string
  @Field(() => String, {
    description: 'Permanent address of the worker',
    nullable: true,
  })
  @Column({ nullable: true })
  permanent_address?: string;

  // photo url column and field
  @Field(() => String, { description: 'Photo url of the worker' })
  @Column({ nullable: true })
  photo_url: string;

  // emergency contact column and field
  @Field(() => GraphQLJSON, {
    description: 'Emergency contact of the worker',
    nullable: true,
  })
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  emergency_contact?: JSON;

  // isDeleted column and field
  @Field(() => Boolean, { description: 'Is the worker deleted' })
  @Column({ default: false })
  isDeleted: boolean;

  // ManytoOne relation with sourcing zone
  @Field(() => SourcingZone, {
    nullable: true,
    description: 'Sourcing Zones',
  })
  @ManyToOne(() => SourcingZone, (sourcingZone) => sourcingZone.workers)
  sourcingZone: SourcingZone;

  @Column({ nullable: true })
  sourcingZoneId: number;

  // ManytoOne relation with microarea
  @Field(() => [Microarea], { description: 'Working Microareas of the worker' })
  @ManyToMany(() => Microarea)
  @JoinTable({
    name: 'worker_microareas',
  })
  microareas: Microarea[];

  // relation with worker payment method
  @Field(() => [WorkerPaymentMethod], { description: 'Worker payment methods' })
  @OneToMany(
    () => WorkerPaymentMethod,
    (workerPaymentMethod) => workerPaymentMethod.worker,
    { nullable: true },
  )
  workerPaymentMethods: WorkerPaymentMethod[];

  // worker refered by column and field
  @Field(() => Worker, { description: 'Worker referred by' })
  @ManyToOne(() => Worker, (worker) => worker.referenced_for, {
    nullable: true,
  })
  referenced_by: Worker;
  @Column({ nullable: true })
  referencedById: number;

  // worker referred for column and field
  @Field(() => [Worker], { description: 'Worker referred for' })
  @OneToMany(() => Worker, (worker) => worker.referenced_by, { nullable: true })
  referenced_for: Worker[];

  // one to many relation with identity doc
  @Field(() => [IdentityDoc], { description: 'Identity docs of the worker' })
  @OneToMany(() => IdentityDoc, (identityDoc) => identityDoc.worker, {
    nullable: true,
  })
  identity_docs: IdentityDoc[];

  // one to many relation with worker-status
  @Field(() => [WorkerStatus], {
    nullable: true,
    description: 'WorkerStatus',
  })
  @OneToMany(() => WorkerStatus, (workerStatus) => workerStatus.worker, {
    nullable: true,
  })
  worker_status: WorkerStatus[];

  @Field(() => [WorkerTimePreferenceResponse], {
    nullable: true,
    description: 'WorkerTimePreferenceResponse',
  })
  @OneToMany(() => WorkerTimePreferenceResponse, (workerTimePreferenceResponse) => workerTimePreferenceResponse.worker, {
    nullable: true,
  })
  workerTimePreferenceResponse: WorkerTimePreferenceResponse[];

  // createdAt column and field
  @Field(() => Date, { description: 'worker created at' })
  @CreateDateColumn()
  createdAt: Date;

  // UpdatedAt column and field
  @Field(() => Date, { description: 'worker updated at' })
  @UpdateDateColumn()
  updatedAt: Date;

  // deletedAt column and field
  @Field(() => Date, { description: 'worker deleted at' })
  @Column({ nullable: true })
  deletedAt: Date;

  // One to many relation with workerOrder
  @Field(() => [OrderWorker], { description: 'Orders of worker' })
  @OneToMany(() => OrderWorker, (orderWorker) => orderWorker.worker, {
    nullable: true,
  })
  OrderWorkers!: OrderWorker[];

  // worker e-wallet balance
  @Field(() => Int, {
    nullable: true,
    description: 'E-wallet balance of the Worker',
  })
  walletBalance: number;

  // worker transaction history
  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Transaction history of the Worker',
  })
  transactionHistory: JSON;

  // one to many rerlation with IvrPlacedCall
  @OneToMany(() => IvrPlacedCalls, (ivrPlacedCalls) => ivrPlacedCalls.worker, {
    nullable: true,
  })
  ivrPlacedCalls: IvrPlacedCalls[];

  // one to many relation with IvrCalRequest
  @OneToMany(() => IvrCallRequest, (ivrCallRequest) => ivrCallRequest.worker, {
    nullable: true,
  })
  ivrCallRequests: IvrCallRequest[];

  // one to many relation with Tasks
  @OneToMany(() => Task, (task) => task.worker, { nullable: true })
  tasks: Task[];
}
