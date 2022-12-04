import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesResolver } from './packages.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { CaslModule } from 'nest-casl';
import { permissions } from './package.permission';

@Module({
  providers: [PackagesResolver, PackagesService],
  imports: [
    TypeOrmModule.forFeature([Package]),
    CaslModule.forFeature({ permissions }),
  ],
  exports: [TypeOrmModule, PackagesService],
})
export class PackagesModule {}
