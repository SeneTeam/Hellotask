import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class CustomerEwalletCreditInput {
  @Field(() => String, { description: 'Customer ID' })
  customer_id: string;

  @Field(() => Int, { description: 'Amount to credit' })
  amount: number;

  @Field(() => String, { nullable: true, description: 'Reference text' })
  reference: string;
}

@ObjectType()
export class CustomerEwalletCreditResponse {
  @Field(() => String, { description: 'Transaction ID' })
  transaction_id: string;

  @Field(() => String, { description: 'Transaction type' })
  type: string;

  @Field(() => Int, { description: 'Amount credited' })
  amount: number;

  @Field(() => String, { nullable: true, description: 'Reference text' })
  reference: string;
}

@ObjectType()
export class CustomerEwalletDebitResponse {
  @Field(() => String, { description: 'Transaction ID' })
  transaction_id: string;

  @Field(() => String, { description: 'Transaction type' })
  type: string;

  @Field(() => Int, { description: 'Amount debited' })
  amount: number;

  @Field(() => String, { nullable: true, description: 'Reference text' })
  reference: string;
}