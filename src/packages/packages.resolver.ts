import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';
import { CreatePackageInput } from './dto/create-package.input';
import { UpdatePackageInput } from './dto/update-package.input';
import { type } from 'os';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql.auth.guard';
import { AccessGuard, UseAbility } from 'nest-casl';
import { Actions } from 'src/app.actions';

@Resolver(() => Package)
export class PackagesResolver {
  constructor(private readonly packagesService: PackagesService) {}

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.create, Package)
  @Mutation(() => Package, { name: 'createPackage' })
  async createPackage(
    @Args('createPackageInput') createPackageInput: CreatePackageInput,
  ) {
    return await this.packagesService.createPackage(createPackageInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.read, Package)
  @Query(() => [Package], { name: 'getPackages' })
  async getPackages() {
    return await this.packagesService.getPackages();
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.readById, Package)
  @Query(() => Package, { name: 'getPackageById' })
  async getPackgeById(@Args('id', { type: () => String }) id: string) {
    return await this.packagesService.getPackgeById(id);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.update, Package)
  @Mutation(() => Package, { name: 'updatePackageById' })
  async updatePackageById(
    @Args('id', { type: () => String }) id: string,
    @Args('updatePackageInput') updatePackageInput: UpdatePackageInput,
  ) {
    return await this.packagesService.updatePackageById(id, updatePackageInput);
  }

  @UseGuards(GqlAuthGuard, AccessGuard)
  @UseAbility(Actions.delete, Package)
  @Mutation(() => Package, { name: 'deletePackage' })
  async deletePackage(@Args('id', { type: () => String }) id: string) {
    return await this.packagesService.deletePackage(id);
  }
}
