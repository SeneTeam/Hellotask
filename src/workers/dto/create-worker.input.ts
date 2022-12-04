import { InputType, Int, Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { IdentityDocType } from '../entities/identity-doc.entity';
import { PaymnetMethod } from '../entities/worker-payment-method.entity';

@InputType()
export class IdentityDocInput {
  // identity number field
  @Field(() => String, {
    description: 'ID number (e.g., NID/birth Certificate no.',
  })
  id_number: string;

  // date of birth field
  @Field(() => String, {
    description: 'Date of birth of the worker in YYYY-MM-DD format',
  })
  date_of_birth: string;

  // identity doc type field
  @Field(() => IdentityDocType, {
    description: 'Identity doc type of the worker',
  })
  id_type: IdentityDocType;

  // identity doc url
  @Field(() => String, { description: 'Identity doc url' })
  id_doc_url: string;

  // is_guarantor field
  @Field(() => Boolean, { description: 'Is guarantor', nullable: true })
  is_guarantor: boolean;
}

@InputType()
export class PaymentInfoInput {
  // payment mathod field
  @Field(() => PaymnetMethod, { description: 'Payment method' })
  payment_method: PaymnetMethod;

  // account number field
  @Field(() => String, { description: 'Account number' })
  account_number: string;

  // account meta field
  @Field(() => GraphQLJSON, { description: 'Account meta', nullable: true })
  account_meta: JSON;

  @Field(() => Boolean, {
    description: 'Is this payment method default ',
    nullable: false,
  })
  is_default: boolean;
}

@InputType()
export class CreateWorkerInput {
  // phone number field
  @Field(() => String, { description: 'Phone number of the worker' })
  phone_number: string;

  // nullable present address field
  @Field(() => GraphQLJSON, {
    description: 'Present address of the worker',
    nullable: true,
  })
  present_address: JSON;

  // nullable emergency contact field
  @Field(() => GraphQLJSON, {
    description: 'Emergency contact of the worker',
    nullable: true,
  })
  emergency_contact: JSON;

  // sourcing zone id field
  @Field(() => Int, { description: 'Sourcing zone id of the worker' })
  sourcing_zone_id: number;

  // array of microarea ids field
  @Field(() => [Int], { description: 'Array of microarea ids of the worker' })
  microarea_ids: number[];

  // photo_url field
  @Field(() => String, {
    description: 'Photo url of the worker',
    nullable: true,
  })
  photo_url: string;

  // transaction id of worker
  @Field(() => String, {
    description: 'Transaction id of the worker',
    nullable: true,
  })
  transaction_id: string;
}
