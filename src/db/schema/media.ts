/**
 * GEMORIA — media assets.
 *
 * One row per uploaded original; derived renditions (AVIF/WebP/JPEG at museum
 * sizes, video posters, 3D models) live in `media_variants` and are produced by
 * the media pipeline. Files themselves never enter the database or Git: they are
 * addressed by `storage_key` and served by a storage driver (local in
 * development, S3-compatible in production).
 */
import {
  bigint,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { localeEnum, mediaKindEnum, mediaStatusEnum } from './enums';
import { users } from './identity';

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: mediaKindEnum('kind').notNull(),
    status: mediaStatusEnum('status').notNull().default('uploading'),
    /** 'local' | 's3' — resolved by the storage driver, never hard-coded. */
    storageDriver: text('storage_driver').notNull().default('local'),
    storageKey: text('storage_key').notNull(),
    originalFilename: text('original_filename'),
    mimeType: text('mime_type').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }),
    /** sha256 of the original, used for de-duplication and integrity checks. */
    checksumSha256: text('checksum_sha256').unique(),
    width: integer('width'),
    height: integer('height'),
    durationSeconds: numeric('duration_seconds', { precision: 10, scale: 3 }),
    dominantHex: text('dominant_hex'),
    blurhash: text('blurhash'),
    credit: text('credit'),
    license: text('license'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('media_assets_kind_idx').on(table.kind),
    index('media_assets_status_idx').on(table.status),
    index('media_assets_created_idx').on(table.createdAt),
  ],
);

/**
 * Alternative text and captions are content, so they are translated. A missing
 * translation is visible in the dashboard as an incomplete record rather than
 * silently rendering an untranslated string into a screen reader.
 */
export const mediaTranslations = pgTable(
  'media_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    altText: text('alt_text'),
    caption: text('caption'),
    creditNote: text('credit_note'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('media_translations_media_locale_key').on(table.mediaId, table.locale)],
);
