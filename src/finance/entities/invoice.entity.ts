import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Order } from 'src/orders/entities/order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

export enum InvoiceType {
  primary = 'primary', // first payment for prepaid orders, supposed to be the only payment in case of postpaid orders
  adjustment = 'adjustment', // postpaid orders may need to be adjusted depending on the actual work done
  reversal = 'reversal', // in case of a refund
}

registerEnumType(InvoiceType, {
  name: 'InvoiceType',
});

@Entity()
@ObjectType()
export class Invoice {
  // @Field(() => String, { description: 'Id of the invoice' })
  // @PrimaryGeneratedColumn('uuid')
  // id: string;

  @Field(() => String, { description: 'invoicee id' })
  @PrimaryColumn()
  id: string;

  @Field(() => InvoiceType, { description: 'Type of the invoice' })
  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.primary,
  })
  type: InvoiceType;

  // json column for invoice
  @Field(() => String, { description: 'Invoice data json' })
  @Column({ type: 'jsonb' })
  invoice: object;

  // invoice generated At
  @Field(() => Date, { description: 'Invoice created at' })
  @CreateDateColumn({ type: 'timestamptz' })
  invoice_created_at: Date;

  @Field(() => Payment, {
    description: 'Payment for which the invoice is generated',
  })
  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  // Many to one relationship with order
  @Field(() => Order, {
    description: 'Order for which the invoice is generated',
  })
  @ManyToOne(() => Order, (order) => order.invoices)
  order: Order;
}
