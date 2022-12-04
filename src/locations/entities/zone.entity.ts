import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, OneToMany } from 'typeorm';
import { SourcingZone } from './sourcing_zone.entity';
import { LocationBase } from './location-base.entity';

@Entity()
@ObjectType()
export class Zone extends LocationBase {
  // OneToMany relation with sourcing zone
  @Field(() => [SourcingZone], {
    nullable: true,
    description: 'Sourcing zones',
  })
  @OneToMany(() => SourcingZone, (sourcingZone) => sourcingZone.zone)
  sourcingZones: SourcingZone[];
  worker: any;
  workers: any;
}
