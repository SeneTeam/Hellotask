import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Point } from 'geojson';
import { Customer } from './customer.entity';

@Entity()
export class CustomerLocationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // geo point column
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: Point;

  // created at column
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.customerLocationLogs)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
