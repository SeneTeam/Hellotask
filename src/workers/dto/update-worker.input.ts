import { CreateWorkerInput, PaymentInfoInput } from './create-worker.input';
import { InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdatePaymentInfoInput extends PartialType(PaymentInfoInput) {}

@InputType()
export class UpdateWorkerInput extends PartialType(CreateWorkerInput) {}
