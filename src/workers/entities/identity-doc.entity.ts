import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Worker } from './worker.entity';

export enum IdentityDocType {
  BIRTH_CERIFICATE = 'birth_certificate',
  NID = 'nid',
}

export enum VerificationProvider {
  PORICHOY = 'porichoy',
}

registerEnumType(IdentityDocType, {
  name: 'IdentityDocType',
});

registerEnumType(VerificationProvider, {
  name: 'VerificationProvider',
});

@Entity()
@ObjectType()
export class IdentityDoc {
  // auto increment id column and field
  @Field(() => Int, { description: 'ID' })
  @PrimaryGeneratedColumn()
  id: number;

  // identity doc type column and field
  @Field(() => IdentityDocType, {
    description: 'Identity doc type of the worker',
  })
  @Column({
    nullable: true,
    type: 'enum',
    enum: IdentityDocType,
    default: null,
  })
  id_type: IdentityDocType;

  // identity doc number column and field
  @Field(() => String, { description: 'Identity doc number of the worker' })
  @Column({ nullable: true })
  id_number: string;

  // date of birth column and field
  @Field(() => Date, { description: 'Date of birth of the worker' })
  @Column({ nullable: true })
  date_of_birth: Date;

  // identity doc iverification provider column and field
  @Field(() => VerificationProvider, {
    description: 'Identity doc verification provider of the worker',
  })
  @Column({
    nullable: true,
    type: 'enum',
    enum: VerificationProvider,
    default: VerificationProvider.PORICHOY,
  })
  id_verification_provider: VerificationProvider;

  // identity doc iverification response column and field
  @Field(() => GraphQLJSON)
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  id_verification_response: object;

  // identity doc url column and field
  @Field(() => String, { description: 'Identity doc url of the worker' })
  @Column({ nullable: true })
  id_doc_url: string;

  // is the identity doc is for guarantor
  @Field(() => Boolean, { description: 'Is the identity doc is for guarantor' })
  @Column({ nullable: false, default: false })
  is_guarantor: boolean;

  // many to one relationship with worker
  @Field(() => Worker, { description: 'Worker' })
  @ManyToOne(() => Worker, (worker) => worker.identity_docs)
  worker: Worker;

  // created at column and field
  @Field(() => Date, { description: 'Created at' })
  @CreateDateColumn()
  created_at: Date;

  // updated at column and field
  @Field(() => Date, { description: 'Updated at' })
  @UpdateDateColumn()
  updated_at: Date;
}
