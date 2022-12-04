import { InputType, Int, Field } from '@nestjs/graphql';
import { TaskStatus, TaskType } from '../entities/task.entity';

@InputType()
export class CreateTaskInput {
  @Field(() => String, { description: 'Order' })
  orderId: string;

  // taskStartTime field and column
  @Field(() => Date, { description: 'Task start time', nullable: true })
  taskStartTime: Date;

  // taskEndTime field and column
  @Field(() => Date, { description: 'Task end time', nullable: true })
  taskEndTime: Date;

  // taskStatus field and column
  @Field(() => TaskStatus, { description: 'Task status', nullable: true })
  taskStatus: TaskStatus;

  // taskType field and column
  @Field(() => TaskType, { description: 'Task type', nullable: true })
  taskType: TaskType;
}
