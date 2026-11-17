# گزارش بازرسی محیط — GEMORIA

این فایل، گزارش خام و عینی از اجرای دستورها در سندباکس است. هر ادعای سند اصلی (`TECHNICAL-PLAN.fa.md`) به یکی از ردیف‌های این فایل قابل ارجاع است.

**تاریخ بررسی:** ۱۴۰۴/۰۸/۲۶ · **شاخه:** `arena/a46cab47-zibanit` · **کامیت پایه:** `ebd9c17`

---

## ۱. زیرساخت

| مورد | خروجی واقعی |
|---|---|
| CPU / RAM | ۲ هسته / ۳۹۳۷ مگابایت |
| دیسک | ۲۱ گیگابایت، ۹۰۳ مگابایت مصرف‌شده |
| Node | `v22.22.3` (V8 12.4.254.21-node.56) |
| npm | `10.9.8` |
| yarn | `1.22.22` |
| pnpm / bun / deno / go / rust / java | **نصب نیست** |
| Python | `3.11.2` |
| Git | `2.39.5` |
| GitHub CLI | احراز هویت‌شده (`milanorezaee2`) |
| Docker | **نصب نیست** |
| PostgreSQL / MySQL / Redis (سرویس) | **نصب نیست** |
| ffmpeg سیستمی | **نصب نیست** |
| sqlite3 CLI | **نصب نیست** (اما ماژول Node موجود است) |

---

## ۲. دسترسی شبکه (آزمون `curl`)

| مقصد | کد | نتیجه |
|---|---|---|
| `registry.npmjs.org/next` | ۲۰۰ | ✅ باز |
| `api.github.com` | ۲۰۰ | ✅ باز |
| `pypi.org/simple/` | ۲۰۰ | ✅ باز |
| `files.pythonhosted.org` | ۴۰۴ روی ریشه | ✅ قابل دسترس |
| `codeload.github.com/...tar.gz` | ۲۰۰ | ✅ باز |
| `github.com/.../releases/download/...` | ۳۰۲ → `objects.githubusercontent.com` | ⚠️ ریدایرکت به مقصد بسته |
| `objects.githubusercontent.com` | ۰۰۰ | ❌ بسته |
| `example.com` | ۰۰۰ | ❌ بسته |
| `images.unsplash.com` | ۰۰۰ | ❌ بسته |
| `cdn.playwright.dev` | ۰۰۰ | ❌ بسته |
| `playwright.azureedge.net` | ۰۰۰ | ❌ بسته |

**پیامدها:** فونت/تصویر/CDN بیرونی در زمان ساخت قابل اتکا نیست → همه‌چیز خودمیزبان. باینری GitHub Releases غیرقابل دریافت → `ffmpeg-static` شکست خورد. مرورگر Playwright غیرقابل دریافت → E2E مرورگری در این محیط ممکن نیست.

---

## ۳. آزمون‌های موفق

### ۳.۱ Next.js

```
next=16.4.6  react=19.3.1
▲ Next.js 16.4.6
✓ Compiled successfully
Running TypeScript ... Finished TypeScript in 9ms
✓ Generating static pages using 1 worker (3/3) in 196ms
```

خروجی `standalone` اجرا شد:

```
▲ Next.js 16.4.6
- Network: http://0.0.0.0:3111
✓ Ready in 0ms
```

- `GET /` → ۲۰۰ با `<html lang="fa" dir="rtl">`
- `GET /api/stones` (با `better-sqlite3`) → `{"ok":true,"rows":[{"id":1,"name":"زمرد"}]}`
- درخواست با `Host: 3111-<id>.e2b.app` → **۲۰۰** (سازگار با پروکسی پیش‌نمایش)
- نسخهٔ جایگزین `next@15.5.29` نیز بیلد شد ✅

### ۳.۲ PostgreSQL درون‌فرآیندی (PGlite)

```
PostgreSQL 18.6 (PGlite 0.5.16) on wasm32-unknown-emscripten
```

| آزمون | نتیجه |
|---|---|
| `create table`, `insert`, `select` | ✅ |
| `drizzle(PGlite)` و `db.execute(sql…)` | ✅ آرایهٔ ردیف‌ها با نام فارسی سالم |
| ستون تولیدشده: `tsv tsvector generated always as (to_tsvector('simple', …)) stored` | ✅ |
| `gen_random_uuid()` | ✅ |
| ماندگاری فایل‌محور پس از توقف و اجرای مجدد سرور | ✅ (ردیف‌های ۲ و ۳ باقی ماندند) |
| حجم پوشهٔ دادهٔ خالی | ~۳۹ مگابایت |

### ۳.۳ افزونه‌ها در PGlite

| افزونه | نتیجه |
|---|---|
| `pg_trgm` | ❌ `extension "pg_trgm" is not available` |
| `unaccent` | ❌ |
| `uuid-ossp` | ❌ |
| `pgcrypto` | ❌ |
| `citext` | ❌ |
| `btree_gin` | ❌ |
| `similarity()` و `gin_trgm_ops` | ❌ تعریف نشده |

→ **تصمیم معماری:** جستجو نباید به این افزونه‌ها وابسته باشد (بخش ۱۱ سند اصلی).

### ۳.۴ ORM

| آزمون | نتیجه |
|---|---|
| `drizzle-orm` + `better-sqlite3` → `db.all(sql\`select 1\`)` | ✅ `[ { one: 1 } ]` |
| `drizzle-kit generate` → `drizzle/0000_milky_gladiator.sql` | ✅ آفلاین |
| `prisma@latest` (نسخهٔ ۸) | ⚠️ نصب شد اما `prisma generate` حذف شده: «Prisma 8 has no client generation step» |
| `@prisma/prisma7` | ❌ ۴۰۴ در رجیستری |

### ۳.۵ SQLite (مسیر جایگزین)

| آزمون | نتیجه |
|---|---|
| `node:sqlite` بومی | ✅ (هشدار Experimental) |
| `better-sqlite3` | ✅ در Node و در بیلد Next با `serverExternalPackages` |
| FTS5 با `tokenize='unicode61'` | ✅ «زمرد» یافت شد |
| FTS5 با `tokenize='trigram'` | ✅ |

### ۳.۶ پردازش رسانه

```
sharp 0.35.5 / libvips 8.18.7
avif OK 332 bytes | webp OK 942 bytes | jpeg OK 3118 bytes | png OK 581 bytes
```

| آزمون ffmpeg (از بستهٔ npm `@ffmpeg-installer/ffmpeg`) | نتیجه |
|---|---|
| نسخه | `N-47683-g0e8eb07980-static` (۲۰۱۸) |
| کدگذاری H.264 → mp4 | ✅ ۱۰۸۸۸ بایت |
| استخراج poster از فریم | ✅ ۶۶۴۷ بایت |
| بسته‌بندی HLS | ❌ `Error initializing output stream` |
| `ffmpeg-static` (از GitHub Releases) | ❌ `UNABLE_TO_VERIFY_LEAF_SIGNATURE` |

### ۳.۷ احراز هویت و سه‌بعدی

| آزمون | نتیجه |
|---|---|
| `@node-rs/argon2` hash + verify | ✅ `verify: true` |
| `three` | ✅ 0.187.0 |
| `@gltf-transform/core` نوشتن و خواندن GLB | ✅ `magic=glTF`, `meshes=1` |
| `@react-three/fiber` 9.8.2، `drei` 10.7.9 | ✅ در رجیستری |

### ۳.۸ بسته‌های تأییدشده در رجیستری

`motion 14.14.0` · `tailwindcss 4.3.5` · `zod 4.6.7` · `next-intl 4.15.1` · `otpauth 9.6.0` · `@simplewebauthn/server 14.1.0` · `pg 8.23.1` · `maplibre-gl 6.18.0` · `@photo-sphere-viewer/core 5.15.1` · `blurhash 2.0.5` · `@fontsource/vazirmatn 5.3.0` · `@fontsource/playfair-display 5.3.0` · `@aws-sdk/client-s3 3.1170.0` · `playwright 1.65.1` (بسته هست، مرورگر نه)

---

## ۴. آزمون‌های ناموفق یا ناممکن

| آزمون | علت |
|---|---|
| `docker` / `docker compose` | نصب نیست |
| `psql` | نصب نیست |
| `redis-server` | نصب نیست |
| `ffmpeg` سیستمی | نصب نیست |
| دریافت Chromium برای Playwright | CDN بسته |
| دریافت باینری از GitHub Releases | مقصد ریدایرکت بسته |
| فراخوانی هر API بیرونی (ایمیل، S3، تحلیل) | بدون اعتبارنامه و بدون خروجی شبکه |

---

## ۵. نتیجه‌گیری بازرسی

۱. پشتهٔ **Next.js 16 + React 19 + TypeScript + Tailwind 4** در این محیط ساخته و اجرا می‌شود و پیش‌نمایش زنده می‌دهد. ✅
۲. پایگاه دادهٔ **PostgreSQL** بدون Docker، با PGlite، در همین محیط و با همان دیالکت تولید اجرا می‌شود. ✅
۳. **Drizzle ORM** تنها گزینهٔ ORM است که کاملاً در این محیط (آفلاین، بدون باینری) آزموده شد. ✅
۴. خط تولید **تصویر** کامل و محلی است. ✅ خط تولید **ویدیو** محدود است. ⚠️
۵. **جستجوی فارسی** باید در لایهٔ برنامه حل شود، نه با افزونه‌های Postgres. ✅ (طراحی شده)
۶. **تست E2E مرورگری، ایمیل، ذخیره‌سازی ابری و میزبانی تولید** بیرون از مرزهای این محیط‌اند و به شما وابسته‌اند. ⚠️
