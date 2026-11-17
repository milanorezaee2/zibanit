import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Tests run against the real thing: real WOFF2 binaries, a real PostgreSQL
 * dialect, and — when a server is available — a real PostgreSQL instance.
 * Nothing is mocked at the database boundary, because a mocked migration proves
 * only that the mock works.
 *
 * `pool: 'forks'` keeps each test file in its own process: PGlite is a WebAssembly
 * PostgreSQL instance with per-process state, and the parity suite must not share
 * it with anything else.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
