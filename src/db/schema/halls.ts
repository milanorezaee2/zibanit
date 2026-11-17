/**
 * GEMORIA — the halls of the museum.
 *
 * A hall is the museum's display architecture: six permanent galleries, each with
 * its own photograph, its own catalogue text and its own order in the visitor's
 * walk. It is *not* a scientific classification — see `taxonomy.ts` for that.
 *
 * Language-neutral facts (code, order, status, art direction) live on `halls`;
 * everything a visitor reads lives on `hall_translations`. That split is what
 * makes an English or Arabic edition a translation job rather than a refactor: a
 * new locale adds rows, never columns.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
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
import { specimens } from './specimens';
import { tsvector } from './types';

export const halls = pgTable(
  'halls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stable key used by seeds, imports and internal links. Never a URL. */
    code: text('code').notNull().unique(),
    /**
     * The Latin designation («Precious Gemstones»). Language-neutral on purpose:
     * it is the museum's second voice on a Persian page, printed small under the
     * Persian title, and it is also the natural English heading.
     */
    latinName: text('latin_name').notNull(),
    status: publicationStatusEnum('status').notNull().default('draft'),
    sortOrder: smallint('sort_order').notNull().default(0),
    /** Above-the-fold photograph for the hall's own page. */
    heroMediaId: uuid('hero_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    /** The photograph used on the index and on the homepage. */
    coverMediaId: uuid('cover_media_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    /**
     * Build-asset keys for the six permanent halls.
     *
     * The halls' art direction ships with the build (`src/content/media.generated.ts`)
     * rather than living in the media library: they are six fixed photographs,
     * optimised and versioned with the code, and there is no storage driver for the
     * catalogue yet. A catalogue photograph of a single object is a `media_assets`
     * row; the painting on the wall of a permanent gallery is not yet another
     * upload to manage. When the media library takes over, these keys become
     * `cover_media_id` and nothing else changes.
     */
    coverImageKey: text('cover_image_key'),
    heroImageKey: text('hero_image_key'),
    /**
     * Art direction for the homepage gallery. Six halls are not rendered as six
     * identical cards, so the intended emphasis is a property of the hall.
     */
    isFeatured: boolean('is_featured').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('halls_status_order_idx').on(table.status, table.sortOrder),
    index('halls_cover_media_idx').on(table.coverMediaId),
  ],
);

export const hallTranslations = pgTable(
  'hall_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hallId: uuid('hall_id')
      .notNull()
      .references(() => halls.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    /** One sentence, used on the index card and on the homepage. */
    summary: text('summary').notNull(),
    /** The catalogue text of the hall's own page. */
    description: text('description'),
    imageAlt: text('image_alt'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    searchText: text('search_text'),
    searchTsv: tsvector('search_tsv').generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce(search_text, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('hall_translations_hall_locale_key').on(table.hallId, table.locale),
    unique('hall_translations_locale_slug_key').on(table.locale, table.slug),
    index('hall_translations_locale_idx').on(table.locale),
    index('hall_translations_search_idx').using('gin', table.searchTsv),
  ],
);

/**
 * The many-to-many between halls and specimens.
 *
 * «یک نمونه می‌تواند در چند تالار نمایش داده شود، بدون اینکه اطلاعات اصلی آن
 * تکرار شود.» — This join is that sentence, and nothing else: the specimen row
 * exists once, its translations exist once, and the halls only reference it.
 *
 * `sortOrder` is per hall, because a curator ordering the Crystals gallery has no
 * opinion about where the same object sits in Rare Minerals.
 */
export const hallSpecimens = pgTable(
  'hall_specimens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hallId: uuid('hall_id')
      .notNull()
      .references(() => halls.id, { onDelete: 'cascade' }),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('hall_specimens_hall_specimen_key').on(table.hallId, table.specimenId),
    index('hall_specimens_hall_order_idx').on(table.hallId, table.sortOrder),
    index('hall_specimens_specimen_idx').on(table.specimenId),
  ],
);
