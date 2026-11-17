/**
 * GEMORIA — the objects of the museum.
 *
 * This is the core pair of Phase 0: `specimens` holds language-neutral facts
 * (inventory number, status, weight, provenance, relationships) and
 * `specimen_translations` holds everything a visitor reads. Slugs live on the
 * translation, so the same object can be `/specimens/زمرد-موزو` in Persian and
 * `/en/specimens/emerald-muzo` later without breaking a single link.
 *
 * Phase 1 adds the taxonomy (mineral species, variety, colour, cut, treatment),
 * geography, collections and the gallery join table. The translation mechanism,
 * the slug uniqueness rule and the search column are established here once, so
 * every later entity follows a proven pattern rather than inventing one.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { localeEnum, publicationStatusEnum } from './enums';
import { users } from './identity';
import { mediaAssets } from './media';
import { tsvector } from './types';

export const specimens = pgTable(
  'specimens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stable, language-neutral accession number. Never shown as a URL. */
    inventoryNo: text('inventory_no').notNull().unique(),
    status: publicationStatusEnum('status').notNull().default('draft'),
    /** Carat weight is measured, so it is exact decimal — never a float. */
    weightCt: numeric('weight_ct', { precision: 10, scale: 3 }),
    dimensionsMm: text('dimensions_mm'),
    pieces: smallint('pieces').notNull().default(1),
    provenance: text('provenance'),
    certificateRef: text('certificate_ref'),
    acquiredAt: date('acquired_at'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isHighlight: boolean('is_highlight').notNull().default(false),
    primaryMediaId: uuid('primary_media_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    /** Soft delete: published museum objects are archived, not destroyed. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('specimens_status_published_idx').on(table.status, table.publishedAt),
    index('specimens_featured_idx').on(table.isFeatured),
    index('specimens_primary_media_idx').on(table.primaryMediaId),
  ],
);

export const specimenTranslations = pgTable(
  'specimen_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    /** Unique per locale, not globally: /specimens/زمرد and /en/specimens/emerald. */
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    summary: text('summary'),
    story: text('story'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    /** Normalised Persian text; `search_tsv` is derived from it by the database. */
    searchText: text('search_text'),
    searchTsv: tsvector('search_tsv').generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce(search_text, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('specimen_translations_specimen_locale_key').on(table.specimenId, table.locale),
    unique('specimen_translations_locale_slug_key').on(table.locale, table.slug),
    index('specimen_translations_search_idx').using('gin', table.searchTsv),
    index('specimen_translations_locale_idx').on(table.locale),
  ],
);
