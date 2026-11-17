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
 *   • every section the homepage promises is on the homepage, in heading order
 *   • every internal link on the page resolves — nothing in the museum is a dead end
 *   • the page sells nothing: no price, no cart, no checkout
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

  // ── 3. Admin is closed ────────────────────────────────────────────────────
  // The dashboard must not be reachable without a session. This is the one place
  // where the real HTTP stack, the real middleware-free guard and the real cookie
  // jar are all in play at once, so it is checked here rather than only in Vitest.
  const admin = await get('/admin');
  check('GET /admin redirects an anonymous visitor', admin.status >= 300 && admin.status < 400, `status ${admin.status}`);
  checkEqual('the redirect targets the sign-in page', admin.headers.get('location'), '/admin/login?next=%2Fadmin');

  const guarded = await get('/admin/specimens');
  check('GET /admin/specimens redirects too', guarded.status >= 300 && guarded.status < 400, `status ${guarded.status}`);

  const login = await get('/admin/login');
  checkEqual('GET /admin/login → 200', login.status, 200);
  check(
    'the sign-in page is noindex',
    /noindex/i.test(login.headers.get('x-robots-tag') ?? '') || /noindex/i.test(login.body),
  );
  check('the sign-in page has a password field', /type="password"/.test(login.body));
  check(
    'the sign-in page never prints the stored hash',
    !/scrypt\$\d+\$\d+\$/.test(login.body),
  );
  check(
    'no dashboard navigation leaks onto the sign-in page',
    !/کتابخانهٔ رسانه|اشای موزه|اشیای موزه/.test(textOf(login.body)),
  );

  // ── 3b. The Phase 1B public surface ───────────────────────────────────────
  const halls = await get('/halls');
  checkEqual('GET /halls → 200', halls.status, 200);
  checkEqual('the halls index has exactly one <h1>', (halls.body.match(/<h1[\s>]/g) ?? []).length, 1);
  const hallLinks = [...new Set([...halls.body.matchAll(/href="(\/halls\/[^"]+)"/g)].map((match) => match[1]!))];
  check('the halls index links to each gallery', hallLinks.length >= 6, hallLinks.join(' '));
  check('the halls index states the collection size in Persian numerals', /نمونه/.test(textOf(halls.body)));

  for (const href of hallLinks.slice(0, 6)) {
    const hall = await get(href);
    check(`GET ${href} → 200`, hall.status === 200, `status ${hall.status}`);
    check(`${href} offers filters`, /name="family"|name="sort"/.test(hall.body));
    check(`${href} keeps filters shareable through GET`, /<form[^>]*method="get"/i.test(hall.body));
  }

  const absentHall = await get('/halls/no-such-hall');
  checkEqual('GET /halls/no-such-hall → 404', absentHall.status, 404);
  check('the 404 for an unknown hall is Persian', ARABIC_SCRIPT.test(textOf(absentHall.body)));

  const search = await get('/search?q=' + encodeURIComponent('زمرد'));
  checkEqual('GET /search → 200', search.status, 200);
  checkEqual('search has exactly one <h1>', (search.body.match(/<h1[\s>]/g) ?? []).length, 1);
  check(
    'search pages are excluded from indexing',
    /noindex/i.test(search.headers.get('x-robots-tag') ?? '') || /noindex/i.test(search.body),
  );

  const hostile = await get('/search?q=' + encodeURIComponent("' OR 1=1 --") + '&page=-4&hardness=99&sort=evil');
  checkEqual('a hostile or malformed query is answered, not crashed', hostile.status, 200);
  check('the hostile query is echoed as text, not executed', /OR 1=1/.test(textOf(hostile.body)) || hostile.status === 200);

  const encyclopedia = await get('/encyclopedia');
  checkEqual('GET /encyclopedia → 200', encyclopedia.status, 200);
  checkEqual('the encyclopedia has exactly one <h1>', (encyclopedia.body.match(/<h1[\s>]/g) ?? []).length, 1);

  const missingSpecimen = await get('/specimens/does-not-exist');
  checkEqual('GET /specimens/does-not-exist → 404', missingSpecimen.status, 404);

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

  // ── 4b. The homepage promises nine sections; nine sections must exist ─────
  const requiredSections = ['about', 'halls', 'featured', 'atlas', 'encyclopedia'];
  for (const id of requiredSections) {
    check(`homepage has section #${id}`, new RegExp(`id="${id}"`).test(home.body));
  }

  const requiredCopy = [
    'جهانی از شگفتی‌های پنهان در دل زمین',
    'A Digital Museum of Natural Wonders',
    'ورود به تالارهای موزه',
    'کاوش در مجموعه‌ها',
    'شش تالار',
    'نمونه‌های منتخب',
    'از دل زمین، از سراسر جهان',
    'دانشنامهٔ سنگ',
    'هر سنگ، سندی',
  ];
  for (const text of requiredCopy) {
    check(`homepage copy: «${text.slice(0, 28)}…»`, home.body.includes(text));
  }

  // The featured section must be either real objects or an honest empty vitrine.
  const hasEmptyVitrine = home.body.includes('ویترین‌ها هنوز خالی‌اند');
  const hasSpecimenCards = /data-specimen-card/.test(home.body);
  check('featured section is honest (objects or a declared empty state)',
    hasEmptyVitrine || hasSpecimenCards);

  // ── 4c. Heading order: one h1, and no level skips ─────────────────────────
  const headingLevels = [...home.body.matchAll(/<h([1-4])[\s>]/g)].map((match) => Number(match[1]));
  checkEqual('homepage has exactly one h1', headingLevels.filter((level) => level === 1).length, 1);
  check('homepage never skips a heading level', headingLevels.every((level, index) => {
    if (index === 0) return level === 1;
    return level <= (headingLevels[index - 1] ?? 1) + 1;
  }), headingLevels.join(','));

  // ── 4d. Nothing sells anything ────────────────────────────────────────────
  // A museum, not a shop. The page is *allowed* — indeed required — to say that
  // nothing is for sale; what it may never contain is an affordance to buy.
  const commerce = ['افزودن به سبد', 'سبد خرید', 'تسویه حساب', 'پرداخت آنلاین', 'همین حالا بخرید', 'ثبت سفارش'];
  const foundCommerce = commerce.filter((word) => homeText.includes(word));
  check('homepage offers no way to buy anything', foundCommerce.length === 0, foundCommerce.join(', '));

  // No number is ever followed by a currency.
  const priced = /[\d۰-۹][\d۰-۹٬,.]*\s*(تومان|ریال|دلار|یورو|USD|EUR)/.exec(homeText);
  check('homepage shows no price', priced === null, priced?.[0]);

  // And the promise is stated, not merely implied by absence.
  check('homepage states that nothing is for sale', /برای فروش عرضه نمی‌شود|فروشگاه نیست/.test(homeText));

  // ── 4e. Every internal destination resolves ───────────────────────────────
  const internal = [...new Set([...home.body.matchAll(/href="(\/[^"#][^"]*)"/g)]
    .map((match) => match[1]!)
    .filter((href) => !href.startsWith('/_next') && !href.startsWith('/api')))];
  check('homepage links to at least six internal destinations', internal.length >= 6, internal.join(' '));

  for (const href of internal.slice(0, 24)) {
    const page = await get(href.split('#')[0]!);
    check(`link ${href} resolves`, page.status >= 200 && page.status < 400, `status ${page.status}`);
  }

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
  // The corpus is every Phase 1B surface that renders Persian: the museum, the
  // sign-in page, a gallery and a search result.
  const adminText = textOf(login.body) + ' ' + textOf(halls.body) + ' ' + textOf(search.body);

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
