import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 3 }).notNull().unique(),
  symbol: varchar('symbol', { length: 5 }).notNull(),
  ...timestamps,
});

