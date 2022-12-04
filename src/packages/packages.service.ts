import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePackageInput } from './dto/create-package.input';
import { UpdatePackageInput } from './dto/update-package.input';
import { Package } from './entities/package.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
  ) {}

  async createPackage(createPackageInput: CreatePackageInput) {
    if (
      createPackageInput.has_trial == true &&
      (!createPackageInput.max_trial_count ||
        createPackageInput.max_trial_count <= 0)
    ) {
      throw new HttpException(
        'Invalid max trial number !',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newPackage = new Package();
    Object.assign(newPackage, createPackageInput);

    return await this.packageRepository.save(newPackage);
  }

  async getPackages() {
    return await this.packageRepository.find();
  }

  async getPackgeById(id: string) {
    const _package = await this.packageRepository.findOne({
      where: { id },
    });

    if (!_package) {
      throw new HttpException('Package not found', HttpStatus.NOT_FOUND);
    }

    return await _package;
  }

  async updatePackageById(id: string, updatePackageInput: UpdatePackageInput) {
    const _package = await this.packageRepository.findOne({
      where: { id },
    });

    if (!_package) {
      throw new HttpException('Package not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(_package, updatePackageInput);

    return await this.packageRepository.save(_package);
  }

  async deletePackage(id: string) {
    const _package = await this.packageRepository.findOne({
      where: { id },
    });

    if (!_package) {
      throw new HttpException('Package not found', HttpStatus.NOT_FOUND);
    }

    const deleteResponse = await this.packageRepository.softDelete(id);

    if (!deleteResponse.affected) {
      throw new HttpException(
        'Error deleting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return _package;
  }
}
