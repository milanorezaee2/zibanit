/**
 * GEMORIA — platform-level key/value settings.
 *
 * Museum-wide configuration that staff may change without a deployment (contact
 * details, default OpenGraph image, feature flags). Anything structurally
 * important — roles, taxonomies, page content — gets its own table; this is
 * deliberately not a place to hide a schema.
 */
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './identity';

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull().$type<unknown>(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
