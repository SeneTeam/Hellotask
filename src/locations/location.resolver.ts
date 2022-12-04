import { Request, UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { CurrentUser } from 'src/auth/gql.user.decorator';
import { Microarea } from './entities/microarea.entity';
import { LocationsService } from './locations.service';

@Resolver(() => Microarea)
export class LocationResolver {
  constructor(private readonly locationsService: LocationsService) {}

  // query to get micrarea, sourcingzone and zone for a lon and lat
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Microarea)
  // @UseGuards(GqlUserAuthGuard)
  @Query(() => [Microarea], { name: 'resolveLocation' })
  async resolveLocation(
    @Args('latitude') latitude: number,
    @Args('longitude') longitude: number,
    // @CurrentUser() user,
  ) {
    return await this.locationsService.resolveLocation(latitude, longitude);
  }

  // mutation to recreate the location tables from json
  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.reset, Boolean)
  @Mutation(() => Boolean, { name: 'seedLocations' })
  async resetLocations() {
    return await this.locationsService.seedLocations();
  }
}
