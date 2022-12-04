import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IvrPlacedCalls } from './ivr_placed_calls.entity';
import { IvrMessageFlag } from '../ivr-msg-flag.enum';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Worker } from 'src/workers/entities/worker.entity';

registerEnumType(IvrMessageFlag, {
  name: 'IvrMessageFlag',
});

@ObjectType()
@Entity()
export class IvrCallResponses {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // many to one relationship with IvrPlacedCalls
  @ManyToOne(() => IvrPlacedCalls, (ivrPlacedCalls) => ivrPlacedCalls.responses)
  call: IvrPlacedCalls;

  @Index()
  @Column({ nullable: true })
  callId: string;

  // json field for call response
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  response: object;

  @Field(() => String, { description: 'message', nullable: true })
  @Column()
  message: string;

  @Field(() => IvrMessageFlag, { description: 'messageFlag', nullable: true })
  @Column({
    type: 'enum',
    enum: IvrMessageFlag,
    nullable: true,
  })
  messageFlag: IvrMessageFlag;

  @Index()
  @Field(() => Date, { description: 'createdAt' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: 1 })
  retryCount: number;
}
