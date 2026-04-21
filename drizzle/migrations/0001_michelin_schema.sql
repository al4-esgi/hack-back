CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);

CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"region" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cities_country_id_name_unique" UNIQUE("country_id","name")
);

CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"symbol" varchar(5) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);

CREATE TABLE "price_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency_id" integer NOT NULL,
	"symbol_count" integer NOT NULL,
	"raw_label" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_levels_raw_label_unique" UNIQUE("raw_label"),
	CONSTRAINT "price_levels_currency_id_symbol_count_unique" UNIQUE("currency_id","symbol_count")
);

CREATE TABLE "cuisines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(140) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cuisines_name_unique" UNIQUE("name"),
	CONSTRAINT "cuisines_normalized_name_unique" UNIQUE("normalized_name")
);

CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(140) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facilities_name_unique" UNIQUE("name"),
	CONSTRAINT "facilities_normalized_name_unique" UNIQUE("normalized_name")
);

CREATE TABLE "award_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"label" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "award_types_code_unique" UNIQUE("code")
);

CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city_id" integer NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"phone_number" varchar(40),
	"source_url" varchar(500) NOT NULL,
	"website_url" varchar(500),
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "restaurant_cuisines" (
	"restaurant_id" integer NOT NULL,
	"cuisine_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_cuisines_restaurant_id_cuisine_id_pk" PRIMARY KEY("restaurant_id","cuisine_id")
);

CREATE TABLE "restaurant_facilities" (
	"restaurant_id" integer NOT NULL,
	"facility_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_facilities_restaurant_id_facility_id_pk" PRIMARY KEY("restaurant_id","facility_id")
);

CREATE TABLE "restaurant_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"award_type_id" integer NOT NULL,
	"award_code" varchar(40) NOT NULL,
	"stars_count" integer,
	"green_star" boolean DEFAULT false NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_awards_unique_period" UNIQUE("restaurant_id","award_type_id","valid_from"),
	CONSTRAINT "restaurant_awards_stars_coherence_check" CHECK ((("award_code" = 'MICHELIN_STAR' AND "stars_count" IN (1, 2, 3)) OR ("award_code" <> 'MICHELIN_STAR' AND "stars_count" IS NULL)))
);

CREATE TABLE "restaurant_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"price_level_id" integer NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_prices_restaurant_id_valid_from_unique" UNIQUE("restaurant_id","valid_from")
);

CREATE TABLE "ingestion_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_name" varchar(255) NOT NULL,
	"source_hash" varchar(128) NOT NULL,
	"row_count" integer NOT NULL,
	"status" varchar(30) NOT NULL,
	"message" text,
	"imported_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "price_levels" ADD CONSTRAINT "price_levels_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "restaurant_cuisines" ADD CONSTRAINT "restaurant_cuisines_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "restaurant_cuisines" ADD CONSTRAINT "restaurant_cuisines_cuisine_id_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cuisines"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "restaurant_facilities" ADD CONSTRAINT "restaurant_facilities_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "restaurant_facilities" ADD CONSTRAINT "restaurant_facilities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "restaurant_awards" ADD CONSTRAINT "restaurant_awards_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "restaurant_awards" ADD CONSTRAINT "restaurant_awards_award_type_id_award_types_id_fk" FOREIGN KEY ("award_type_id") REFERENCES "public"."award_types"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "restaurant_prices" ADD CONSTRAINT "restaurant_prices_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "restaurant_prices" ADD CONSTRAINT "restaurant_prices_price_level_id_price_levels_id_fk" FOREIGN KEY ("price_level_id") REFERENCES "public"."price_levels"("id") ON DELETE restrict ON UPDATE cascade;

CREATE UNIQUE INDEX "restaurants_source_url_unique" ON "restaurants" USING btree ("source_url");
CREATE INDEX "restaurants_name_idx" ON "restaurants" USING btree ("name");
CREATE INDEX "restaurants_city_id_name_idx" ON "restaurants" USING btree ("city_id","name");
