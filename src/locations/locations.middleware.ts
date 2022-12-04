import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

export const polygonMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const polygon = await next();
  // convert polygon to array of arrays of number
  return polygon.coordinates[0].map((coord) => {
    return [coord[0], coord[1]];
  });
};

// middleware to convert GeoJSON point to array of numbers
export const pointMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const point = await next();
  // convert point to array of number if point is not null
  return point ? [point.coordinates[0], point.coordinates[1]] : null;
  // return [point.coordinates[0], point.coordinates[1]];
};
