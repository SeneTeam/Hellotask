import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { CreateMicroareaInput } from './dto/create-microarea.input';
import { UpdateMicroareaInput } from './dto/update-microarea.input';
import { Microarea } from './entities/microarea.entity';
import { LocationsService } from './locations.service';

@Resolver(() => Microarea)
export class MicroareaResolver {
  constructor(private readonly locationsService: LocationsService) {}

  // query to get all microareas
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Microarea)
  @Query(() => [Microarea], { name: 'getMicroareas' })
  async findAllMicroareas() {
    return await this.locationsService.findAllMicroareas();
  }

  // query to get microarea by id
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, Microarea)
  @Query(() => Microarea, { name: 'getMicroareaById' })
  async findOneMicroareaById(@Args('id', { type: () => Int }) id: number) {
    return await this.locationsService.findOneMicroareaById(id);
  }

  // mutation to create microarea
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Microarea)
  @Mutation(() => Microarea)
  async createMicroarea(
    @Args('createMicroareaInput')
    createMicroareaInput: CreateMicroareaInput,
  ) {
    return await this.locationsService.createMicroarea(createMicroareaInput);
  }

  // mutation to update microarea
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.updateById, Microarea)
  @Mutation(() => Microarea)
  async updateMicroarea(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateMicroareaInput')
    updateMicroareaInput: UpdateMicroareaInput,
  ) {
    return await this.locationsService.updateMicroarea(
      id,
      updateMicroareaInput,
    );
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.deleteById, Microarea)
  @Mutation(() => Microarea)
  async deleteMicroarea(@Args('id', { type: () => Int }) id: number) {
    return await this.locationsService.deleteMicroarea(id);
  }
}
