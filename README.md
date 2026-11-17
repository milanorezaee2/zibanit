# گموریا — موزهٔ دیجیتال سنگ‌های قیمتی

**GEMORIA** · موزهٔ دیجیتال سنگ‌های قیمتی، کانی‌ها و نمونه‌های زمین‌شناسی.
پروژهٔ لوکس و بین‌المللی، **بدون هیچ قابلیت خرید**. فاز نخست کاملاً فارسی و راست‌به‌چپ.

> **وضعیت: پایان فاز ۰ — بنیاد و اسکلت.** اسکلت برنامه، اسکیمای پایگاه داده، سامانهٔ تایپوگرافی و پوستهٔ عمومی و مدیریتی ساخته و آزموده شده‌اند. موزه هنوز مجموعه‌ای ندارد: هیچ نمونه‌ای در پایگاه داده نیست و صفحهٔ اصلی عمداً فقط چارچوب را نشان می‌دهد. گزارش کامل: [`docs/PHASE-0.md`](docs/PHASE-0.md).

---

## شروع سریع

نیازمندی: **Node.js ≥ ۲۲٫۹** (آزموده‌شده روی ۲۲٫۲۲٫۳). هیچ پایگاه دادهٔ جداگانه‌ای برای توسعه لازم نیست.

```bash
npm install
npm run dev            # http://localhost:3000
```

در اولین اجرا، PGlite در `.data/pglite` ساخته می‌شود و همهٔ مایگریشن‌ها اعمال می‌شوند. سپس:

| نشانی | چیست |
|---|---|
| `/` | صفحهٔ عمومی موزه |
| `/admin` | داشبورد مدیریت (بدون احراز هویت در فاز ۰ — فقط برای توسعه) |
| `/api/health` | وضعیت محیط، پایگاه داده، مایگریشن‌ها و قابلیت جست‌وجوی فارسی |

```bash
curl -s localhost:3000/api/health | jq
```

## فرمان‌ها

| فرمان | کار |
|---|---|
| `npm run dev` | سرور توسعه (PGlite) |
| `npm run build` | ساخت تولید + تکمیل بستهٔ `standalone` |
| `npm start` | اجرای تولید از بستهٔ standalone، پیش از اجرا اعتبارسنجی محیط |
| `npm run start:next` | اجرای تولید با `next start` (برای مقایسه/اشکال‌زدایی) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | آزمون‌ها روی PGlite |
| `npm run test:postgres` | همان آزمون‌ها روی **PostgreSQL واقعی** (خودکار بالا/پایین می‌آید) |
| `npm run verify` | typecheck + test + build |
| `npm run db:generate` | تولید SQL از تغییرات اسکیما |
| `npm run db:migrate` | اعمال مایگریشن‌ها روی موتور فعال |
| `npm run db:doctor` | بازرسی سلامت پایگاه داده (encoding، مایگریشن، جست‌وجوی فارسی) |
| `npm run db:server` | بالا آوردن یک PostgreSQL ۱۸ محلی با UTF-8 (development dependency) |

## پشته

- **Next.js 16** (App Router) + **React 19** + **TypeScript** سخت‌گیر
- **Drizzle ORM** + مایگریشن‌های SQL تحت کنترل نسخه
- **PGlite** در توسعه و پیش‌نمایش، **PostgreSQL واقعی** در تولید — یک اسکیما، یک دیالکت، یک مجموعه مایگریشن
- **Tailwind CSS 4** با توکن‌های برند: زمردی تیره، مشکی اُبسیدیَن، طلای عتیقه، عاجی
- فونت‌های **خودمیزبان**: Noto Naskh Arabic (تیتر)، Vazirmatn (متن)، Cormorant Garamond (وردمارک)
- بدون هیچ وابستگی به CDN یا سرویس بیرونی در زمان اجرا

## ساختار

```
src/
  app/
    (museum)/          ← رابط عمومی: صفحهٔ اصلی، پوسته (header/footer)
    admin/             ← پنل مدیریت، کاملاً جدا از موزه
    api/health/        ← نقطهٔ پایانی سلامت
    fonts.ts           ← تنها جای next/font/local
    globals.css        ← توکن‌های طراحی و لایهٔ پایه
  components/
    layout/            ← header، footer، ناوبری موبایل، پوستهٔ مدیریت
    typography/        ← Heading، Eyebrow، Prose، PullQuote، Wordmark
    ui/                ← Button، Card، Badge، Field، Section، Stat…
  config/              ← site، app، navigation، fonts (بدون هیچ متن سخت‌کدشدهٔ سنگ)
  db/
    schema/            ← منبع حقیقت اسکیما
    migrations/        ← SQL تحت کنترل نسخه
    client.ts migrate.ts capabilities.ts
  fonts/               ← ۶ فایل woff2 خودمیزبان
  lib/                 ← env (قرارداد محیط)، system-status، cn
scripts/               ← preflight، db:migrate، db:doctor، db:server، with-postgres، copy-standalone-assets
tests/                 ← env، fonts، config، health، database (PGlite + PostgreSQL)
docs/                  ← اسناد و گزارش‌ها
```

## اسناد

| سند | چیست |
|---|---|
| [`docs/PHASE-0.md`](docs/PHASE-0.md) | گزارش اجرایی فاز ۰: چه ساخته شد، چه آزموده شد، چه چیزی کم است |
| [`docs/DATABASE.md`](docs/DATABASE.md) | قرارداد پایگاه داده: دو محیط، مایگریشن‌ها، الزام UTF-8 (D-05) |
| [`docs/FONTS.md`](docs/FONTS.md) | منبع، مجوز و نحوهٔ تعویض فونت‌ها |
| [`docs/TECHNICAL-PLAN.fa.md`](docs/TECHNICAL-PLAN.fa.md) · [نسخهٔ HTML](docs/plan.html) | سند فنی و معماری + دفتر تصمیم‌ها |
| [`docs/environment-report.md`](docs/environment-report.md) · [HTML](docs/environment.html) | گزارش بازرسی محیط توسعه |
| [`docs/type-specimen.html`](docs/type-specimen.html) | مطالعهٔ بصری تایپوگرافی (خودکفا) |

## قواعد غیرقابل‌مذاکره

۱. این پروژه **فروشگاه نیست**: بدون سبد خرید، قیمت، پرداخت یا فرآیند خرید.
۲. فاز اول فقط فارسی، با پشتیبانی کامل RTL؛ انگلیسی و عربی بعداً بدون بازطراحی.
۳. پنل مدیریت از رابط عمومی موزه جدا است.
۴. محتوای موزه از پایگاه داده می‌آید و از پنل مدیریت ویرایش می‌شود — **هرگز در کامپوننت‌ها سخت‌کد نمی‌شود**.
۵. **PGlite هرگز در تولید.** تولید بدون `DATABASE_URL` بالا نمی‌آید؛ بازگشت خاموش وجود ندارد.
۶. هیچ راز یا اعتبارنامه‌ای در کنترل نسخه نیست.
۷. هیچ قابلیتی «پیاده‌شده» اعلام نمی‌شود مگر با آزمون اجراشده.
