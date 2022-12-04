import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
    // is deactivated column and field
    @Field(() => Boolean, {
      description: 'Is the User deactivated',
      nullable: true,
    })
    isDeactivated: boolean;
}
