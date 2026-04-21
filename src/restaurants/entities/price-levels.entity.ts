import { integer, pgTable, serial, unique, varchar } from 'drizzle-orm/pg-core';
import { currencies } from './currencies.entity';
import { timestamps } from './_shared';

export const priceLevels = pgTable(
  'price_levels',
  {
    id: serial('id').primaryKey(),
    currencyId: integer('currency_id')
      .notNull()
      .references(() => currencies.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    symbolCount: integer('symbol_count').notNull(),
    rawLabel: varchar('raw_label', { length: 10 }).notNull().unique(),
    ...timestamps,
  },
  table => [unique('price_levels_currency_id_symbol_count_unique').on(table.currencyId, table.symbolCount)],
);

