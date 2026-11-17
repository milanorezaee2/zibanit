# فاز ۱B — هستهٔ موزهٔ دیجیتال

> این سند وضعیتِ **اجراشده** را ثبت می‌کند، نه وضعیتِ برنامه‌ریزی‌شده. هر ادعا با
> دستوری که واقعاً اجرا شده همراه است. آنچه اجرا نشده، در بخش «محدودیت‌ها» آمده و
> کامل گزارش نمی‌شود.

## ۱. معماری

```
src/
├── app/
│   ├── (museum)/                 صفحه‌های عمومی؛ چیدمان موزه، RTL، فارسی
│   │   ├── page.tsx              خانه (پویا: تالارها از پایگاه داده)
│   │   ├── halls/                فهرست تالارها + صفحهٔ هر تالار
│   │   ├── specimens/[slug]/     صفحهٔ نمونه (۷ بخش)
│   │   ├── search/               جست‌وجوی سمت سرور + loading.tsx
│   │   └── encyclopedia/         فهرست مقاله‌ها + مقاله
│   ├── admin/
│   │   ├── layout.tsx            فقط noindex؛ بدون محافظ
│   │   ├── login/                صفحهٔ ورود + Server Actionهای ورود/خروج
│   │   └── (secured)/            چیدمان محافظت‌شده + داشبورد + CRUD
│   ├── api/health/               سلامت سامانه
│   ├── robots.ts                 سیاست خزش
│   └── not-found.tsx             ۴۰۴ فارسی
├── components/
│   ├── ui/                       سیستم طراحی ۱A
│   ├── museum/                   کارت نمونه، گالری، فیلترها، صفحه‌بندی، رکورد علمی
│   ├── layout/                   هدر/فوتر موزه، پوستهٔ پنل
│   └── admin/                    فرم نمونه، فرم تالار، فرم رسانه، ورود، تأیید حذف
├── db/
│   ├── schema/                   منبع حقیقت ساختار (۲۰ جدول)
│   ├── migrations/               0000، 0001 (ساختار) و 0002 (بذر شش تالار)
│   ├── queries/                  خواندن: halls، specimens، articles، taxonomy، admin
│   ├── mutations/                نوشتن: specimens، halls، media، audit
│   └── migrate.ts                اجرای مایگریشن + `EXPECTED_TABLES`
├── lib/
│   ├── auth/                     گذرواژه، نشست، مجوزها، محدودیت نرخ
│   ├── validation/               اسکیمای Zod نوشتن (نمونه، تالار، رسانه)
│   ├── search/                   یکسان‌سازی فارسی + قرارداد پارامترهای URL
│   └── media/storage.ts          کلید ذخیره‌سازی مستقل از ردیف
└── content/                      واژگان بستهٔ علمی (۷ سیستم بلوری، ۴ نوع تاکسونومی)
```

قاعده‌های رعایت‌شده:

- **دسترسی به داده جدا از UI**: هیچ صفحه‌ای SQL نمی‌نویسد؛ همه از `db/queries/*` یا
  `db/mutations/*` می‌خوانند/می‌نویسند.
- **Server Component پیش‌فرض**: تنها چهار مؤلفهٔ کلاینتی وجود دارد — گالری نمونه،
  فیلد جست‌وجوی تأخیری، فرم‌های پنل و پوستهٔ پنل (به‌دلیل `usePathname`).
- **اعتبارسنجی روی مرز**: هر Server Action پیش از تماس با لایهٔ نوشتن، با Zod
  اعتبارسنجی می‌کند؛ اسکیمای همان فرم در کلاینت هم اجرا می‌شود.
- **بدون N+1**: فهرست‌ها با یک کوئری + شمارش تجمیعی، فیلترها با `exists`/`in`.
- **پنل هرگز کش نمی‌شود**: `dynamic = 'force-dynamic'` روی همهٔ صفحه‌های پنل.

## ۲. جدول‌ها و مایگریشن‌ها

۲۰ جدول در `public` (فهرست کامل در `EXPECTED_TABLES` در `src/db/migrate.ts`):

| گروه | جدول‌ها |
| --- | --- |
| هویت | `users`, `sessions`, `audit_log`, `app_settings` |
| تالار | `halls`, `hall_translations`, `hall_specimens` |
| نمونه | `specimens`, `specimen_translations`, `specimen_provenances`, `specimen_media`, `specimen_relations` |
| تاکسونومی | `taxonomy_terms`, `taxonomy_term_translations` |
| رسانه | `media_assets`, `media_translations` |
| دانشنامه | `articles`, `article_translations`, `article_specimens`, `article_sources` |

- `0000_tidy_puppet_master.sql` — ساختار ۱A.
- `0001_cooing_dark_beast.sql` — ساختار ۱B (تالار، نمونه، تاکسونومی، دانشنامه، رسانهٔ نمونه).
- `0002_seed_halls.sql` — شش تالار ثابت با متن فارسی؛ `on conflict do nothing`.
- هیچ مایگریشن مخربی وجود ندارد: حذف، نرم است (`deleted_at`) و هر ستون تازه `null`-پذیر
  یا دارای پیش‌فرض است.

**برابری دو موتور**: همان مجموعه‌آزمون‌ها روی PGlite و PostgreSQL واقعی اجرا می‌شوند
(`tests/collection/*`). نتیجه در بخش ۸.

## ۳. رابطه‌ها

- **تالار ↔ نمونه**: چند-به-چند با `hall_specimens` (`hall_id`, `specimen_id`,
  `sort_order`, `is_featured`). یک نمونه در چند تالار بدون تکرار رکورد.
- **نمونه → تاکسونومی**: `mineral_family_id`, `scientific_group_id`, `specimen_type_id`,
  `origin_kind_id` — چهار محور بستهٔ علمی با `kind` در `taxonomy_terms`. **تالار
  تاکسونومی نیست** و در تست `tests/config.test.ts` صریحاً نفی شده است.
- **نمونه → منشأ**: `specimen_provenances` (کشور، کد ISO، منطقه، محل، یادداشت، ترتیب).
- **نمونه → رسانه**: `specimen_media` با `role` (primary/gallery/macro/video/model/panorama)
  و `sort_order`. فایل در `media_assets` مستقل از ردیف است و کلید ذخیره‌سازی
  (`storageKey`) به CDN/Object Storage قابل انتقال است.
- **نمونه ↔ نمونه**: فقط `specimen_relations` (صریح و دستی) یا اشتراک طبقه‌بندی/محل؛
  هرگز مقایسهٔ رشتهٔ نام. آزمون: «suggests related objects from shared classification,
  never from name matching».
- **دانشنامه ↔ نمونه**: `article_specimens`؛ هر دو سو در مجموعه‌آزمون بررسی می‌شود.
- **حذف**: نرم، با حفظ ترجمه‌ها، منشأ، پیوندها و سابقهٔ حسابرسی؛ آزمون «leaves no
  orphan translation, provenance or hall link behind».

## ۴. مسیرها (خروجی `npm run build`)

```
ƒ /                       ƒ /halls                 ƒ /halls/[slug]
ƒ /specimens/[slug]       ƒ /search                ƒ /encyclopedia
ƒ /encyclopedia/[slug]    ƒ /admin                 ƒ /admin/login
ƒ /admin/specimens        ƒ /admin/specimens/new   ƒ /admin/specimens/[id]
ƒ /admin/halls            ƒ /admin/halls/[id]      ƒ /admin/media
ƒ /api/health             ƒ /robots.txt            ○ /_not-found
```

- فقط `published` عمومی است. پیش‌نویس و بایگانی: نه در فهرست، نه در جست‌وجو، نه با
  نشانی مستقیم (۴۰۴). آزمون‌ها: «creates a specimen as a draft that the public cannot
  see» و «hides a soft-deleted object without destroying its record».
- نشانی نامعتبر → ۴۰۴ واقعی (`notFound()`), نه صفحهٔ خالی. در smoke با درخواست
  HTTP واقعی سنجیده می‌شود.

## ۵. جست‌وجو و فیلتر

- پرس‌وجو: `search_tsv @@ plainto_tsquery('simple', …)` **به‌همراه** `ilike '%…%'` روی
  `search_text`، تا هم واژه‌ای و هم زیررشته‌ای کار کند (نام لاتین، فرمول).
- یکسان‌سازی فارسی پیش از پرس‌وجو: `ي→ی`, `ك→ک`, `ۀ/ة→ه`, حذف اعراب، یکسان‌سازی
  نیم‌فاصله و فاصله، ارقام فارسی→لاتین (`tests/search/normalize.test.ts`, ۹ آزمون).
- کلیدهای مجاز URL: `q, hall, family, color, transparency, country, hardness, media,
  sort, page`. مقدار نامعتبر **حذف** می‌شود، نه پیش‌فرض‌سازی؛ هیچ‌گاه به SQL نمی‌رسد
  (پارامتریزه با Drizzle).
- مرتب‌سازی: `newest | oldest | title-fa | title-en`؛ `title-fa` با کلید مرتب‌سازی
  الفبای فارسی (`title_sort_key`) که در زمان نوشتن ساخته می‌شود.
- صفحه‌بندی سمت سرور: `DEFAULT_PAGE_SIZE=12`, `MAX_PAGE_SIZE=48`, سقف شمارهٔ صفحه.
- فرم فیلتر GET است: بدون جاوااسکریپت هم کار می‌کند، لینک‌ها قابل اشتراک‌اند،
  فیلترها در صفحه‌بندی حفظ می‌شوند.

## ۶. پنل مدیریت

| قابلیت | وضعیت | شاهد |
| --- | --- | --- |
| فهرست نمونه‌ها (همهٔ وضعیت‌ها + جست‌وجو + صفحه‌بندی) | پیاده‌شده | `GET /admin/specimens` → ۲۰۰ |
| فرم هشت‌بخشی نمونه (عمومی، توضیحات، علمی، طبقه‌بندی، جغرافیا، رسانه، SEO، ثبت) | پیاده‌شده | ۸ سرفصل در HTML |
| ایجاد (همیشه پیش‌نویس) | پیاده‌شده | `tests/security/access-control.test.ts` |
| ویرایش | پیاده‌شده | `updateSpecimen` + آزمون چرخهٔ عمر |
| انتشار / خروج از انتشار / بایگانی | پیاده‌شده، مجوز جدا | `setSpecimenStatus` + آزمون |
| حذف با تأیید (نرم) | پیاده‌شده | `ConfirmSubmit` + `softDeleteSpecimen` |
| تالارها: فهرست، ترتیب (بالا/پایین)، ویرایش متن، انتشار | پیاده‌شده | `GET /admin/halls` → ۲۰۰ |
| کتابخانهٔ رسانه: ثبت ارجاع فایل + فهرست | پیاده‌شده | `GET /admin/media` → ۲۰۰ |
| ورود / خروج | پیاده‌شده | `tests/security` (۵ آزمون) |

- **بارگذاری فایل از مرورگر وجود ندارد** (عمدی، خارج از دامنهٔ ۱B): فرم رسانه فقط
  ارجاع به فایلی را ثبت می‌کند که در مسیر عمومی قرار گرفته است. کلید ناامن
  (`..`، مسیر نسبی، فاصله) در لایهٔ mutation رد می‌شود.
- **کاربران و نقش‌ها** در ۱B فقط نمایشی/مجوزی است: ساخت کاربر با `npm run admin:create`.
  (بند «users» در فاز ۵.)

## ۷. احراز هویت و مجوزه

- گذرواژه: scrypt با `N=16384, r=8, p=1, keyLength=64`, نمک تصادفی ۱۶ بایتی، قالب
  `scrypt$N$r$p$salt$key`. تأیید با مقایسهٔ زمان‌ثابت. آرگون۲id در محیط فعلی در
  دسترس نیست؛ scrypt انتخاب مستند است.
- نشست: توکن ۳۲ بایتی تصادفی، **فقط هش SHA‑256 آن** در `sessions`؛ کوکی
  `gemoria_session` با `httpOnly`, `sameSite=lax`, `secure` در تولید، ۱۲ ساعت.
  هر خواندن، نشست را دوباره از پایگاه داده اعتبارسنجی می‌کند (ابطال و انقضا و
  تعلیق حساب فوراً اثر می‌کند).
- محافظ‌ها: `requireUser()`, `requirePermissionUser(perm)` (استثنا می‌دهد),
  `guardPage(perm)` (برای صفحه‌ها که نمی‌توانند کد وضعیت بدهند), `currentUserCan()`
  فقط برای رندر.
- **هر Server Action محافظ خودش را دارد**، چون یک Action یک نقطهٔ پایانی HTTP است و
  می‌تواند بدون رندر صفحه فراخوانی شود. چیدمان محافظت‌شده محافظِ *صفحه* است، نه مجوزِ *نوشتن*.
- ۱۷ مجوز، ۶ نقش (`super_admin`, `curator`, `editor`, `media_manager`, `seo_manager`,
  `viewer`)؛ نقش‌ها گسترش‌پذیرند زیرا مجوزها داده‌اند نه شرط‌های پراکنده.
- محدودیت نرخ: ۵ شکست / ۱۵ دقیقه برای هر (ایمیل، کلاینت). پیام یکسان برای کاربر
  ناشناس و گذرواژهٔ نادرست. `DUMMY_HASH` زمان پاسخ را یکسان می‌کند.
- کوکی پاک‌سازی نشست با یک `<form>` و Server Action انجام می‌شود، نه لینک GET.

## ۸. شواهد اجراشده

| دستور | نتیجه |
| --- | --- |
| `npx tsc --noEmit` | بدون خطا |
| `npx vitest run` | **۱۳۰ گذشت، ۱ رد‌شده** (۱۲ فایل: ۱۱ گذشت، ۱ رد) |
| `npm run test:postgres` | **۳۴ گذشت** (۱۶ آزمون پایگاه‌داده + ۱۸ آزمون مجموعه روی PostgreSQL 18 واقعی) |
| `npm run build` | موفق؛ ۱۸ مسیر (جدول بخش ۴) |
| `npm run smoke` (dev، PGlite) | **۱۲۱/۱۲۱** |
| `SMOKE_BASE_URL=http://127.0.0.1:3200 npm run smoke` (standalone، PostgreSQL) | **۱۲۱/۱۲۱** |
| `npm run db:migrate` (PGlite) | `applied 3/3`, `schema complete (20 tables)` |
| `npm run db:migrate` (PostgreSQL) | `applied 3/3`, `schema complete (20 tables)` |

آزمون رد‌شده (تنها یکی، آگاهانه):

```
tests/database/postgres.test.ts > database compatibility — real PostgreSQL (skipped)
  › requires TEST_DATABASE_URL …
```

این فایل وقتی `TEST_DATABASE_URL` نباشد اجرا نمی‌شود و **گذشته گزارش نمی‌شود**؛
`npm run test:postgres` همان آزمون‌ها را برای واقعی اجرا می‌کند (بالا).

### آزمون‌های امنیتی (۱۸ آزمون، `tests/security/access-control.test.ts`)

اجرا روی پایگاه دادهٔ واقعی PGlite، با کاربران واقعی و هش واقعی؛ تنها لبهٔ Next.js
(کوکی، `redirect`, `revalidatePath`) جایگزین شده است، چون سرور HTTP در دسترس نیست.

- بدون نشست → هدایت به `/admin/login?next=%2Fadmin`؛ توکن جعلی → نشست نامعتبر.
- بازبین (viewer) واردشده اما بی‌مجوز → `ForbiddenError`؛ هیچ ردیفی نوشته نمی‌شود.
- همان نوشتن با کیوریتور → موفق، و رکورد **پیش‌نویس** می‌ماند.
- خطاهای فیلد به فارسی، مقادیر فرم حفظ می‌شود، شمارهٔ اموال تکراری خطای فیلد است نه ۵۰۰.
- فیلد `status` از فرم ذخیره نادیده گرفته می‌شود (انتشار فقط با Action مجاز).
- انتشار/حذف برای viewer ممنوع؛ پیش‌نویس تا انتشار در کوئری عمومی نیست.
- کوکی `httpOnly`, `sameSite=lax`, `path=/`؛ پیام یکسان برای کاربر ناشناس/گذرواژهٔ غلط؛
  محدودیت نرخ پس از ۵ شکست حتی گذرواژهٔ درست را رد می‌کند؛ خروج، نشست را باطل می‌کند و
  توکن باطل‌شده دوباره کار نمی‌کند؛ پنل و صفحهٔ ورود `noindex`.

### بررسی HTTP دستی (standalone + PostgreSQL، بدون مرورگر)

| درخواست | نتیجه |
| --- | --- |
| `GET /admin` بی‌نشست | ۳۰۷ → `/admin/login?next=%2Fadmin` |
| `GET /admin/specimens` بی‌نشست | ۳۰۷ به صفحهٔ ورود |
| `GET /admin/login` | ۲۰۰، `X-Robots-Tag: noindex…`, فیلد گذرواژه، بدون هش ذخیره‌شده |
| `GET /admin/specimens` با نشست کیوریتور | ۲۰۰، یک `<h1>` |
| `GET /admin/halls/{id}` با کیوریتور | ۲۰۰، فرم با مقدار فارسی «سنگ‌های قیمتی» |
| `GET /admin/halls/{id}` با بازبین | ۲۰۰، پنل «اجازهٔ ورود… را ندارید»، **بدون هیچ فیلد فرم** |
| `GET /admin/specimens/new` با بازبین | پنل عدم دسترسی، بدون فیلد فرم |
| `GET /admin/specimens/new` با کیوریتور | ۲۰۰، ۸ سرفصل، ۶۳ کیلوبایت HTML |
| `GET /admin/media` با کیوریتور | ۲۰۰ |

> مسیر نوشتن از طریق **ارسال واقعی فرم در مرورگر** آزمایش نشده است (مرورگری وجود
> ندارد)؛ همان Actionها در Vitest با پایگاه دادهٔ واقعی اجرا و بررسی شده‌اند.

## ۹. SEO و متادیتا

- هر صفحه `title`/`description` فارسی مخصوص خود دارد؛ `metadataBase` از `APP_URL`.
- `BreadcrumbList` تنها داده ساختاریافتهٔ صفحهٔ نمونه است؛ **`Product` هرگز**.
- `/search` و کل `/admin` با `noindex`؛ `src/app/robots.ts` مسیرهای `/admin`, `/api/`,
  `/search` را نفی می‌کند. هدر `X-Robots-Tag` روی `/admin/:path*`.
- هیچ دامنهٔ متعارف، آدرس یا دادهٔ تماس ساختگی ساخته نشده؛ `sitemap.xml` تا تعیین
  دامنهٔ واقعی ساخته نمی‌شود.

## ۱۰. دسترس‌پذیری و رابط

- HTML معنایی (`header/main/nav/section` + سرفصل‌های مرتب)، لینک پرش، یک `<h1>` در
  هر صفحه (شامل `/search`؛ اسکلت بارگذاری عمداً `h1` ندارد).
- گالری نمونه: دیالوگ با `Esc`، کلیدهای جهت، بازگشت تمرکز، قفل اسکرول، تصاویر با
  ابعاد صریح و `loading="lazy"` (تصویر اصلی `priority`).
- فرم‌ها: برچسب برای هر فیلد، خطا با `role="alert"`، `aria-invalid`، دکمهٔ غیرفعال
  در حال ارسال، `aria-live` برای وضعیت.
- رنگ هیچ‌گاه تنها حامل معنا نیست؛ وضعیت‌ها متن هم دارند. طلایی فقط لهجه است؛
  متن فارسی بدون letter-spacing؛ نام لاتین با `dir="ltr"`.

## ۱۱. محدودیت‌ها (صادقانه)

1. **مرورگر موجود نیست** و نصب‌شدنی نیست: هیچ آزمون بصری/اسکرین‌شات اجرا نشده.
   جای آن `npm run smoke` روی سرور واقعی اجرا می‌شود (۱۲۱ بررسی) — این جای اسکرین‌شات
   را نمی‌گیرد و ادعای «بازبینی بصری» نمی‌شود.
2. **بدون نقشه**: صفحهٔ منشأ فقط متن است؛ نقطهٔ اتصال اطلس (`atlas-preview` و
   `specimen_provenances.latitude/longitude`) دست‌نخورده باقی مانده.
3. **۳D/۳۶۰ فقط نقطهٔ اتصال**: `role = model | panorama` در مدل داده هست؛ نمایشگر نیست.
4. **آپلود رسانه نیست**: فقط ثبت ارجاع (بخش ۶).
5. **جست‌وجوی برجسته‌سازی/غلط‌یابی ندارد**؛ `simple` config و `ilike` است، بدون
   ریشه‌یابی فارسی.
6. **`sitemap.xml` ساخته نشده** (بدون دامنهٔ واقعی).
7. **کاربران/نقش‌ها UI ندارند**؛ مدیریت با `npm run admin:create`.
8. **بدون زبان دوم**: ساختار چندزبانه هست (`*_translations` با `locale`)، اما فقط `fa`.

## ۱۲. بدهی فنی

- `hall_translations.search_text` فقط عنوان/لاتین/خلاصه را می‌گیرد؛ اگر متن کامل تالار
  هم باید جست‌وجو شود، بازتولید لازم است.
- جست‌وجو با `ilike` روی همهٔ ردیف‌ها کار می‌کند؛ با رشد مجموعه به ایندکس
  trigram نیاز خواهد داشت.
- محدودیت نرخ درون‌فرایندی است؛ در چند نمونه (multi-instance) باید به فروشگاه
  مشترک منتقل شود.
- `specimen_relations` API عمومی برای ویرایش در پنل ندارد (جدول و کوئری آماده است).
- آزمون‌های UI (اندازه‌های دسکتاپ/تبلت/موبایل) با توجه به نبود مرورگر اجرا نشده‌اند؛
  به‌جای آن ساختار HTML و CSS و smoke بررسی شده است.

## ۱۳. دستورهای بازتولید

```bash
npm install
npm run db:migrate                 # PGlite: .data/pglite
npm run admin:create -- --email curator@gemoria.example --name "کارشناس مجموعه" --role curator
npm run dev                        # http://localhost:3000  →  /admin/login
npx tsc --noEmit
npx vitest run
npm run build && npm run test:postgres
npm run smoke
```
