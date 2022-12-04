import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateSourcingZoneInput } from './create-sourcing_zone.input';

@InputType()
export class UpdateSourcingZoneInput extends PartialType(
  CreateSourcingZoneInput,
) {
  // isDisabled field is not required in update zone input
  @Field(() => Boolean, { nullable: true })
  isDisabled?: boolean;

  // zoneId field is not required in update zone input
  @Field(() => Int, { nullable: true })
  zoneId?: number;
}
