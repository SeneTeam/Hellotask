import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard, Actions, UseAbility } from 'nest-casl';
import { GqlAuthGuard } from '../auth/gql.auth.guard';
import { CurrentUser } from '../auth/gql.user.decorator';

@Resolver(() => Task)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @Mutation(() => Task, { name: 'createTask' })
  async createTask(@Args('createTaskInput') createTaskInput: CreateTaskInput) {
    return await this.taskService.createTask(createTaskInput);
  }

  @Query(() => [Task], { name: 'getTasksByOrderId' })
  async getTasksByOrderId(
    @Args('order_id', { type: () => String }) order_id: string,
  ) {
    return this.taskService.getTasksByOrderId(order_id);
  }

  @Query(() => Date, { name: 'getCurrentTime' })
  async getCurrentTime() {
    // get current time
    return new Date();
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.update, Task)
  @Mutation(() => Task, { name: 'taskStartEndByCustomer' })
  async taskStartEndByCustomer(
    @Args('order_id', { type: () => String }) order_id: string,
    @Args('worker_id', { type: () => Number }) worker_id: number,
  ) {
    return await this.taskService.taskStartEndByCustomer(order_id, worker_id);
  }

  // @Query(() => Task, { name: 'task' })
  // findOne(@Args('id', { type: () => Int }) id: number) {
  //   return this.taskService.findOne(id);
  // }

  // @Mutation(() => Task)
  // updateTask(@Args('updateTaskInput') updateTaskInput: UpdateTaskInput) {
  //   return this.taskService.update(updateTaskInput.id, updateTaskInput);
  // }

  // @Mutation(() => Task)
  // removeTask(@Args('id', { type: () => Int }) id: number) {
  //   return this.taskService.remove(id);
  // }
}
