/**
 * GEMORIA — identity, sessions and the audit trail.
 *
 * Phase 0 establishes the tables and their invariants. Authentication flows,
 * session issuing, role checks and the audit writer arrive in Phase 1 — but the
 * shape they will write into is fixed now, so that Phase 1 adds behaviour
 * instead of migrations.
 */
import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { localeEnum, userRoleEnum, userStatusEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stored lower-cased by the service layer; unique regardless. */
    email: text('email').notNull().unique(),
    /** Argon2id hash. Null while an invitation is pending. */
    passwordHash: text('password_hash'),
    displayName: text('display_name').notNull(),
    role: userRoleEnum('role').notNull().default('viewer'),
    status: userStatusEnum('status').notNull().default('invited'),
    preferredLocale: localeEnum('preferred_locale').notNull().default('fa'),
    totpSecret: text('totp_secret'),
    totpEnabled: boolean('totp_enabled').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_status_idx').on(table.status), index('users_role_idx').on(table.role)],
);

/**
 * Opaque server-side sessions. Only the SHA-256 of the token is stored, so a
 * database leak cannot be replayed as a valid cookie.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('sessions_user_idx').on(table.userId),
    index('sessions_expires_idx').on(table.expiresAt),
  ],
);

/**
 * Append-only record of every state change made through the administration
 * dashboard. A museum that catalogues objects needs to answer "who changed this,
 * and when" — this table is that answer, not a debugging nicety.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    before: jsonb('before').$type<Record<string, unknown> | null>(),
    after: jsonb('after').$type<Record<string, unknown> | null>(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_created_idx').on(sql`${table.createdAt} DESC`),
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_actor_idx').on(table.actorId),
  ],
);
