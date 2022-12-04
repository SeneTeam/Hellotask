import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateZoneInput } from './dto/create-zone.input';
import { UpdateZoneInput } from './dto/update-zone.input';
import { Zone } from './entities/zone.entity';
import { Polygon } from 'geojson';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateSourcingZoneInput } from './dto/create-sourcing_zone.input';
import { SourcingZone } from './entities/sourcing_zone.entity';
import { UpdateSourcingZoneInput } from './dto/update-sourcing_zone.input';
import { Microarea } from './entities/microarea.entity';
import { CreateMicroareaInput } from './dto/create-microarea.input';
import { UpdateMicroareaInput } from './dto/update-microarea.input';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
    @InjectRepository(SourcingZone)
    private sourcingZoneRepository: Repository<SourcingZone>,
    @InjectRepository(Microarea)
    private microareaRepository: Repository<Microarea>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async createZone(createZoneInput: CreateZoneInput) {
    const polygon: Polygon = {
      type: 'Polygon',
      coordinates: [createZoneInput.polygon],
    };

    const zone = new Zone();
    zone.name = createZoneInput.name;
    zone.polygon = polygon;

    return await this.zoneRepository.save(zone);
  }

  async findAllZones() {
    // get all zones where isDeleted is false
    return await this.zoneRepository.find({
      where: { isDeleted: false },
      relations: {
        sourcingZones: {
          microareas: true,
        },
      },
    });
  }

  async findOneZoneById(id: number) {
    // get zone with id where isDeleted is false
    const zone = await this.zoneRepository.findOne({
      where: { id, isDeleted: false },
      relations: {
        sourcingZones: {
          microareas: true,
        },
      },
    });

    // Throw HTTP Not Found error if zone is not found
    if (!zone) {
      throw new HttpException('Zone not found', HttpStatus.NOT_FOUND);
    }

    return zone;
  }

  async updateZone(id: number, updateZoneInput: UpdateZoneInput) {
    const zone = await this.zoneRepository.findOne({
      where: { id: id, isDeleted: false },
    });

    // if zone is not found throw error
    if (!zone) {
      throw new HttpException('Zone not found', HttpStatus.NOT_FOUND);
    }

    // if polygon data array is provided, convert it to polygon type
    if (updateZoneInput.polygon) {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [updateZoneInput.polygon],
      };
      zone.polygon = polygon;
      // remove polygon data from updateZoneInput
      delete updateZoneInput.polygon;
    }

    // assign all other fields to zone
    Object.assign(zone, updateZoneInput);

    return await this.zoneRepository.save(zone);
  }

  async deleteZone(id: number) {
    const zone = await this.zoneRepository.findOne({
      where: { id, isDeleted: false },
    });

    // if zone is not found throw error
    if (!zone) {
      throw new HttpException('Zone not found', HttpStatus.NOT_FOUND);
    }

    // get count of sourcing zones corresponding to this zone
    const count = await this.sourcingZoneRepository.count({
      where: { zoneId: zone.id, isDeleted: false },
    });

    // if count is greater than 0 throw error
    if (count > 0) {
      throw new HttpException(
        `Cannot delete zone because it has ${count} sourcing zones`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // perform soft delete
    const deleteResponse = await this.zoneRepository.softDelete(id);

    // if deleteResponse.affected is 0 throw error
    if (!deleteResponse.affected) {
      throw new HttpException(
        'Error deleting zone',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return zone;
  }

  // create a nre sourcing zone
  async createSourcingZone(createSourcingZoneInput: CreateSourcingZoneInput) {
    const polygon: Polygon = {
      type: 'Polygon',
      coordinates: [createSourcingZoneInput.polygon],
    };

    const sourcingZone = new SourcingZone();
    sourcingZone.name = createSourcingZoneInput.name;
    sourcingZone.polygon = polygon;

    // get zone with id where isDeleted is false
    const zone = await this.zoneRepository.findOne({
      where: { id: createSourcingZoneInput.zoneId, isDeleted: false },
    });

    // if zone is not found throw error
    if (!zone) {
      throw new HttpException('Zone not found', HttpStatus.NOT_FOUND);
    }

    // assign zone to sourcingZone
    sourcingZone.zone = zone;
    // save sourcingZone
    return await this.sourcingZoneRepository.save(sourcingZone);
  }

  // find all sourcing zones
  async findAllSourcingZones() {
    // get all sourcing zones where isDeleted is false
    const szones = await this.sourcingZoneRepository.find({
      where: { isDeleted: false },
    });

    // map all sourcing zones to include zone relationship
    const szonesWithZone = szones.map((szone) => {
      // get zone by szone.zoneId
      const zone = this.findOneZoneById(szone.zoneId);
      // return szone with zone relationship
      return {
        ...szone,
        zone,
      };
    });
    return szonesWithZone;
  }
  // find one sourcing zone by id
  async findOneSourcingZoneById(id: number) {
    // get sourcing zone with id where isDeleted is false
    return await this.sourcingZoneRepository.findOne({
      where: { id, isDeleted: false },
      relations: {
        zone: true,
      },
    });
  }
  // update sourcing zone
  async updateSourcingZone(
    id: number,
    updateSourcingZoneInput: UpdateSourcingZoneInput,
  ) {
    const sourcingZone = await this.sourcingZoneRepository.findOne({
      where: { id: id, isDeleted: false },
    });

    // if sourcing zone is not found throw error
    if (!sourcingZone) {
      throw new HttpException('Sourcing zone not found', HttpStatus.NOT_FOUND);
    }

    // if polygon data array is provided, convert it to polygon type
    if (updateSourcingZoneInput.polygon) {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [updateSourcingZoneInput.polygon],
      };
      sourcingZone.polygon = polygon;
      // remove polygon data from updateSourcingZoneInput
      delete updateSourcingZoneInput.polygon;
    }

    // if zoneId is provided, get zone with id where isDeleted is false
    if (updateSourcingZoneInput.zoneId) {
      const newZone = await this.zoneRepository.findOne({
        where: { id: updateSourcingZoneInput.zoneId, isDeleted: false },
      });

      // if zone is not found throw error
      if (!newZone) {
        throw new HttpException('Zone not found', HttpStatus.NOT_FOUND);
      }

      // assign zone to sourcingZone
      sourcingZone.zone = newZone;
      // remove zoneId from updateSourcingZoneInput
      delete updateSourcingZoneInput.zoneId;
    }

    // assign all other fields to sourcingZone
    Object.assign(sourcingZone, updateSourcingZoneInput);

    const updatedSourcingZone = await this.sourcingZoneRepository.save(
      sourcingZone,
    );

    // get zone with id where isDeleted is false
    const zone = await this.zoneRepository.findOne({
      where: { id: sourcingZone.zoneId, isDeleted: false },
    });

    // return updatedSourcingZone with zone
    return {
      ...updatedSourcingZone,
      zone,
    };
  }

  async deleteSourcingZone(id: number) {
    const sourcingZone = await this.sourcingZoneRepository.findOne({
      where: { id, isDeleted: false },
    });

    // if sourcing zone is not found throw error
    if (!sourcingZone) {
      throw new HttpException('Sourcing zone not found', HttpStatus.NOT_FOUND);
    }

    // get count of microareas corresponding to this sourcing zone
    const count = await this.microareaRepository.count({
      where: { sourcingZoneId: sourcingZone.id, isDeleted: false },
    });

    // if count is greater than 0 throw error
    if (count > 0) {
      throw new HttpException(
        `Cannot delete sourcing zone because it has ${count} microareas`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // set isDeleted to true
    // sourcingZone.isDeleted = true;

    // return await this.sourcingZoneRepository.save(sourcingZone);
    // implement soft delete
    const deleteResponse = await this.sourcingZoneRepository.softDelete(id);
    if (!deleteResponse.affected) {
      throw new HttpException(
        'Error deleting sourcing zone',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return sourcingZone;
  }

  // create a new microarea
  async createMicroarea(createMicroareaInput: CreateMicroareaInput) {
    const polygon: Polygon = {
      type: 'Polygon',
      coordinates: [createMicroareaInput.polygon],
    };

    const microarea = new Microarea();
    microarea.name = createMicroareaInput.name;
    microarea.polygon = polygon;

    // get sourcing zone with id where isDeleted is false
    const sourcingZone = await this.sourcingZoneRepository.findOne({
      where: { id: createMicroareaInput.sourcingZoneId, isDeleted: false },
    });

    // if sourcing zone is not found throw error
    if (!sourcingZone) {
      throw new HttpException('Sourcing zone not found', HttpStatus.NOT_FOUND);
    }

    // assign sourcing zone to microarea
    microarea.sourcingZone = sourcingZone;
    // save microarea
    return await this.microareaRepository.save(microarea);
  }

  // find all microareas
  async findAllMicroareas() {
    // get all microareas where isDeleted is false
    const microareas = await this.microareaRepository.find({
      where: { isDeleted: false },
    });

    // map all microareas to include sourcing zone relationship
    const microareasWithSourcingZone = microareas.map((microarea) => {
      // get sourcing zone by microarea.sourcingZoneId
      const sourcingZone = this.findOneSourcingZoneById(
        microarea.sourcingZoneId,
      );
      // return microarea with sourcing zone relationship
      return {
        ...microarea,
        sourcingZone,
      };
    });

    return microareasWithSourcingZone;
  }

  // find one microarea by id
  async findOneMicroareaById(id: number) {
    // get microarea with id where isDeleted is false

    const microarea: Microarea = await this.microareaRepository.findOne({
      where: { id, isDeleted: false },
      relations: {
        sourcingZone: {
          zone: true,
        },
      },
    });

    // if microarea is not found throw error
    if (!microarea) {
      throw new HttpException('Microarea not found', HttpStatus.NOT_FOUND);
    }
    return microarea;
  }

  // update microarea
  async updateMicroarea(
    id: number,
    updateMicroareaInput: UpdateMicroareaInput,
  ) {
    const microarea = await this.microareaRepository.findOne({
      where: { id: id, isDeleted: false },
    });

    // if microarea is not found throw error
    if (!microarea) {
      throw new HttpException('Microarea not found', HttpStatus.NOT_FOUND);
    }

    // if polygon data array is provided, convert it to polygon type
    if (updateMicroareaInput.polygon) {
      const polygon: Polygon = {
        type: 'Polygon',
        coordinates: [updateMicroareaInput.polygon],
      };
      microarea.polygon = polygon;
      // remove polygon data from updateMicroareaInput
      delete updateMicroareaInput.polygon;
    }

    // if sourcing zoneId is provided, get sourcing zone with id where isDeleted is false
    if (updateMicroareaInput.sourcingZoneId) {
      const newSourcingZone = await this.sourcingZoneRepository.findOne({
        where: { id: updateMicroareaInput.sourcingZoneId, isDeleted: false },
      });

      // if sourcing zone is not found throw error
      if (!newSourcingZone) {
        throw new HttpException(
          'Sourcing zone not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // assign sourcing zone to microarea
      microarea.sourcingZone = newSourcingZone;
      // remove sourcing zoneId from updateMicroareaInput
      delete updateMicroareaInput.sourcingZoneId;
    }

    // assign all other fields to microarea
    Object.assign(microarea, updateMicroareaInput);

    const updatedMicroarea = await this.microareaRepository.save(microarea);

    // get sourcing zone with id where isDeleted is false
    const sourcingZone = await this.sourcingZoneRepository.findOne({
      where: { id: microarea.sourcingZoneId, isDeleted: false },
    });

    // return updatedMicroarea with sourcing zone
    return {
      ...updatedMicroarea,
      sourcingZone,
    };
  }

  // delete microarea
  async deleteMicroarea(id: number) {
    const microarea = await this.microareaRepository.findOne({
      where: { id, isDeleted: false },
    });

    // if microarea is not found throw error
    if (!microarea) {
      throw new HttpException('Microarea not found', HttpStatus.NOT_FOUND);
    }

    // set isDeleted to true
    // microarea.isDeleted = true;

    // return await this.microareaRepository.save(microarea);

    // implement soft delete
    const deleteResponse = await this.microareaRepository.softDelete(id);
    if (!deleteResponse.affected) {
      throw new HttpException(
        'Error deleting microarea',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return microarea;
  }

  // resolve location from longitude and latitude
  async resolveLocation(longitude: number, latitude: number) {
    // create queryRunner to run queries
    // const dataSource = await this.dataSource.initialize();
    const queryRunner = await this.dataSource.createQueryRunner();
    const query = `SELECT id from microarea WHERE ST_COVERS(polygon , ST_GeometryFromText('POINT(${longitude} ${latitude})',4326));`;
    const result = await queryRunner.manager.query(query);
    // console.log(query, result);

    // if result is empty throw error
    if (!result.length) {
      // throw new HttpException('Out of service area', HttpStatus.NOT_FOUND);
      const microarea: Microarea[] = await this.microareaRepository.find({
        where: { id: 1136, isDeleted: false },
        relations: {
          sourcingZone: {
            zone: true,
          },
        },
      });

      await queryRunner.release();
      return microarea;
    }

    const microareas = await Promise.all(
      result.map(async (microarea) => {
        return await this.findOneMicroareaById(microarea.id);
      }),
    );

    // close queryRunner
    await queryRunner.release();
    return microareas;
  }

  async seedLocations() {
    // get all files in 'legacy_data/locations' directory
    const seed_files = readdirSync(path.resolve('legacy_data/locations'), {
      withFileTypes: true,
    })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    // sort the files by name in descending order
    seed_files.sort((a, b) => {
      return b.localeCompare(a);
    });

    // console.log(seed_files);

    // for each seed file
    for (const seed_file of seed_files) {
      // read the zones.json file in legacy_data/locations directory
      const data = readFileSync(
        path.resolve('legacy_data/locations/' + seed_file),
      );
      // parse the json file
      const areas = JSON.parse(data.toString());

      // sort zones by id
      const sortedAreas = areas.sort((a, b) => a.id - b.id);

      // for each zone
      for (const area of sortedAreas) {
        // create a polygon
        const polygon: Polygon = {
          type: 'Polygon',
          coordinates: [area.polygon],
        };

        // if seed file is zones.json
        if (seed_file === 'zones.json') {
          // typecast area to Zone
          const zone: Zone = area as Zone;
          // save the polygon and name to the database
          await this.zoneRepository.save({
            name: zone.name,
            polygon,
          });
        }
        // if seed file is sourcing_zones.json
        else if (seed_file === 'sourcing_zones.json') {
          // create new sourcing zone
          const sourcingZone: SourcingZone = new SourcingZone();
          sourcingZone.name = area.name;
          sourcingZone.polygon = polygon;
          const zone: Zone = await this.findOneZoneById(area.zone_id);
          if (zone) {
            sourcingZone.zone = zone;
            sourcingZone.legacyId = area.id;
            // save the sourcing zone to the database
            await this.sourcingZoneRepository.save(sourcingZone);
          } else {
            // throw error if zone is not found
            throw new HttpException(
              'Zone not found for sourcing ',
              HttpStatus.NOT_FOUND,
            );
          }
        } else {
          // create new microarea
          const microarea: Microarea = new Microarea();
          microarea.name = area.name;
          microarea.polygon = polygon;
          const sourcingZone: SourcingZone =
            await this.sourcingZoneRepository.findOne({
              where: { legacyId: area.sourcing_zone_id },
            });

          if (sourcingZone) {
            microarea.sourcingZone = sourcingZone;
            // save the microarea to the database
            await this.microareaRepository.save(microarea);
          } else {
            // throw error if sourcing zone is not found
            // throw new HttpException('Sourcing zone not found', HttpStatus.NOT_FOUND);
            // console.log(
            //   'Sourcing zone not found for microarea ' + area.name + area.id,
            // );
          }
        }
      }
    }

    return true;
  }
}
