import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Roles } from 'src/app.roles';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

registerEnumType(Roles, {
  name: 'Roles',
});

@Entity()
@ObjectType()
export class User {
  // uuid column and field
  @Field(() => String, { description: 'ID of User' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // firebase UID column
  //TODO: set nullable to false
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  firebaseUid: string;

  // name column and field
  @Field(() => String, { description: 'Name of the User' })
  @Column({ nullable: true })
  name: string;

  // phone number column and field
  @Field(() => String, { description: 'Phone number of the User' })
  @Column({ nullable: true, unique: true })
  phone_number: string;

  // email column and field
  @Field(() => String, { description: 'Email of the User' })
  @Column({ unique: true })
  email: string;

  // profile photo url column and field
  @Field(() => String, { nullable: true, description: 'Profile photo url of the User' })
  @Column({ nullable: true })
  photo_url: string;

  // roles column with default value from roles enum
  @Field(() => [Roles], { description: 'Roles of the User' })
  @Column({
    type: 'enum',
    array: true,
    enum: Roles,
    default: [Roles.user],
  })
  roles: Roles;

  // is deactivated column and field
  @Field(() => Boolean, { description: 'Is the User deactivated' })
  @Column({ default: false })
  isDeactivated: boolean;

  // created at column and field
  @Field(() => Date, { description: 'Created at' })
  @CreateDateColumn()
  createdAt: Date;

  // updated at column and field
  @Field(() => Date, { description: 'Updated at' })
  @UpdateDateColumn()
  updatedAt: Date;

  // deletedAt column and field
  @Field(() => Date, { nullable: true })
  @DeleteDateColumn()
  deletedAt: Date;
}
