import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export enum PaymentMethodForCustomers {
  bKash = 'bkash',
  SSLCommerz = 'sslcommerz',
  Ewallet = 'ewallet',
}

registerEnumType(PaymentMethodForCustomers, {
  name: 'PaymentMethodForCustomers',
});

@Entity()
@ObjectType()
export class Payment {
  @Field(() => String, { description: 'Id of the Payment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // many to one relationship with invoice
  @Field(() => Invoice, {
    description: 'Invoice for which the payment is made',
  })
  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  invoice: Invoice;

  @Field(() => String, { description: 'Payment url' })
  @Column()
  payment_url: string;

  @Field(() => PaymentMethodForCustomers, { description: 'Payment method' })
  @Column({
    type: 'enum',
    enum: PaymentMethodForCustomers,
    default: PaymentMethodForCustomers.bKash,
  })
  payment_method?: PaymentMethodForCustomers;

  @Field(() => Date, { description: 'Payment created at' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Field(() => Date, { description: 'Payment updated at' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Field(() => Date, {
    description: 'Payment url validated at',
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  payment_url_validity?: Date;

  @Field(() => String, { description: 'Payment received at', nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  payment_received_at?: Date;

  @Field(() => String, { description: 'Transaction ID', nullable: true })
  @Column({ nullable: true, unique: true })
  transaction_id?: string;

  // reference field and column
  @Field(() => String, { description: 'Payment Reference', nullable: true })
  @Column({ nullable: true })
  reference?: string;

  // if other payment methods recieved payment against this invoice, set this date
  // this will deactivate this payment instance
  @Field(() => Date, { description: 'Payment dropped at', nullable: true })
  @Column({ type: 'timestamptz', nullable: true, default: null })
  payment_dropped_at?: Date;
}
