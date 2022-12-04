import { ObjectType, Field, Int } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { CustomerAddress } from 'src/customers/entities/customer-address.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Package } from 'src/packages/entities/package.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Estimate {
  // uuid string field and column
  @Field(() => String, { description: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, (customer) => customer.estimates)
  customer: Customer;

  @Index()
  @Field(() => String, { description: 'user id' })
  @Column({ nullable: true })
  customerId: string;

  @ManyToOne(
    () => CustomerAddress,
    (customerAddress) => customerAddress.estimates,
  )
  customer_address: CustomerAddress;

  @Index()
  @Field(() => String, { description: 'customer address id' })
  @Column({ nullable: true })
  customerAddressId: string;

  // estimate json data field and column
  @Field(() => GraphQLJSON)
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  estimate: JSON;

  // work_count integer field and column
  @Field(() => Int, { description: 'work count', nullable: true })
  @Column({ nullable: true })
  work_count?: number;

  // worker commission integer field and column
  @Field(() => Int, { description: 'worker commission', nullable: true })
  @Column({ nullable: true })
  worker_commission?: number;

  // validity timestamp field and column
  @Field(() => Date, { description: 'validity' })
  @Column({ type: 'timestamptz', nullable: true })
  validity: Date;

  // we are using _package as package is a reserved keyword in typescript
  // many to one relationship with package
  @Field(() => Package, { description: 'package' })
  @ManyToOne(() => Package, (_package) => _package.estimates)
  _package: Package;

  // createdAt timestamp field and column
  @Index()
  @Field(() => Date, { description: 'createdAt' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
