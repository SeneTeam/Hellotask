import {
  ObjectType,
  Field,
  Int,
  FieldMiddleware,
  MiddlewareContext,
  NextFn,
} from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Polygon } from 'geojson';

// middleware to convert polygon to array of array of numbers
const polygonMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const polygon = await next();
  // convert polygon to array of arrays of number
  return polygon.coordinates[0].map((coord) => {
    return [coord[0], coord[1]];
  });
};

@Entity()
@ObjectType()
export abstract class LocationBase {
  // auto increment id column and field
  @Field(() => Int, { description: 'ID of location type' })
  @PrimaryGeneratedColumn()
  id: number;

  // name column and field
  @Field(() => String, { description: 'Name of the location type' })
  @Column()
  name: string;

  // polygon column and field
  @Field(() => [[Number]], {
    description:
      'Polygons of area as a 2D aray. e.g., [[long, lat], [long, lat]]',
    middleware: [polygonMiddleware],
  })
  @Column({
    type: 'geography',
    nullable: true,
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  polygon: Polygon;

  // isDisabled column and field
  @Field(() => Boolean, { description: 'Is the area disabled' })
  @Column({ default: false })
  isDisabled: boolean;

  // deletedAt column and field
  @Field(() => Date, { nullable: true })
  @DeleteDateColumn()
  deletedAt: Date;

  // isDeleted column and field
  @Field(() => Boolean, { description: 'Is the area deleted' })
  @Column({ default: false })
  isDeleted: boolean;

  // createdAt column and field
  @Field(() => Date, { description: 'Area created at' })
  @CreateDateColumn()
  createdAt: Date;

  // UpdatedAt column and field
  @Field(() => Date, { description: 'Area updated at' })
  @UpdateDateColumn()
  updatedAt: Date;
}
