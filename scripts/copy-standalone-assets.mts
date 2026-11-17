/**
 * GEMORIA — complete the standalone build artifact.
 *
 * `next build` with `output: 'standalone'` emits a minimal server bundle but
 * deliberately leaves `public/` and `.next/static/` outside it. Container images
 * and any `node .next/standalone/server.js` deployment must copy them in, or the
 * museum would serve unstyled pages with no fonts and no images.
 *
 * Running this as part of `npm run build` means the artifact in `.next/standalone`
 * is complete and can be copied into a scratch container as-is — which is exactly
 * the vendor-neutral deployment Phase 6 needs.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standalone)) {
  console.error('✗ .next/standalone not found — run `next build` with output: "standalone".');
  process.exit(1);
}

const copies: Array<[string, string]> = [
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
  [path.join(root, 'public'), path.join(standalone, 'public')],
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) {
    console.log(`  skipped (absent): ${path.relative(root, from)}`);
    continue;
  }
  fs.cpSync(from, to, { recursive: true });
  console.log(`  copied: ${path.relative(root, from)} → ${path.relative(root, to)}`);
}

console.log('✓ Standalone artifact is complete.');
