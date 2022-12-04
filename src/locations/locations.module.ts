import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from 'nest-casl';
import { Microarea } from './entities/microarea.entity';
import { SourcingZone } from './entities/sourcing_zone.entity';
import { Zone } from './entities/zone.entity';
import { LocationResolver } from './location.resolver';
import { LocationsService } from './locations.service';
import { MicroareaResolver } from './microarea.resolver';
import { SourcingZoneResolver } from './sourcing_zone.resolver';
import { ZoneResolver } from './zone.resolver';
import { permissions } from './locations.permissions';

@Module({
  providers: [
    ZoneResolver,
    SourcingZoneResolver,
    MicroareaResolver,
    LocationsService,
    LocationResolver,
  ],
  imports: [
    TypeOrmModule.forFeature([Zone, SourcingZone, Microarea]),
    CaslModule.forFeature({ permissions }),
  ],
  exports: [LocationsService, TypeOrmModule],
})
export class LocationsModule {}
