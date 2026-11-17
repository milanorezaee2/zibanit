/**
 * GEMORIA — the encyclopedia.
 *
 * The museum's explanatory layer: articles that answer a question («چرا سختی
 * الماس و گرافیت این‌قدر متفاوت است؟») and are attached to the objects that
 * illustrate it. Structure only — no article body is invented here. An article
 * appears when a curator writes one and cites a source.
 *
 * `article_sources` exists because «منابع علمی» is part of the requirement, and a
 * science text without a citation is an assertion, not an exhibit.
 */
import { index, integer, pgTable, smallint, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { localeEnum, publicationStatusEnum } from './enums';
import { users } from './identity';
import { mediaAssets } from './media';
import { specimens } from './specimens';
import { taxonomyTerms } from './taxonomy';
import { tsvector } from './types';
import { sql } from 'drizzle-orm';

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stable key for seeds and imports. Never a URL. */
    code: text('code').notNull().unique(),
    status: publicationStatusEnum('status').notNull().default('draft'),
    /** The scientific axis the article belongs to (taxonomy kind `scientific_group`
     *  is not reused here: an article category is editorial, so it is its own
     *  reference into the term table only when a museum wants one). */
    categoryId: uuid('category_id').references(() => taxonomyTerms.id, { onDelete: 'set null' }),
    coverMediaId: uuid('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('articles_status_published_idx').on(table.status, table.publishedAt),
    index('articles_category_idx').on(table.categoryId),
  ],
);

export const articleTranslations = pgTable(
  'article_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    /** The Latin designation, printed small beneath the Persian heading. */
    latinTitle: text('latin_title'),
    excerpt: text('excerpt'),
    body: text('body'),
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
    unique('article_translations_article_locale_key').on(table.articleId, table.locale),
    unique('article_translations_locale_slug_key').on(table.locale, table.slug),
    index('article_translations_locale_idx').on(table.locale),
    index('article_translations_search_idx').using('gin', table.searchTsv),
  ],
);

/** Which objects illustrate an article, in the author's order. */
export const articleSpecimens = pgTable(
  'article_specimens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    note: text('note'),
    sortOrder: smallint('sort_order').notNull().default(0),
  },
  (table) => [
    unique('article_specimens_pair_key').on(table.articleId, table.specimenId),
    index('article_specimens_article_order_idx').on(table.articleId, table.sortOrder),
    index('article_specimens_specimen_idx').on(table.specimenId),
  ],
);

/** A citation. `url` is optional: many references are printed, not linked. */
export const articleSources = pgTable(
  'article_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    publisher: text('publisher'),
    url: text('url'),
    year: integer('year'),
    sortOrder: smallint('sort_order').notNull().default(0),
  },
  (table) => [index('article_sources_article_order_idx').on(table.articleId, table.sortOrder)],
);
