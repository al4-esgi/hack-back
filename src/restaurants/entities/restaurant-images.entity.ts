import { index, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { restaurants } from "./restaurants.entity";
import { timestamps } from "./_shared";

export const restaurantImages = pgTable(
  "restaurant_images",
  {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("restaurant_images_restaurant_id_idx").on(table.restaurantId),
  ],
);
