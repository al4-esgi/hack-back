import { sql } from 'drizzle-orm';
import { boolean, check, date, integer, pgTable, serial, unique, varchar } from 'drizzle-orm/pg-core';
import { awardTypes } from './award-types.entity';
import { restaurants } from './restaurants.entity';
import { timestamps } from './_shared';

export const restaurantAwards = pgTable(
  'restaurant_awards',
  {
    id: serial('id').primaryKey(),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    awardTypeId: integer('award_type_id')
      .notNull()
      .references(() => awardTypes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    awardCode: varchar('award_code', { length: 40 }).notNull(),
    starsCount: integer('stars_count'),
    greenStar: boolean('green_star').notNull().default(false),
    validFrom: date('valid_from'),
    validTo: date('valid_to'),
    ...timestamps,
  },
  table => [
    unique('restaurant_awards_unique_period').on(table.restaurantId, table.awardTypeId, table.validFrom),
    check(
      'restaurant_awards_stars_coherence_check',
      sql`(
        (${table.awardCode} = 'MICHELIN_STAR' AND ${table.starsCount} IN (1, 2, 3))
        OR
        (${table.awardCode} <> 'MICHELIN_STAR' AND ${table.starsCount} IS NULL)
      )`,
    ),
  ],
);

