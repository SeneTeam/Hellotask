import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreatePackageInput {
  // title field
  @Field(() => String, { description: 'Title of the package' })
  title: string;

  // description field
  @Field(() => String, { description: 'Description of the package' })
  description: string;

  // task_count field
  @Field(() => Int, { description: 'Number of tasks in the package' })
  task_count: number;

  // has_trial field
  @Field(() => Boolean, { description: 'Whether the package has a trial' })
  has_trial: boolean;

  // is_trial_optional field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the trail in the package is optional for user to add',
  })
  is_trial_optional: boolean;

  // max_trial_count field
  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of trials the user can add to the package',
  })
  max_trial_count: number;

  // has holiday field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package has a holiday',
  })
  has_weekend: boolean;

  // is_prepaid field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package is prepaid',
  })
  is_prepaid: boolean;

  // is_active field
  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the package is active',
  })
  is_active: boolean;
}
