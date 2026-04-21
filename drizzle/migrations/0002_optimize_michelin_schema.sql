-- Migration: Corriger Green Star comme award séparé (pas attribut)

-- 1. Green Star devrait être un award_type séparé
INSERT INTO "award_types" ("code", "label")
VALUES ('GREEN_STAR', 'Green Star')
ON CONFLICT ("code") DO NOTHING;

-- 2. Supprimer award_code redondant de restaurant_awards
ALTER TABLE "restaurant_awards" DROP COLUMN IF EXISTS "award_code";

-- 3. Supprimer green_star de restaurant_awards (c'est un award_type, pas un attribut)
ALTER TABLE "restaurant_awards" DROP COLUMN IF EXISTS "green_star";

-- 4. Simplifier restaurant_prices pour seulement prix actuel
ALTER TABLE "restaurant_prices" DROP COLUMN IF EXISTS "valid_from";
ALTER TABLE "restaurant_prices" DROP COLUMN IF EXISTS "valid_to";

-- 5. Indexes sur FK pour performance
CREATE INDEX IF NOT EXISTS "restaurant_cuisines_cuisine_id_idx" ON "restaurant_cuisines"("cuisine_id");
CREATE INDEX IF NOT EXISTS "restaurant_facilities_facility_id_idx" ON "restaurant_facilities"("facility_id");
CREATE INDEX IF NOT EXISTS "restaurants_city_id_idx" ON "restaurants"("city_id");
CREATE INDEX IF NOT EXISTS "restaurant_awards_award_type_id_idx" ON "restaurant_awards"("award_type_id");

-- 6. Index géo pour recherche spatiale (sans PostGIS)
CREATE INDEX IF NOT EXISTS "restaurants_latitude_longitude_idx" ON "restaurants"("latitude", "longitude");

-- 7. Nettoyage restaurant_prices: supprimer doublons (garde un par restaurant)
DELETE FROM "restaurant_prices" p1
WHERE EXISTS (
  SELECT 1 FROM "restaurant_prices" p2
  WHERE p2."restaurant_id" = p1."restaurant_id"
  AND p2."id" < p1."id"
);

-- 8. Check mis à jour (PostgreSQL n'autorise pas les sous-requêtes vers d'autres tables dans CHECK)
ALTER TABLE "restaurant_awards" DROP CONSTRAINT IF EXISTS "restaurant_awards_stars_coherence_check";
ALTER TABLE "restaurant_awards" ADD CONSTRAINT "restaurant_awards_stars_coherence_check" CHECK (
  "stars_count" IS NULL OR "stars_count" IN (1, 2, 3)
);
