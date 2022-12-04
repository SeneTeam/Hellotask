import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateMicroareaInput } from './create-microarea.input';

@InputType()
export class UpdateMicroareaInput extends PartialType(CreateMicroareaInput) {
  
  // isDisabled field is not required in update zone input
  @Field(() => Boolean, { nullable: true })
  isDisabled?: boolean;

  // zoneId field is not required in update zone input
  @Field(() => Int, { nullable: true })
  SourcingZoneId?: number;
}
