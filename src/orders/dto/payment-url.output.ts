import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentUrlOutput {
  @Field(() => String, { description: 'Payment url' })
  payment_url: string;

  @Field(() => String, { description: 'Invoice Id' })
  invoice_id: string;
}
