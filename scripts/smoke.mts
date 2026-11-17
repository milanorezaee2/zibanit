/**
 * GEMORIA — runtime smoke check (no browser required).
 *
 *   npm run smoke                              # against http://127.0.0.1:3000
 *   SMOKE_BASE_URL=http://127.0.0.1:3200 npm run smoke
 *
 * Why this exists
 * ---------------
 * The sandbox this project is developed in has no browser engine and cannot
 * download one (the Playwright browser CDN is unreachable; only the npm registry
 * is open), so there is no screenshot-based end-to-end test. Rather than leave
 * "does it actually render?" unverified, this script drives a *running server*
 * exactly as a browser would and asserts the properties a screenshot would have
 * shown us — plus a few a screenshot cannot:
 *
 *   • the document is Persian and RTL, with the skip link and landmarks intact
 *   • the compiled stylesheet really declares the three font roles and the brand
 *     tokens (not just the source file we hoped was compiled)
 *   • every @font-face URL the browser is told to fetch is actually served, with
 *     the right MIME type, and the byte count matches the file in the repository
 *   • the exact characters that appear on the page have glyphs in the face that
 *     will be asked to draw them — i.e. no character silently falls back
 *   • the wordmark face stays Latin-only, and Persian numerals are never set in it
 *   • /admin is noindex, the 404 is Persian, /api/health reports a usable database
 *
 * It uses only Node built-ins plus `fontkit`, which the test suite already
 * depends on. No new dependency, no new infrastructure.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as fontkit from 'fontkit';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';
const FONT_DIR = path.resolve(process.cwd(), 'src', 'fonts');

const results: Array<{ ok: boolean; name: string; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string): void {
  results.push({ ok, name, ...(detail ? { detail } : {}) });
}

function checkEqual<T>(name: string, actual: T, expected: T): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  check(name, ok, ok ? undefined : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

interface Response_ {
  status: number;
  headers: Headers;
  body: string;
}

async function get(pathname: string): Promise<Response_> {
  const response = await fetch(BASE + pathname, { redirect: 'manual' });
  const type = response.headers.get('content-type') ?? '';
  const body = type.includes('text') || type.includes('json') || type.includes('css')
    ? await response.text()
    : '';
  return { status: response.status, headers: response.headers, body };
}

/** Crude but sufficient: our markup has no `<script>` string literals with tags. */
function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/u;
const PERSIAN_DIGITS = /[۰-۹]/u;

function arabicCharacters(text: string): string[] {
  return [...new Set([...text].filter((char) => ARABIC_SCRIPT.test(char)))].sort();
}

function loadFace(file: string) {
  return fontkit.create(fs.readFileSync(path.join(FONT_DIR, file)));
}

function missingGlyphs(face: ReturnType<typeof loadFace>, text: string): string[] {
  return [...new Set([...text])].filter(
    (char) => char.trim() !== '' && !face.hasGlyphForCodePoint(char.codePointAt(0)!),
  );
}

async function main(): Promise<void> {
  console.log(`▶ GEMORIA smoke check against ${BASE}\n`);

  // ── 1. Public home ────────────────────────────────────────────────────────
  const home = await get('/');
  checkEqual('GET / → 200', home.status, 200);

  const htmlTag = /<html[^>]*>/i.exec(home.body)?.[0] ?? '';
  check('home declares lang="fa"', /lang="fa"/.test(htmlTag), htmlTag);
  check('home declares dir="rtl"', /dir="rtl"/.test(htmlTag), htmlTag);
  checkEqual('home has exactly one <h1>', (home.body.match(/<h1[\s>]/g) ?? []).length, 1);
  check('home has a skip link to #main', /<a[^>]+href="#main"/.test(home.body));
  check('home has the <main id="main"> landmark', /<main[^>]+id="main"/.test(home.body));
  check('home has no dead links (href="#")', !/href="#"/.test(home.body));
  check('home has no image without alt text',
    [...(home.body.match(/<img[^>]*>/g) ?? [])].every((tag) => /alt=/.test(tag)));

  const homeText = textOf(home.body);
  check('home renders Persian numerals', PERSIAN_DIGITS.test(homeText), [...homeText].filter((c) => PERSIAN_DIGITS.test(c)).slice(0, 6).join(''));
  check('home renders the Latin wordmark', /GEMORIA/i.test(homeText));

  // ── 2. Mixed-direction safety ─────────────────────────────────────────────
  // Persian numerals must never be set in the Latin wordmark face: Cormorant has
  // no Persian digits, so they would fall back and look wrong. This is the exact
  // defect a screenshot review caught earlier; here it is asserted forever.
  const latinSpans = [...home.body.matchAll(/<span[^>]*class="[^"]*font-latin[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]
    .map((match) => textOf(match[1] ?? ''));
  checkEqual('font-latin is used only for Latin text', latinSpans.filter((text) => ARABIC_SCRIPT.test(text)), []);
  check('Latin runs are isolated for bidi',
    /dir="ltr"|class="[^"]*\bbidi-\w+/.test(home.body) || /class="[^"]*text-latin/.test(home.body));

  // ── 3. Admin + 404 ────────────────────────────────────────────────────────
  const admin = await get('/admin');
  checkEqual('GET /admin → 200', admin.status, 200);
  check('admin is noindex',
    /noindex/i.test(admin.headers.get('x-robots-tag') ?? '') || /noindex/i.test(admin.body));
  const adminText = textOf(admin.body);
  check('admin renders Persian', ARABIC_SCRIPT.test(adminText));

  const missing = await get('/this-page-does-not-exist');
  checkEqual('GET /this-page-does-not-exist → 404', missing.status, 404);
  check('404 page is Persian', ARABIC_SCRIPT.test(textOf(missing.body)));

  // ── 4. Health ─────────────────────────────────────────────────────────────
  const health = await get('/api/health');
  checkEqual('GET /api/health → 200', health.status, 200);
  const payload = JSON.parse(health.body) as {
    status: string;
    database: { reachable: boolean; migrations: { upToDate: boolean } };
    capabilities: { persianTextSearch: { supported: boolean } };
  };
  checkEqual('health status is ok', payload.status, 'ok');
  check('database is reachable', payload.database.reachable);
  check('migrations are up to date', payload.database.migrations.upToDate);
  check('Persian text search is supported by the cluster', payload.capabilities.persianTextSearch.supported);

  // ── 5. Stylesheet: tokens, roles, and every font the browser will fetch ───
  const hrefs = [...home.body.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
    .map((match) => match[1]!);
  check('home links at least one stylesheet', hrefs.length > 0, hrefs.join(', '));

  let css = '';
  for (const href of hrefs) {
    const sheet = await get(href);
    checkEqual(`stylesheet ${href} → 200`, sheet.status, 200);
    css += sheet.body;
  }

  for (const token of ['--color-emerald', '--color-obsidian', '--color-gold', '--color-ivory']) {
    check(`design token ${token} is compiled`, css.includes(token));
  }
  for (const utility of ['.font-display', '.font-body', '.font-latin']) {
    check(`utility ${utility} is compiled`, new RegExp(`${utility.replace('.', '\\.')}\\s*\\{`).test(css));
  }
  for (const variable of ['--font-gemoria-display', '--font-gemoria-body', '--font-gemoria-latin']) {
    check(`font variable ${variable} reaches the browser`, css.includes(variable));
  }

  const fontUrls = [...new Set([...css.matchAll(/url\(["']?(\.\.\/media\/[^"')]+\.woff2)["']?\)/g)]
    .map((match) => '/_next/static/media/' + match[1]!.replace('../media/', '')))];
  checkEqual('six webfont files are referenced', fontUrls.length, 6);

  const shippedBytes = fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.woff2'))
    .map((f) => fs.statSync(path.join(FONT_DIR, f)).size).sort((a, b) => a - b);

  let servedBytes: number[] = [];
  for (const url of fontUrls) {
    const font = await get(url);
    check(`font ${path.basename(url)} → 200`, font.status === 200, `status ${font.status}`);
    check(`font ${path.basename(url)} served as font/woff2`,
      /font\/woff2/.test(font.headers.get('content-type') ?? ''),
      font.headers.get('content-type') ?? '');
  }
  // Byte counts must match the files committed in the repository.
  for (const url of fontUrls) {
    const response = await fetch(BASE + url);
    servedBytes.push((await response.arrayBuffer()).byteLength);
  }
  checkEqual('served font bytes match the repository files',
    servedBytes.sort((a, b) => a - b), shippedBytes);

  // ── 6. Glyph coverage for the characters actually on the page ─────────────
  const naskh = loadFace('noto-naskh-arabic-400.woff2');
  const vazir = loadFace('vazirmatn-arabic-latin-400.woff2');
  const cormorant = loadFace('cormorant-garamond-600.woff2');

  const pageText = homeText + ' ' + adminText;
  const persianChars = arabicCharacters(pageText).join('');
  check(`Persian characters on the page (${persianChars.length}) all exist in the heading face`,
    missingGlyphs(naskh, persianChars).length === 0,
    missingGlyphs(naskh, persianChars).join(' '));
  check(`Persian characters on the page (${persianChars.length}) all exist in the body face`,
    missingGlyphs(vazir, persianChars).length === 0,
    missingGlyphs(vazir, persianChars).join(' '));

  check('body face renders Latin letters and digits (mixed run)',
    missingGlyphs(vazir, 'GEMORIA 2026 Mohs 7.5').length === 0,
    missingGlyphs(vazir, 'GEMORIA 2026 Mohs 7.5').join(' '));
  check('wordmark face renders GEMORIA',
    missingGlyphs(cormorant, 'GEMORIA').length === 0,
    missingGlyphs(cormorant, 'GEMORIA').join(' '));
  // ۰۱۲۳۴۵۶۷۸۹ is ten characters, not nine — assert against the string's own
  // length so the guard cannot drift if a digit is ever added to the sample.
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  check('wordmark face deliberately lacks Persian digits (guards font-latin misuse)',
    missingGlyphs(cormorant, persianDigits).length === [...persianDigits].length,
    `${missingGlyphs(cormorant, persianDigits).length} of ${[...persianDigits].length} digits absent`);

  // ── Report ────────────────────────────────────────────────────────────────
  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    const mark = result.ok ? '✓' : '✗';
    console.log(`${mark} ${result.name}${result.detail ? `  — ${result.detail}` : ''}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    console.error(`\n✗ ${failed.length} check(s) failed against ${BASE}.`);
    process.exit(1);
  }
  console.log('✓ Smoke check passed.');
}

await main();
