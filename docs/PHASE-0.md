# گزارش فاز ۰ — بنیاد و اسکلت

**تاریخ:** ۲۶ آبان ۱۴۰۴ (۲۰۲۶‑۱۱‑۱۷) · **شاخه:** `arena/a46cab47-zibanit` · **نسخه:** ۰٫۱٫۰
**وضعیت:** فاز ۰ کامل شد. فاز ۱ آغاز نشده است.

> این گزارش فقط چیزهایی را ادعا می‌کند که در همین محیط اجرا و خروجی‌شان ثبت شده است. هر عدد در بخش «شواهد» از یک اجرای واقعی آمده؛ هیچ آزمونی بدون اجرا «موفق» اعلام نشده است.

---

## ۱. چه چیزی تحویل داده شد

| حوزه | تحویل | جایگاه |
|---|---|---|
| ساختار | App Router با گروه‌بندی مسیر عمومی `(museum)` و بخش مستقل `admin` | `src/app/` |
| طراحی | توکن‌های برند (زمردی، اُبسیدیَن، طلای عتیقه، عاجی) در Tailwind 4 | `src/app/globals.css` |
| تایپوگرافی | سه نقش، شش فایل woff2 خودمیزبان (۲۷۲ KB)، بدون CDN | `src/fonts/`, `src/app/fonts.ts`, `src/config/fonts.ts` |
| RTL | `<html lang="fa" dir="rtl">`، منطق فاصله‌گذاری منطقی، اعداد فارسی | `src/app/layout.tsx` |
| کامپوننت | Header/Footer/MobileNav/SkipLink، Heading/Eyebrow/Prose/PullQuote/Wordmark، Button/Card/Badge/Field/Section/Stat/Container | `src/components/` |
| پایگاه داده | Drizzle + ۸ جدول + مایگریشن SQL تحت کنترل نسخه | `src/db/` |
| دو موتور | PGlite در توسعه، PostgreSQL در تولید، همان مایگریشن‌ها | `src/db/client.ts` |
| قرارداد محیط | زودپ + سه لایه اعمال + پیش‌پرواز | `src/lib/env.ts`, `scripts/preflight.mts` |
| سلامت | `/api/health` و داشبورد مدیریت از یک منبع | `src/lib/system-status.ts` |
| آزمون | ۶۰ آزمون (۵۹ موفق، ۱ مشروط) در ۶ فایل + مجموعهٔ دوسویه | `tests/` |
| ابزار | `db:migrate`, `db:doctor`, `db:server`, `test:postgres`, `verify` | `scripts/` |

**اعداد:** ۵۶ فایل TypeScript/TSX و مجموعاً ۴٬۴۳۲ خط (برنامه + آزمون + ابزار)؛ ۸۶ فایل در مخزن.

---

## ۲. معیارهای پذیرش — یک‌به‌یک

| # | معیار | نتیجه | شاهد |
|---|---|---|---|
| ۱ | ساخت تولید موفق | ✅ | `npm run build` → `✓ Compiled successfully`, مسیرها: `/` (ایستا)، `/_not-found`، `/admin` (پویا)، `/api/health` (پویا) |
| ۲ | سرور توسعه بالا می‌آید | ✅ | `npm run dev` → `✓ Ready in 461ms` روی پورت ۳۰۰۰ |
| ۳ | پوستهٔ عمومی رندر می‌شود | ✅ | `GET /` → ۲۰۰، ۵۷٬۵۵۰ بایت، هدر/فوتر/وردمارک/هشت فاز موجود در HTML |
| ۴ | پوستهٔ مدیریت رندر می‌شود | ✅ | `GET /admin` → ۲۰۰، ۵۲٬۴۵۵ بایت، داشبورد فارسی + آمار پایگاه داده |
| ۵ | RTL تأییدشده | ✅ | `<html lang="fa" dir="rtl">`؛ ۰ مورد `href="#"`؛ فاصله‌گذاری منطقی (`ps-`, `ms-`, `start/end`) |
| ۶ | تیترها با نسخ | ✅ | `.font-display` → `var(--font-gemoria-display)` + fallback؛ `font-family` تولیدشدهٔ `next/font` در CSS |
| ۷ | متن با وزیرمتن | ✅ | `.font-body` → `var(--font-gemoria-body)`؛ ۳ وزن سرو‌شده با نوع `font/woff2` |
| ۸ | مایگریشن روی PGlite | ✅ | `tests/database/pglite.test.ts` — ۱۵ آزمون موفق |
| ۹ | همان مایگریشن روی PostgreSQL واقعی | ✅ | `npm run test:postgres` — ۱۶ آزمون موفق روی **PostgreSQL 18.6 واقعی** |
| ۱۰ | تولید نمی‌تواند به PGlite بیفتد | ✅ | `npm start` بدون `DATABASE_URL` → خروج با کد **۱** و پیام صریح |
| ۱۱ | مستندسازی محیط | ✅ | `.env.example` + [`docs/DATABASE.md`](DATABASE.md) |
| ۱۲ | نقطهٔ پایانی سلامت کار می‌کند | ✅ | `GET /api/health` → ۲۰۰ `status: "ok"` در توسعه (PGlite) و تولید (PostgreSQL) |
| ۱۳ | هیچ رازی کامیت نشده | ✅ | `.env` و `.env.*` در `.gitignore`؛ `describeTarget()` گذرواژه را حذف می‌کند |
| ۱۴ | اسناد بازتاب تصمیم‌ها | ✅ | این سند + `DATABASE.md` + `FONTS.md` + دفتر تصمیم‌ها (D-01…D-05) |

### شواهد خام

```console
$ npx tsc --noEmit
(بدون خروجی — پاک)

$ npx vitest run
 Test Files  5 passed | 1 skipped (6)
      Tests  59 passed | 1 skipped (60)
   Duration  8.78s
  tests/health.test.ts        3
  tests/database/pglite.test.ts 15
  tests/fonts.test.ts        15
  tests/env.test.ts          17
  tests/config.test.ts        9
  tests/database/postgres.test.ts  (بدون TEST_DATABASE_URL رد می‌شود)

$ npm run test:postgres
▶ Booting a disposable PostgreSQL server for the parity suite
  starting PostgreSQL 18.6 …
      Tests  16 passed (16)
✓ Server stopped and data directory removed

$ npm run build
Route (app)                     Size
┌ ○ /                           …
├ ○ /_not-found
├ ƒ /admin
└ ƒ /api/health
  copied: .next/static → .next/standalone/.next/static
✓ Standalone artifact is complete.
```

سلامت در دو محیط:

```console
# توسعه (PGlite)
status ok · driver pglite · target pglite:.data/pglite · reachable true
schemaReady true · migrations 1/1 · persianTextSearch supported (UTF8, ctype C.UTF-8)

# تولید (PostgreSQL واقعی، بستهٔ standalone)
environment production · driver postgres · target postgres:127.0.0.1:54329/gemoria
reachable true (2 ms) · schemaReady true · migrations 1/1 · persianTextSearch supported
GET / 200 · GET /admin 200 · GET /does-not-exist 404 · woff2 → 200 font/woff2
```

هدرهای امنیتی روی پاسخ تولید: `X-Content-Type-Options: nosniff`، `X-Frame-Options: DENY`، `Referrer-Policy: strict-origin-when-cross-origin`، `Permissions-Policy: camera=(), …`، `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`؛ روی `/admin` علاوه بر آن `X-Robots-Tag: noindex, nofollow, noarchive` و `Cache-Control: no-store`.

---

## ۳. اسکیما و مایگریشن

یک فایل SQL: `src/db/migrations/0000_tidy_puppet_master.sql`، تولیدشده با `drizzle-kit generate` از `src/db/schema/`.

| جدول | نقش |
|---|---|
| `users` · `sessions` · `audit_log` | هویت مدیران و حسابرسی (بدون احراز هویت در فاز ۰) |
| `media_assets` · `media_translations` | دارایی تصویری + فرادادهٔ چندزبانه (جایگزین متن، ابعاد، فوکوس) |
| `specimens` · `specimen_translations` | نمونهٔ سنگ؛ نام/توضیح/داستان در جدول ترجمه |
| `app_settings` | تنظیمات زمان اجرا |

هفت enum: `locale(fa,en,ar)`، `user_role`، `user_status`، `publication_status`، `media_kind`، `media_status`.
جزئیات فنی که آزمون شده‌اند: کلید UUID با پیش‌فرض پایگاه داده، `timestamptz`، `weight_ct` از نوع `numeric(8,3)` با حفظ دقت (`'24.137'`)، یکتایی `(locale, slug)` و `(specimen_id, locale)`، حذف آبشاری، ستون تولیدشدهٔ `search_tsv` با ایندکس GIN، و توکن‌سازی فارسی در `to_tsvector('simple', …)`.

**تصمیم D-05 در همین مسیر کشف شد:** خوشهٔ PostgreSQL با `initdb` پیش‌فرض (`SQL_ASCII`/`C`) متن فارسی را بی‌صدا دور می‌ریزد — PGlite این را نشان نمی‌داد. حالا `/api/health`، `db:doctor` و هر دو مجموعهٔ آزمون این شرط را می‌سنجند. جزئیات: [`docs/DATABASE.md`](DATABASE.md) §۲.

---

## ۴. تایپوگرافی

| نقش | خانواده | وزن‌ها | متغیر |
|---|---|---|---|
| تیتر | Noto Naskh Arabic | ۴۰۰، ۷۰۰ | `--font-gemoria-display` |
| متن | Vazirmatn | ۴۰۰، ۵۰۰، ۷۰۰ | `--font-gemoria-body` |
| لاتین | Cormorant Garamond | ۶۰۰ | `--font-gemoria-latin` |

فایل‌ها در `src/fonts/` (۲۷۲ KB مجموع)، تنها در `src/app/fonts.ts` با `next/font/local` اعلام می‌شوند، و در `globals.css` به سه utility تبدیل می‌شوند. **هیچ کامپوننتی نام فونت را نمی‌داند** — برای تعویض فونت فقط سه فایل عوض می‌شود (نقشهٔ کامل در [`FONTS.md`](FONTS.md)).

پوشش گلیف با `fontkit` روی فایل‌های واقعی آزمون می‌شود: حروف فارسی، اعداد فارسی و عربی-هندی، علائم نگارشی `« » ( ) — / %`، لاتین در فونت متن، شکل‌گیری با و بدون نیم‌فاصله، و **نبود** پوشش عربی در کورمورانت (تا کسی سهواً فارسی در وردمارک نگذارد).

---

## ۵. ایرادهایی که در همین بازبینی پیدا و رفع شدند

بازبینی نهایی (رندر واقعی + خواندن CSS تولیدشده) پنج ایراد را آشکار کرد که هیچ‌یک در آزمون واحد دیده نمی‌شد:

| ایراد | چرا خطرناک بود | اصلاح |
|---|---|---|
| `mkdir '/…/.data/pglite'` با `ENOENT` | اولین اجرا در یک checkout تمیز شکست می‌خورد و `/api/health` → ۵۰۳ | ساخت والد با `fs.mkdirSync(recursive)` و مسیر مطلق در `src/db/client.ts` |
| `text-gold-gradient` + `text-ivory-100` روی یک عنصر | ترتیب CSS برنده را تعیین می‌کرد؛ تیتر طلایی در واقع عاجی رندر می‌شد | در `Heading` کلاس رنگ طلایی و عاجی را متقابلاً ناسازگار کرد |
| اعداد فارسی با `font-latin` | کورمورانت گلیف `۰–۹` ندارد؛ اعداد به فونت جانشین می‌افتادند | `font-display nums` |
| پیش‌پرواز با `NODE_ENV` خالی | قواعد تولید اعمال نمی‌شد و محافظ D-۰۵ دور زده می‌شد | سوئیچ `--production` در `scripts/preflight.mts` |
| `next start` + `output: 'standalone'` | Next هشدار می‌داد و `npm start` قابل اتکا نبود | `build` بستهٔ standalone را کامل می‌کند؛ `start` همان `server.js` را اجرا می‌کند |
| `migrations.available: 0` در مسیر خطا | گزارش نادرست هنگام خرابی پایگاه داده | شمارش واقعی فایل‌ها در `system-status.ts` |

---

## ۶. چیزهایی که *نیست*

* **احراز هویت پنل مدیریت پیاده نشده.** `/admin` بدون ورود باز است و فقط با `noindex` پنهان شده. این برای فاز ۰ پذیرفته است چون هیچ عملیات نوشتنی، هیچ داده‌ای و هیچ کاربری وجود ندارد؛ **پیش از هر دادهٔ واقعی باید در فاز ۱ بسته شود.**
* **هیچ محتوایی وجود ندارد.** نه نمونهٔ سنگ، نه تصویر، نه صفحهٔ جزئیات. داشبورد عمداً می‌گوید «موزه خالی است».
* **`next-intl` نصب نشده و مسیر `[locale]` وجود ندارد.** فاز ۰ فقط فارسی است؛ آماده‌سازی برای انگلیسی/عربی در سطح داده است (`locale` enum، `PLANNED_LOCALES`، JSONB/ترجمه‌های جدا). افزودن زبان دوم یک کار ساختاری در فاز بعد است — نه «فقط ترجمه».
* **آزمون سرتاسری مرورگر (Playwright) اجرا نشده.** دانلود مرورگر در این محیط مسدود است. تأیید رندر با `curl` + بازرسی HTML/CSS انجام شد، نه با اسکرین‌شات.
* **بدون pipeline تصویر.** آپلود، تبدیل، نسخه‌های چندگانه و `srcset` فاز ۳ است.
* **بدون انتخاب میزبان.** طبق D-02، فاز ۶.
* **`embedded-postgres` نسخهٔ بتا (۱۸٫۶٫۰‑beta.19) است** و فقط dependency توسعه است؛ در تولید استفاده نمی‌شود.
* **PGlite تک‌اتصال است** و افزونه‌های `pg_trgm`/`unaccent` را ندارد؛ جست‌وجو با `tsvector` + GIN و نرمال‌سازی در لایهٔ برنامه انجام می‌شود.

---

## ۷. فرمان‌های دقیق اجرا

```bash
# نصب و اجرا (بدون هیچ پایگاه دادهٔ جداگانه)
npm install
npm run dev                        # http://localhost:3000

# اعتبارسنجی کامل
npm run verify                     # typecheck + test + build

# پایگاه دادهٔ واقعی (بدون Docker، بدون psql)
npm run db:server                  # پنجرهٔ ۱ — PostgreSQL 18 با UTF-8 روی 54329
DATABASE_URL="postgres://gemoria:gemoria_local_dev_only@127.0.0.1:54329/gemoria" npm run db:migrate
DATABASE_URL="postgres://gemoria:gemoria_local_dev_only@127.0.0.1:54329/gemoria" npm run db:doctor
npm run test:postgres              # مجموعهٔ دوسویه؛ سرور را خودش بالا/پایین می‌آورد

# اجرای تولید
npm run build
DATABASE_URL="postgres://…" npm start          # پیش‌پرواز + بستهٔ standalone

# بررسی محافظ تولید (باید با کد ۱ شکست بخورد)
npm start                                       # بدون DATABASE_URL
```

## ۸. گام بعدی (فاز ۱ — پیشنهادی، بدون شروع)

۱. احراز هویت مدیریت (Argon2id + جلسه + TOTP) و بستن `/admin`.
۲. جریان واقعی محتوا: آپلود تصویر → پردازش → ثبت نمونه → ترجمه → انتشار.
۳. ۱۲ تا ۲۰ نمونهٔ نمایشی (D-04) از همان مسیر واقعی، نه از seed سخت‌کدشده در UI.
۴. صفحهٔ عمومی مجموعه + صفحهٔ جزئیات نمونه، هر دو خواننده از پایگاه داده.
۵. تصمیم دربارهٔ `next-intl` و ساختار `[locale]` پیش از آنکه محتوای دوزبانه زیاد شود.

---

**شاخه:** `arena/a46cab47-zibanit` · **کامیت این گزارش:** `git log -1 --format='%h' -- docs/PHASE-0.md`
