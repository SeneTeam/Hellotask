import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { CurrentUser } from 'src/auth/gql.user.decorator';
import { PaginateInput } from 'src/common/dto/paginate.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, User)
  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return await this.usersService.createUser(createUserInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, User)
  @Query(() => User, { name: 'getUser' })
  async getUser(@CurrentUser() user) {
    return this.usersService.getUser(user);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readAll, User)
  @Query(() => [User], { name: 'getUsers' })
  async getUsers(
    @Args('paginate', { nullable: true, defaultValue: { skip: 0, take: 10 } })
    paginateInput: PaginateInput,
  ) {
    return this.usersService.getUsers(paginateInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, User)
  @Query(() => User, { name: 'getUserById' })
  async findOne(@Args('id', { type: () => String }) id: string) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.updateById, User)
  @Mutation(() => User, { name: 'updateUserById' })
  async updateUserById(
    @Args('id', { type: () => String }) id: string,
    @Args('updateUserInput')
    updateUserInput: UpdateUserInput,
  ) {
    return await this.usersService.updateUserById(id, updateUserInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.delete, User)
  @Mutation(() => User, { name: 'deleteUserById' })
  async deleteUser(@Args('id', { type: () => String }) id: string) {
    return await this.usersService.deleteUser(id);
  }
}
