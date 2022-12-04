import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Order } from 'src/orders/entities/order.entity';
import { Worker } from 'src/workers/entities/worker.entity';
import { IvrPlacedCalls } from '../entities/ivr_placed_calls.entity';
import { IvrMessageFlag } from '../ivr-msg-flag.enum';

registerEnumType(IvrMessageFlag, {
  name: 'IvrMessageFlag',
});

@ObjectType()
export class IvrResponseSub {
  @Field(() => IvrPlacedCalls)
  call: IvrPlacedCalls;

  @Field(() => IvrMessageFlag)
  flag: IvrMessageFlag;

  @Field(() => String)
  message: string;

  @Field(() => Date, { nullable: true })
  response_created_at?: Date;
}
