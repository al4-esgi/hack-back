import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

export const user = pgTable('user', {
  id: serial().primaryKey(),
  password: varchar(),
  email: varchar().notNull(),
  firstname: varchar().notNull(),
  lastname: varchar().notNull(),
  instagramId: varchar(),
  instagramAccessToken: varchar(),
  instagramTokenExpires: timestamp(),
  ...timestamps,
});

export const selectUserSchema = createSelectSchema(user);
export type SelectUser = z.infer<typeof selectUserSchema>;
