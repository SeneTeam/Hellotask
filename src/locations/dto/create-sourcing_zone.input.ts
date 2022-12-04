import { Field, InputType, Int } from '@nestjs/graphql';
import { CreateZoneInput } from './create-zone.input';

@InputType()
export class CreateSourcingZoneInput extends CreateZoneInput {
  // field for zone id
  @Field(() => Int)
  zoneId: number;
}
