import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const ingestionLogs = pgTable('ingestion_logs', {
  id: serial('id').primaryKey(),
  sourceName: varchar('source_name', { length: 255 }).notNull(),
  sourceHash: varchar('source_hash', { length: 128 }).notNull(),
  rowCount: integer('row_count').notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  message: text('message'),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
});

