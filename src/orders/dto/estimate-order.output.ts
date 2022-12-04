import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class OrderEstimationWork {
  @Field(() => String, { description: 'work id' })
  work_id: string;
  @Field(() => String, { description: 'work name' })
  work_name: string;
  @Field(() => Number, { description: 'work time' })
  work_time: number;
  @Field(() => Number, { description: 'work price' })
  price: number;
  @Field(() => Number, { description: 'work commission' })
  commission: number;
  @Field(() => Number, { description: 'total price' })
  total: number;
}

@ObjectType()
class OrderEstimationPricing {
  @Field(() => Number, { description: 'workers cut' })
  worker: number;
  @Field(() => Number, { description: 'company cut' })
  commission: number;
  @Field(() => Number, { description: 'promo', nullable: true })
  promo: number;
  @Field(() => Number, { description: 'discount' })
  discount: number;
  @Field(() => Number, { description: 'total', nullable: true })
  ewallet?: number;
  @Field(() => Number, { description: 'retention', nullable: true })
  retention?: number;
  @Field(() => Number, { description: 'total' })
  total: number;
}

@ObjectType()
class OrderEstimationPromo {
  @Field(() => Boolean, { description: 'status of the promo code', nullable: true })
  status: boolean;
  @Field(() => String, { description: 'promo code', nullable: true })
  promo_code?: string;
  @Field(() => Number, {
    description: 'Ammount of the promo applied',
    nullable: true,
  })
  promo_amount?: number;
  @Field(() => String, { description: 'error', nullable: true })
  error?: string;
}

@ObjectType()
export class OrderEstimationResponse {
  @Field(() => OrderEstimationPricing, { nullable: true })
  pricing: OrderEstimationPricing;
  @Field(() => [OrderEstimationWork], { nullable: true })
  works: OrderEstimationWork[];
  @Field(() => OrderEstimationPromo, { nullable: true })
  promo?: OrderEstimationPromo;
  @Field(() => Number, { description: 'task count' })
  task_count: number;
  @Field(() => Number, { description: 'per minute over time cost' })
  overtime_per_minute: number;
  @Field(() => String, { description: 'ISO time' })
  validity: string;
  @Field(() => String, { description: 'Created at' })
  created_at: string;
}
