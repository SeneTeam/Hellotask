import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SourcingZone } from './sourcing_zone.entity';
import { LocationBase } from './location-base.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity()
@ObjectType()
export class Microarea extends LocationBase {
  // ManytoOne relation with sourcing zone
  @Field(() => SourcingZone, { description: 'Sourcing Zones' })
  @ManyToOne(() => SourcingZone, (sourcingZone) => sourcingZone.microareas)
  sourcingZone: SourcingZone;

  @Index()
  @Column()
  sourcingZoneId: number;

  // Manytomany relation with workers
  @Field(() => [Worker], {
    nullable: true,
    description: 'Workers',
  })
  @ManyToMany(() => Worker, (worker) => worker.microareas)
  workers: Worker[];

  // legacy_id field and column
  @Field(() => Int, { nullable: true })
  @Column({ unique: true, nullable: true })
  legacyId: number;

  @OneToMany(() => Order, (order) => order.microarea)
  orders: Order[];
}
