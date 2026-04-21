import { index, integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { facilities } from './facilities.entity';
import { restaurants } from './restaurants.entity';

export const restaurantFacilities = pgTable(
  'restaurant_facilities',
  {
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    facilityId: integer('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => [
    primaryKey({ columns: [table.restaurantId, table.facilityId] }),
    index('restaurant_facilities_facility_id_idx').on(table.facilityId),
  ],
);

