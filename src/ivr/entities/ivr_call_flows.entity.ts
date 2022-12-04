import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ObjectID,
  ObjectIdColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IvrCallTypes } from '../ivr-call-types.enum';

@Entity()
export class IvrCallFlows {
  @ObjectIdColumn()
  _id: ObjectID;

  @PrimaryColumn()
  id: string;

  // string identifier column
  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: IvrCallTypes })
  callType: IvrCallTypes;

  @Column({ type: 'jsonb' })
  callFlowJson: object;

  // deactivatedAt column
  @Column({ type: 'timestamptz', nullable: true })
  deactivatedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // soft delete column
  @DeleteDateColumn()
  deletedAt?: Date;
}
