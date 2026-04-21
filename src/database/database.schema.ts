import { user } from 'src/users/users.entity';
import {
  awardTypes,
  cities,
  countries,
  cuisines,
  currencies,
  facilities,
  ingestionLogs,
  priceLevels,
  restaurantAwards,
  restaurantCuisines,
  restaurantFacilities,
  restaurantPrices,
  restaurants,
} from 'src/restaurants/entities';

export const schema = {
  user,
  countries,
  cities,
  restaurants,
  cuisines,
  restaurantCuisines,
  facilities,
  restaurantFacilities,
  awardTypes,
  restaurantAwards,
  currencies,
  priceLevels,
  restaurantPrices,
  ingestionLogs,
};
export type Schema = typeof schema;
export type SchemaName = keyof Schema;

export type { GetUserType } from 'src/users/users.entity'
