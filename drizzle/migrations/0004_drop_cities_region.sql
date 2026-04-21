-- Remove unused region column from cities (not populated by import)

ALTER TABLE "cities" DROP COLUMN IF EXISTS "region";
