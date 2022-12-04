import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Estimate } from 'src/orders/entities/estimate.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@ObjectType()
export class Package {
  // UUID column and field
  @Field(() => String, { nullable: true, description: 'ID of the package' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // title column and field
  @Field(() => String, { nullable: true, description: 'Title of the package' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  // description column and field
  @Field(() => String, {
    nullable: true,
    description: 'Description of the package',
  })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  // task_count column and field
  @Field(() => Int, {
    nullable: true,
    description: 'Number of tasks in the package',
  })
  @Column({ type: 'int' })
  task_count: number;

  // has_trial column and field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package has a trial',
  })
  @Column({ type: 'boolean', default: false })
  has_trial: boolean;

  // is_trial_optional column and field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the trail in the package is optional for user to add',
  })
  @Column({ type: 'boolean', default: false })
  is_trial_optional: boolean;

  // max_trial_count column and field
  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of trials the user can add to the package',
  })
  @Column({ type: 'int', default: 0 })
  max_trial_count: number;

  // has holiday column and field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package has a holiday',
  })
  @Column({ type: 'boolean', default: false })
  has_weekend: boolean;

  // is_prepaid column and field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package is prepaid',
  })
  @Column({ type: 'boolean', default: false })
  is_prepaid: boolean;

  // is_active column and field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package is active',
  })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // one to many relationship with estimate
  @OneToMany(() => Estimate, (estimate) => estimate._package)
  estimates: Estimate[];

  @DeleteDateColumn()
  deleted_at: Date;

  // created_at column and field
  @Field(() => String, { description: 'Created at' })
  @CreateDateColumn()
  created_at: Date;

  // updated_at column and field
  @Field(() => String, { description: 'Updated at' })
  @UpdateDateColumn()
  updated_at: Date;
}
