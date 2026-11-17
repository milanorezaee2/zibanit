/**
 * GEMORIA — image build step.
 *
 *   npm run images:build
 *
 * The museum ships no third-party photography: there is no licensed image service
 * in this environment and a watermarked stock image would be both a legal problem
 * and an aesthetic one. Every photograph in `public/images/` is therefore a
 * locally generated, clearly replaceable placeholder.
 *
 * This script turns the large PNG masters in `public/images/source/` into the
 * single WebP that ships, and writes a typed manifest with the intrinsic size and
 * a base64 blur placeholder. The manifest is what components import, so:
 *
 *   • next/image always has width/height — no layout shift (CLS = 0 by construction)
 *   • every image has a blur placeholder, so nothing pops in from nothing
 *   • replacing a photograph is a build step, not a hunt through components
 *
 * The PNG masters are git-ignored (19 MB of source is not repository material);
 * the WebP files and the manifest are committed, so a clone needs no image tooling.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'public', 'images', 'source');
const OUT_DIR = path.join(ROOT, 'public', 'images');
const MANIFEST = path.join(ROOT, 'src', 'content', 'media.generated.ts');

/** Longest edge of the shipped file. next/image derives every other size from it. */
const MAX_EDGE = 1800;
const QUALITY = 82;
/** 20px wide, heavily blurred — enough to suggest the composition while loading. */
const BLUR_WIDTH = 20;

interface Entry {
  key: string;
  file: string;
  width: number;
  height: number;
  blurDataURL: string;
  bytes: number;
}

function keyFor(filename: string): string {
  return filename
    .replace(/\.png$/i, '')
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

async function main(): Promise<void> {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`✗ no source images at ${path.relative(ROOT, SOURCE_DIR)}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sources = fs.readdirSync(SOURCE_DIR).filter((file) => file.toLowerCase().endsWith('.png')).sort();
  const entries: Entry[] = [];

  for (const file of sources) {
    const inputPath = path.join(SOURCE_DIR, file);
    const key = keyFor(file);
    const outputPath = path.join(OUT_DIR, `${key}.webp`);

    const pipeline = sharp(inputPath).rotate();
    const meta = await pipeline.metadata();
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
    const resized = longest > MAX_EDGE ? pipeline.resize({ width: meta.width! >= meta.height! ? MAX_EDGE : undefined, height: meta.height! > meta.width! ? MAX_EDGE : undefined, fit: 'inside', withoutEnlargement: true }) : pipeline;

    const info = await resized.clone().webp({ quality: QUALITY, effort: 5 }).toFile(outputPath);
    const blur = await resized
      .clone()
      .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();

    entries.push({
      key,
      file: `/images/${key}.webp`,
      width: info.width,
      height: info.height,
      blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
      bytes: info.size,
    });

    console.log(`✓ ${key.padEnd(22)} ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }

  const total = entries.reduce((sum, entry) => sum + entry.bytes, 0);

  const body = entries
    .map(
      (entry) => `  ${entry.key}: {
    src: '${entry.file}',
    width: ${entry.width},
    height: ${entry.height},
    blurDataURL: '${entry.blurDataURL}',
  },`,
    )
    .join('\n');

  const manifest = `/**
 * GEMORIA — generated image manifest. DO NOT EDIT BY HAND.
 *
 * Produced by \`npm run images:build\` from \`public/images/source/\`.
 * Every entry carries its intrinsic size and a blur placeholder so that
 * <ResponsiveImage> can reserve space before the photograph arrives.
 *
 * These are locally generated placeholders standing in for real museum
 * photography; see docs/IMAGES.md. Replacing one is a rebuild, never a code change.
 */

export interface MediaEntry {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly blurDataURL: string;
}

export const media = {
${body}
} as const satisfies Record<string, MediaEntry>;

export type MediaKey = keyof typeof media;
`;

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, manifest, 'utf8');

  console.log(`\n${entries.length} images · ${(total / 1024 / 1024).toFixed(2)} MB total`);
  console.log(`✓ manifest: ${path.relative(ROOT, MANIFEST)}`);
}

await main();
