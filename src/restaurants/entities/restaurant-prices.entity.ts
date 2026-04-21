import { date, integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';
import { priceLevels } from './price-levels.entity';
import { restaurants } from './restaurants.entity';
import { timestamps } from './_shared';

export const restaurantPrices = pgTable(
  'restaurant_prices',
  {
    id: serial('id').primaryKey(),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    priceLevelId: integer('price_level_id')
      .notNull()
      .references(() => priceLevels.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    validFrom: date('valid_from'),
    validTo: date('valid_to'),
    ...timestamps,
  },
  table => [unique('restaurant_prices_restaurant_id_valid_from_unique').on(table.restaurantId, table.validFrom)],
);

