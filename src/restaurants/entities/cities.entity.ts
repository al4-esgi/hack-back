import { integer, pgTable, serial, unique, varchar } from 'drizzle-orm/pg-core';
import { countries } from './countries.entity';
import { timestamps } from './_shared';

export const cities = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    countryId: integer('country_id')
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    ...timestamps,
  },
  table => [unique('cities_country_id_name_unique').on(table.countryId, table.name)],
);

