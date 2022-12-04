import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class PaginateInput {
  // offset of the pagination
  @Field(() => Int, {
    description: 'Offset of the pagination, default is 0',
  })
  skip: number;

  // limit of the pagination
  @Field(() => Int, {
    description: 'Limit of the pagination, default is 10',
  })
  take: number;
}
