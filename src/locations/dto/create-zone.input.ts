import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateZoneInput {
  @Field(() => String, { description: 'Zone name' })
  name: string;

  @Field(() => [[Number]], { description: 'Polygon of the zone' })
  polygon: number[][];
}
