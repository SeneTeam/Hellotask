import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateZoneInput } from './create-zone.input';

@InputType()
export class UpdateZoneInput extends PartialType(CreateZoneInput) {
  // isDisabled field is not required in update zone input
  @Field(() => Boolean, { nullable: true })
  isDisabled?: boolean;
}
