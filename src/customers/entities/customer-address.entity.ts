import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Point } from 'geojson';
import { Customer } from './customer.entity';
import { pointMiddleware } from 'src/locations/locations.middleware';
import GraphQLJSON from 'graphql-type-json';
import { Microarea } from 'src/locations/entities/microarea.entity';
import { Estimate } from 'src/orders/entities/estimate.entity';

@Entity()
@ObjectType()
export class CustomerAddress {
  // auto increment id column and field
  @Field(() => String, { description: 'ID of Customer' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // addess label column and field
  @Field(() => String, { description: 'Address label of the Customer' })
  @Column()
  address_label: string;

  // geojson field and column
  @Field(() => [Number], {
    description: 'Location of the Customer in [longitude, latitude] format',
    nullable: true,
    middleware: [pointMiddleware],
  })
  @Column({
    type: 'geography',
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: Point;

  // microarea field
  @Field(() => Microarea, {
    description: 'Microarea of the Customer',
    nullable: true,
  })
  microarea: Microarea;

  // account meta column and field
  @Field(() => GraphQLJSON, { nullable: true })
  works: JSON;

  // socity column and field
  @Field(() => String, {
    description: 'Socity of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  socity: string;

  // sector column and field
  @Field(() => String, {
    description: 'Sector of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  sector: string;

  // moholla column and field
  @Field(() => String, {
    description: 'Moholla of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  moholla: string;

  // block column and field
  @Field(() => String, { description: 'Block of the Customer', nullable: true })
  @Column({ nullable: true })
  block: string;

  // road column and field
  @Field(() => String, { description: 'Road of the Customer', nullable: true })
  @Column({ nullable: true })
  road: string;

  // house column and field
  @Field(() => String, { description: 'House of the Customer', nullable: true })
  @Column({ nullable: true })
  house: string;

  // lift column and field
  @Field(() => String, { description: 'Lift of the Customer', nullable: true })
  @Column({ nullable: true })
  lift: string;

  // stair column and field
  @Field(() => String, { description: 'Stair of the Customer', nullable: true })
  @Column({ nullable: true })
  stair: string;

  // flat column and field
  @Field(() => String, { description: 'Flat of the Customer', nullable: true })
  @Column({ nullable: true })
  flat: string;

  // landmark column and field
  @Field(() => String, {
    description: 'Landmark of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  landmark: string;

  // building color column and field
  @Field(() => String, {
    description: 'Building color of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  building_color: string;

  // is this the default address of customer
  @Field(() => Boolean, { description: 'Default address of customer' })
  @Column({ nullable: false, default: false })
  is_default: boolean;

  // appartment type column and field
  @Field(() => String, {
    description: 'Appartment type of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  appartment_type: string;

  // appartment size column and field
  @Field(() => String, { description: 'Appartment size of the Customer' })
  @Column()
  appartment_size: string;

  // number of rooms column and field
  @Field(() => Int, { description: 'Number of rooms of the Customer' })
  @Column()
  no_of_rooms: number;

  // number of bathrooms column and field
  @Field(() => Int, { description: 'Number of bathrooms of the Customer' })
  @Column()
  no_of_bathrooms: number;

  // number of balcony column and field
  @Field(() => Int, { description: 'Number of balcony of the Customer' })
  @Column()
  no_of_balcony: number;

  // number of adults column and field
  @Field(() => Int, { description: 'Number of adults person of the Customer' })
  @Column()
  no_of_adults: number;

  // number of children column and field
  @Field(() => Int, { description: 'Number of children of the Customer' })
  @Column()
  no_of_children: number;

  // number of pets column and field
  @Field(() => Int, {
    description: 'Number of pets of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  no_of_pets: number;

  // number of permanent maids column and field
  @Field(() => Int, {
    description: 'Number of permanent maid of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  no_of_permanent_maids: number;

  // last verified date column and field
  @Field(() => Date, { description: 'Last verified date of the Customer' })
  @Column({ nullable: true })
  last_verified_date: Date;

  // created at column and field
  @Index()
  @Field(() => Date, { description: 'Created at of the Customer' })
  @CreateDateColumn()
  created_at: Date;

  // updated at column and field
  @Index()
  @Field(() => Date, { description: 'Updated at of the Customer' })
  @UpdateDateColumn()
  updated_at: Date;

  // isDeleted column and field
  // @Field(() => Boolean, { description: 'Is the address deleted' })
  // @Column({ default: false })
  // is_deleted: boolean;

  @Field(() => Date, {
    description: 'Customer address deleted at',
    nullable: true,
  })
  @DeleteDateColumn()
  deleted_at: Date;

  // relationship with customer
  // @Field(() => Customer, { description: 'Customer' })
  @ManyToOne(() => Customer, (customer) => customer.customer_addresses)
  customer: Customer;

  @Field(() => String, { description: 'Customer id' })
  @Index()
  @Column({ nullable: true })
  customerId: string;

  // relationship with estimate
  // @Field(() => Estimate, { description: 'Estimate' })
  @OneToMany(() => Estimate, (estimate) => estimate.customer_address)
  estimates: Estimate[];
}
