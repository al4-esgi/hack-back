import {
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";
import { cuisines } from "./cuisines.entity";
import { restaurants } from "./restaurants.entity";

export const restaurantCuisines = pgTable(
  "restaurant_cuisines",
  {
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    cuisineId: integer("cuisine_id")
      .notNull()
      .references(() => cuisines.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.restaurantId, table.cuisineId] }),
    index("restaurant_cuisines_cuisine_id_idx").on(table.cuisineId),
  ],
);
