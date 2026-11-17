CREATE TYPE "public"."crystal_system" AS ENUM('triclinic', 'monoclinic', 'orthorhombic', 'tetragonal', 'trigonal', 'hexagonal', 'cubic');--> statement-breakpoint
CREATE TYPE "public"."specimen_media_role" AS ENUM('gallery', 'macro', 'video', 'model', 'panorama');--> statement-breakpoint
CREATE TYPE "public"."specimen_relation_kind" AS ENUM('related', 'variant', 'same_locality');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_kind" AS ENUM('mineral_family', 'scientific_group', 'specimen_type', 'origin_kind');--> statement-breakpoint
CREATE TABLE "taxonomy_term_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"label" text NOT NULL,
	"description" text,
	CONSTRAINT "taxonomy_term_translations_term_locale_key" UNIQUE("term_id","locale")
);
--> statement-breakpoint
CREATE TABLE "taxonomy_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "taxonomy_kind" NOT NULL,
	"code" text NOT NULL,
	"latin_name" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxonomy_terms_kind_code_key" UNIQUE("kind","code")
);
--> statement-breakpoint
CREATE TABLE "hall_specimens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hall_id" uuid NOT NULL,
	"specimen_id" uuid NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hall_specimens_hall_specimen_key" UNIQUE("hall_id","specimen_id")
);
--> statement-breakpoint
CREATE TABLE "hall_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hall_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text,
	"image_alt" text,
	"seo_title" text,
	"seo_description" text,
	"search_text" text,
	"search_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', coalesce(search_text, ''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hall_translations_hall_locale_key" UNIQUE("hall_id","locale"),
	CONSTRAINT "hall_translations_locale_slug_key" UNIQUE("locale","slug")
);
--> statement-breakpoint
CREATE TABLE "halls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"latin_name" text NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"hero_media_id" uuid,
	"cover_media_id" uuid,
	"cover_image_key" text,
	"hero_image_key" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "halls_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "specimen_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"specimen_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"role" "specimen_media_role" DEFAULT 'gallery' NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specimen_media_specimen_media_key" UNIQUE("specimen_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "specimen_provenances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"specimen_id" uuid NOT NULL,
	"country_code" text,
	"country_name" text,
	"region" text,
	"locality" text,
	"note" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specimen_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"specimen_id" uuid NOT NULL,
	"related_specimen_id" uuid NOT NULL,
	"kind" "specimen_relation_kind" DEFAULT 'related' NOT NULL,
	"note" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specimen_relations_pair_key" UNIQUE("specimen_id","related_specimen_id")
);
--> statement-breakpoint
CREATE TABLE "article_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"url" text,
	"year" integer,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_specimens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"specimen_id" uuid NOT NULL,
	"note" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "article_specimens_pair_key" UNIQUE("article_id","specimen_id")
);
--> statement-breakpoint
CREATE TABLE "article_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"latin_title" text,
	"excerpt" text,
	"body" text,
	"seo_title" text,
	"seo_description" text,
	"search_text" text,
	"search_tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', coalesce(search_text, ''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "article_translations_article_locale_key" UNIQUE("article_id","locale"),
	CONSTRAINT "article_translations_locale_slug_key" UNIQUE("locale","slug")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"category_id" uuid,
	"cover_media_id" uuid,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "articles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "formation" text;--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "history" text;--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "colors" text[];--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "transparency" text[];--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "luster" text;--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "cleavage" text;--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "fracture" text;--> statement-breakpoint
ALTER TABLE "specimen_translations" ADD COLUMN "title_sort_key" text;--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "scientific_name" text;--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "chemical_formula" text;--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "crystal_system" "crystal_system";--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "mohs_min" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "mohs_max" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "density_min" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "density_max" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "refractive_index_min" numeric(5, 3);--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "refractive_index_max" numeric(5, 3);--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "mineral_family_id" uuid;--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "scientific_group_id" uuid;--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "specimen_type_id" uuid;--> statement-breakpoint
ALTER TABLE "specimens" ADD COLUMN "origin_kind_id" uuid;--> statement-breakpoint
ALTER TABLE "taxonomy_term_translations" ADD CONSTRAINT "taxonomy_term_translations_term_id_taxonomy_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_specimens" ADD CONSTRAINT "hall_specimens_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_specimens" ADD CONSTRAINT "hall_specimens_specimen_id_specimens_id_fk" FOREIGN KEY ("specimen_id") REFERENCES "public"."specimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_translations" ADD CONSTRAINT "hall_translations_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halls" ADD CONSTRAINT "halls_hero_media_id_media_assets_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halls" ADD CONSTRAINT "halls_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halls" ADD CONSTRAINT "halls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halls" ADD CONSTRAINT "halls_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimen_media" ADD CONSTRAINT "specimen_media_specimen_id_specimens_id_fk" FOREIGN KEY ("specimen_id") REFERENCES "public"."specimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimen_media" ADD CONSTRAINT "specimen_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimen_provenances" ADD CONSTRAINT "specimen_provenances_specimen_id_specimens_id_fk" FOREIGN KEY ("specimen_id") REFERENCES "public"."specimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimen_relations" ADD CONSTRAINT "specimen_relations_specimen_id_specimens_id_fk" FOREIGN KEY ("specimen_id") REFERENCES "public"."specimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimen_relations" ADD CONSTRAINT "specimen_relations_related_specimen_id_specimens_id_fk" FOREIGN KEY ("related_specimen_id") REFERENCES "public"."specimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_specimens" ADD CONSTRAINT "article_specimens_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_specimens" ADD CONSTRAINT "article_specimens_specimen_id_specimens_id_fk" FOREIGN KEY ("specimen_id") REFERENCES "public"."specimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_taxonomy_terms_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "taxonomy_terms_kind_order_idx" ON "taxonomy_terms" USING btree ("kind","sort_order");--> statement-breakpoint
CREATE INDEX "hall_specimens_hall_order_idx" ON "hall_specimens" USING btree ("hall_id","sort_order");--> statement-breakpoint
CREATE INDEX "hall_specimens_specimen_idx" ON "hall_specimens" USING btree ("specimen_id");--> statement-breakpoint
CREATE INDEX "hall_translations_locale_idx" ON "hall_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "hall_translations_search_idx" ON "hall_translations" USING gin ("search_tsv");--> statement-breakpoint
CREATE INDEX "halls_status_order_idx" ON "halls" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "halls_cover_media_idx" ON "halls" USING btree ("cover_media_id");--> statement-breakpoint
CREATE INDEX "specimen_media_specimen_order_idx" ON "specimen_media" USING btree ("specimen_id","sort_order");--> statement-breakpoint
CREATE INDEX "specimen_media_media_idx" ON "specimen_media" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "specimen_provenances_specimen_idx" ON "specimen_provenances" USING btree ("specimen_id","sort_order");--> statement-breakpoint
CREATE INDEX "specimen_provenances_country_idx" ON "specimen_provenances" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "specimen_relations_specimen_idx" ON "specimen_relations" USING btree ("specimen_id","sort_order");--> statement-breakpoint
CREATE INDEX "specimen_relations_related_idx" ON "specimen_relations" USING btree ("related_specimen_id");--> statement-breakpoint
CREATE INDEX "article_sources_article_order_idx" ON "article_sources" USING btree ("article_id","sort_order");--> statement-breakpoint
CREATE INDEX "article_specimens_article_order_idx" ON "article_specimens" USING btree ("article_id","sort_order");--> statement-breakpoint
CREATE INDEX "article_specimens_specimen_idx" ON "article_specimens" USING btree ("specimen_id");--> statement-breakpoint
CREATE INDEX "article_translations_locale_idx" ON "article_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "article_translations_search_idx" ON "article_translations" USING gin ("search_tsv");--> statement-breakpoint
CREATE INDEX "articles_status_published_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_mineral_family_id_taxonomy_terms_id_fk" FOREIGN KEY ("mineral_family_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_scientific_group_id_taxonomy_terms_id_fk" FOREIGN KEY ("scientific_group_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_specimen_type_id_taxonomy_terms_id_fk" FOREIGN KEY ("specimen_type_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_origin_kind_id_taxonomy_terms_id_fk" FOREIGN KEY ("origin_kind_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "specimen_translations_sort_idx" ON "specimen_translations" USING btree ("title_sort_key");--> statement-breakpoint
CREATE INDEX "specimen_translations_colors_idx" ON "specimen_translations" USING gin ("colors");--> statement-breakpoint
CREATE INDEX "specimen_translations_transparency_idx" ON "specimen_translations" USING gin ("transparency");--> statement-breakpoint
CREATE INDEX "specimens_status_updated_idx" ON "specimens" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "specimens_family_idx" ON "specimens" USING btree ("mineral_family_id");--> statement-breakpoint
CREATE INDEX "specimens_group_idx" ON "specimens" USING btree ("scientific_group_id");--> statement-breakpoint
CREATE INDEX "specimens_type_idx" ON "specimens" USING btree ("specimen_type_id");--> statement-breakpoint
CREATE INDEX "specimens_scientific_name_idx" ON "specimens" USING btree ("scientific_name");--> statement-breakpoint
CREATE INDEX "specimens_deleted_idx" ON "specimens" USING btree ("deleted_at");