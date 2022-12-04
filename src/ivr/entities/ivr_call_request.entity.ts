import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Worker } from 'src/workers/entities/worker.entity';

@Entity()
@ObjectType()
export class IvrCallRequest {
  @Field(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone_number: string;

  @Field(() => Worker, { description: 'worker', nullable: true })
  @ManyToOne(() => Worker, (worker) => worker.ivrCallRequests)
  worker: Worker;

  @Column({ nullable: true, default: null })
  workerId: number;

  @Column({ default: false })
  queued: boolean;

  @Column({ default: false })
  processed: boolean;

  @Index()
  @Field(() => Date, { description: 'createdAt', defaultValue: new Date() })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => Date, { description: 'processedAt' })
  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  processedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date;
}
