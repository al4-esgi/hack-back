-- Migration: Simplifier price_level - Option 1 (champ direct dans restaurants)

-- 1. Ajouter price_level integer à restaurants
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "price_level" integer;

-- 2. Migrer données existantes depuis restaurant_prices vers price_level
UPDATE "restaurants" r
SET "price_level" = (
  SELECT pl."symbol_count"
  FROM "restaurant_prices" rp
  INNER JOIN "price_levels" pl ON rp."price_level_id" = pl.id
  WHERE rp."restaurant_id" = r.id
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "restaurant_prices" rp
  WHERE rp."restaurant_id" = r.id
);

-- 3. Rendre price_level nullable et ajouter contrainte (1-4)
ALTER TABLE "restaurants" ALTER COLUMN "price_level" DROP NOT NULL;
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_price_level_check" CHECK ("price_level" IS NULL OR "price_level" BETWEEN 1 AND 4);

-- 4. Supprimer les tables obsolètes
DROP TABLE IF EXISTS "restaurant_prices" CASCADE;
DROP TABLE IF EXISTS "price_levels" CASCADE;
DROP TABLE IF EXISTS "currencies" CASCADE;

-- 5. Nettoyage: supprimer indexes/libellé inutiles dans restaurant_prices/price_levels (déjà supprimés)
