import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class WorkerWalletCreditInput {
  @Field(() => Int, { description: 'Worker ID' })
  worker_id: number;

  @Field(() => Int, { description: 'Amount to credit' })
  amount: number;

  @Field(() => String, { nullable: true, description: 'Reference text' })
  reference: string;
}

@ObjectType()
export class WalletCreditResponse {
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
export class WalletDebitResponse {
  @Field(() => String, { description: 'Transaction ID' })
  transaction_id: string;

  @Field(() => String, { description: 'Transaction type' })
  type: string;

  @Field(() => Int, { description: 'Amount debited' })
  amount: number;

  @Field(() => String, { nullable: true, description: 'Reference text' })
  reference: string;
}
