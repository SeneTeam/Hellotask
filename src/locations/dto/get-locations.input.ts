import { Field, InputType, registerEnumType } from '@nestjs/graphql';

export enum AllowedLocationTypes {
  Zone = 'Zone',
  SourcingZone = 'SourcingZone',
  Microarea = 'Microarea',
}

registerEnumType(AllowedLocationTypes, {
  name: 'AllowedLocationTypes',
  description: 'Allowed location types. Zone, SourcingZone, Microarea',
  valuesMap: {
    Zone: {
      description: 'Zone is the largest geographic unit of a city',
    },
    SourcingZone: {
      description:
        'Sourcing Zone is a geographic unit that is used to source domestic workers',
    },
    Microarea: {
      description:
        'Microarea is the smallest geographic unit of a city where customers are located',
    },
  },
});

@InputType()
export class GetLocationsInput {
  @Field(() => AllowedLocationTypes, { description: 'Location Type.' })
  locationType: AllowedLocationTypes;
}
