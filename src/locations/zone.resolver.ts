import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AccessGuard, UseAbility } from 'nest-casl';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { CreateZoneInput } from './dto/create-zone.input';
import { UpdateZoneInput } from './dto/update-zone.input';
import { Zone } from './entities/zone.entity';
import { LocationsService } from './locations.service';
import { Actions } from './../app.actions';

@Resolver(() => Zone)
export class ZoneResolver {
  constructor(private readonly locationsService: LocationsService) {}

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Zone)
  @Query(() => [Zone], { name: 'getZones' })
  async findAll() {
    return await this.locationsService.findAllZones();
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, Zone)
  @Query(() => Zone, { name: 'getZoneById' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.locationsService.findOneZoneById(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Zone)
  @Mutation(() => Zone, { name: 'createZone' })
  async createZone(@Args('createZoneInput') createZoneInput: CreateZoneInput) {
    return await this.locationsService.createZone(createZoneInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.updateById, Zone)
  @Mutation(() => Zone, { name: 'updateZone' })
  async updateLocation(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateZoneInput') updateZoneInput: UpdateZoneInput,
  ) {
    return await this.locationsService.updateZone(id, updateZoneInput);
  }

  // mutation to delete zone
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.deleteById, Zone)
  @Mutation(() => Zone, { name: 'deleteZone' })
  async deleteZone(@Args('id', { type: () => Int }) id: number) {
    return await this.locationsService.deleteZone(id);
  }
}
