import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

export const cuisines = pgTable('cuisines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull().unique(),
  normalizedName: varchar('normalized_name', { length: 140 }).notNull().unique(),
  ...timestamps,
});

