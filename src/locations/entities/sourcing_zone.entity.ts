import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { Zone } from './zone.entity';
import { Microarea } from './microarea.entity';
import { LocationBase } from './location-base.entity';
import { Worker } from 'src/workers/entities/worker.entity';

@Entity()
@ObjectType()
export class SourcingZone extends LocationBase {
  // ManytoOne relation with zone
  @Field(() => Zone, { description: 'Zone' })
  @ManyToOne(() => Zone, (zone) => zone.sourcingZones)
  zone: Zone;

  @Index()
  @Column()
  zoneId: number;

  // OneToMany relation with microarea
  @Field(() => [Microarea], {
    nullable: true,
    description: 'Microareas',
  })
  @OneToMany(() => Microarea, (microarea) => microarea.sourcingZone)
  microareas: Microarea[];

  // OneToMany relation with workers
  @Field(() => [Worker], {
    nullable: true,
    description: 'Workers',
  })
  @OneToMany(() => Worker, (worker) => worker.sourcingZone)
  workers: Worker[];

  // legacy_id field and column
  @Field(() => Int, { nullable: true })
  @Column({ unique: true, nullable: true })
  legacyId: number;
}
