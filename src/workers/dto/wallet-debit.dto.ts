import { Field, InputType, PartialType } from '@nestjs/graphql';
import { WorkerWalletCreditInput } from './wallet-credit.dto';

@InputType()
export class WorkerWalletDebitInput extends PartialType(
  WorkerWalletCreditInput,
) {
  @Field(() => String, { nullable: true, description: 'Invoice id' })
  invoice_id?: string;
}