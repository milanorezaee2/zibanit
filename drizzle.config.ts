import { defineConfig } from 'drizzle-kit';

/**
 * GEMORIA — Drizzle Kit configuration.
 *
 * Migrations are always generated against the `postgresql` dialect, because that
 * is the only dialect the museum speaks. PGlite executes the very same SQL files
 * in development and preview; a real PostgreSQL server executes them in
 * production. `dbCredentials.url` is only consulted by commands that connect
 * (`push`, `studio`); `generate` works entirely offline, which is why this file
 * never requires a running database to produce a migration.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  strict: true,
  verbose: true,
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://gemoria:placeholder@127.0.0.1:5432/gemoria',
  },
});
