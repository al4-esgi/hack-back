CREATE TYPE "public"."instagram_post_type" AS ENUM('Image', 'Sidecar', 'Video');--> statement-breakpoint
CREATE TABLE "instagram_post" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"full_name" varchar,
	"caption" text,
	"type" "instagram_post_type" NOT NULL,
	"url" text NOT NULL,
	"display_url" text NOT NULL,
	"images" json DEFAULT '[]'::json NOT NULL,
	"hashtags" json DEFAULT '[]'::json NOT NULL,
	"likes_count" integer,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"post_timestamp" timestamp NOT NULL,
	"location_name" varchar,
	"source_query" varchar NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstname" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastname" varchar NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_instagram_post_source_query_scraped_at" ON "instagram_post" USING btree ("source_query","scraped_at");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "username";