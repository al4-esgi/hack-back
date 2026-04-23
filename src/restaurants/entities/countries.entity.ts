import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  ...timestamps,
});
