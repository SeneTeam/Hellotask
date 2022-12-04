import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Roles } from 'src/app.roles';
import { pointMiddleware } from 'src/locations/locations.middleware';
import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Any,
  Index,
} from 'typeorm';
import { Microarea } from '../../locations/entities/microarea.entity';
import { CustomerAddress } from './customer-address.entity';
import { CustomerLocationLog } from './customer-location-log';
import { Point } from 'geojson';
import { Order } from 'src/orders/entities/order.entity';
import { Estimate } from 'src/orders/entities/estimate.entity';
import GraphQLJSON from 'graphql-type-json';

@Entity()
@ObjectType()
// @Unique(['email'])
export class Customer {
  // auto increment id column and field
  @Field(() => String, { description: 'ID of Customer' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // firebase UID column
  //TODO: set nullable to false
  @Column({ type: 'varchar', length: 255, nullable: true })
  firebaseUid: string;

  @Column({ type: 'varchar', nullable: true })
  fcm_token: string;

  // name column and field
  @Field(() => String, { description: 'Name of the Customer', nullable: true })
  @Column({ nullable: true })
  name: string;

  // phone number column and field
  @Field(() => String, {
    description: 'Phone number of the Customer',
  })
  @Column({ unique: true })
  phone_number: string;

  // roles column with default value from roles enum
  @Column({
    type: 'enum',
    array: true,
    enum: Roles,
    default: [Roles.customer],
  })
  roles: Roles[];

  // photo url column and field
  @Field(() => String, {
    description: 'Photo url of the Customer',
    nullable: true,
  })
  @Column({ nullable: true })
  photo_url: string;

  // email column and field
  @Field(() => String, { description: 'Email of the Customer', nullable: true })
  @Column({ nullable: true, unique: true })
  email: string;

  // isBanned column and field
  @Index()
  @Field(() => Boolean, { description: 'Is the customer banned' })
  @Column({ default: false })
  isBanned: boolean;

  // relationship with customerlocationlog
  @OneToMany(
    () => CustomerLocationLog,
    (customerLocationLog) => customerLocationLog.customer,
  )
  customerLocationLogs: CustomerLocationLog[];

  // last location field
  @Field(() => [Number], {
    description: 'Location of the Customer in [longitude, latitude] format',
    nullable: true,
    middleware: [pointMiddleware],
  })
  lastLocation: Point;

  // created at column and field
  @Field(() => Date, { description: 'Created at of the Customer' })
  @CreateDateColumn()
  createdAt: Date;

  // lastLoginDate field
  // @Field(() => Date, { description: 'Last login date of the Customer' })
  // lastLoginDate: Date;

  // updated at column and field
  @Field(() => Date, { description: 'Updated at of the Customer' })
  @UpdateDateColumn()
  updatedAt: Date;

  // soft delete column
  @DeleteDateColumn()
  deletedAt: Date;

  // relationship with customer address
  @Field(() => [CustomerAddress], {
    nullable: true,
    description: 'Customer addresses of the Customer',
  })
  @OneToMany(
    () => CustomerAddress,
    (customerAddress) => customerAddress.customer,
  )
  customer_addresses: CustomerAddress[];

  // relationship with order
  // @Field(() => [Order], {
  //   nullable: true,
  //   description: 'Orders of the Customer',
  // })
  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  // relationship with estimate
  // @Field(() => [Estimate], {
  //   nullable: true,
  //   description: 'Estimates of the Customer',
  // })
  @OneToMany(() => Estimate, (estimate) => estimate.customer, {
    nullable: true,
  })
  estimates?: Estimate[];

  // customer e-wallet balance
  @Field(() => Int, {
    nullable: true,
    description: 'E-wallet balance of the Customer',
  })
  walletBalance: number;

  // customer transaction history
  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Transaction history of the Customer',
  })
  transactionHistory: JSON;
}
