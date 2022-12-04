import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { updateVariableDeclarationList } from '@ts-morph/common/lib/typescript';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { CreateSourcingZoneInput } from './dto/create-sourcing_zone.input';
import { UpdateSourcingZoneInput } from './dto/update-sourcing_zone.input';
import { SourcingZone } from './entities/sourcing_zone.entity';
import { LocationsService } from './locations.service';

@Resolver(() => SourcingZone)
export class SourcingZoneResolver {
  constructor(private readonly locationsService: LocationsService) {}

  // Query to get all sourcing zones
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, SourcingZone)
  @Query(() => [SourcingZone], { name: 'getSourcingZones' })
  async findAllSourcingZones() {
    return await this.locationsService.findAllSourcingZones();
  }

  // query to get sourcing zone by id
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, SourcingZone)
  @Query(() => SourcingZone, { name: 'getSourcingZonebyId' })
  async findOneSourcingZoneById(@Args('id', { type: () => Int }) id: number) {
    return await this.locationsService.findOneSourcingZoneById(id);
  }

  // mutation to create sourcing zone
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, SourcingZone)
  @Mutation(() => SourcingZone)
  async createSourcingZone(
    @Args('createSourcingZoneInput')
    createSourcingZoneInput: CreateSourcingZoneInput,
  ) {
    return await this.locationsService.createSourcingZone(
      createSourcingZoneInput,
    );
  }

  // mutation to update sourcing zone
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.updateById, SourcingZone)
  @Mutation(() => SourcingZone)
  async updateSourcingZone(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateSourcingZoneInput')
    updateSourcingZoneInput: UpdateSourcingZoneInput,
  ) {
    return await this.locationsService.updateSourcingZone(
      id,
      updateSourcingZoneInput,
    );
  }

  // mutation to delete sourcing zone
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.deleteById, SourcingZone)
  @Mutation(() => SourcingZone)
  async deleteSourcingZone(@Args('id', { type: () => Int }) id: number) {
    return await this.locationsService.deleteSourcingZone(id);
  }
}
