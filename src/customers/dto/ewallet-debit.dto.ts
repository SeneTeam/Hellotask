import { Field, InputType, Int, ObjectType, PartialType } from '@nestjs/graphql';
import { CustomerEwalletCreditInput } from './ewallet-credit.dto';

@InputType()
export class CustomerEwalletDebitInput extends PartialType(
  CustomerEwalletCreditInput,
) {
  @Field(() => String, { nullable: true, description: 'Invoice id' })
  invoice_id?: string;
}
