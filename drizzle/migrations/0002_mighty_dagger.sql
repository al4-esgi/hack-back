ALTER TABLE "user" ADD COLUMN "photo_url" varchar;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_google_id_unique" UNIQUE("google_id");