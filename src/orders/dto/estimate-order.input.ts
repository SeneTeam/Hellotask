import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class WorksInput {
  // work id string field
  @Field(() => String, { description: 'work id' })
  work_id: string;

  // time int field
  @Field(() => Int, { description: 'time' })
  time: number;
}

@InputType()
export class EstimateOrderInput {
  @Field(() => String, { description: 'customer address id' })
  customerAddressId: string;
  // works array of works input
  @Field(() => [WorksInput], { description: 'works' })
  works: WorksInput[];
  // nullable promo code string field
  @Field(() => String, { nullable: true, description: 'promo code' })
  promoCode?: string;

  // // task count int field
  // @Field(() => Int, { description: 'task count' })
  // taskCount: number;
  @Field(() => String, { description: 'package id' })
  packageId: string;
}
