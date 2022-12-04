import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  // email field
  @Field(() => String, { description: 'Email of the User' })
  email: string;

  // password field
  @Field(() => String, { description: 'Email of the User' })
  password: string;

  // name field
  @Field(() => String, { description: 'Name of the User' })
  name: string;

  // phone number field
  @Field(() => String, {
    description: 'Phone number of the User',
  })
  phone_number: string;

  // profile photo url field
  @Field(() => String, {
    description: 'Profile photo url of the User',
    nullable: true,
  })
  photo_url: string;
}
