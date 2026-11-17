-- ═══════════════════════════════════════════════════════════════════════════
-- GEMORIA — the six permanent halls
--
-- This is architectural data, not curated content. The specification fixes
-- exactly six halls, their order and their names; their Persian catalogue copy
-- was written, reviewed and approved in Phase 1A. Bootstrapping them in the
-- migration — rather than in a seed script someone has to remember to run —
-- means a freshly migrated production database already has a museum, and that
-- PGlite and PostgreSQL always agree about what it contains.
--
-- No specimen, mineral family or scientific fact is inserted here. The halls
-- hold nothing until a curator publishes something into them.
--
-- Idempotent by construction: the migration runs once per database (Drizzle
-- records it in its ledger), and the inserts are additionally guarded with
-- ON CONFLICT so that a partially applied database can be re-seeded safely.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO "halls" ("code", "latin_name", "status", "sort_order", "is_featured",
                     "cover_image_key", "hero_image_key", "published_at")
VALUES
  ('gemstones',     'Precious Gemstones',    'published', 10, true,  'hallGemstones',    'hallGemstones',    now()),
  ('semi-precious', 'Semi-Precious Stones',  'published', 20, true,  'hallSemiPrecious', 'hallSemiPrecious', now()),
  ('crystals',      'Crystals',              'published', 30, false, 'hallCrystals',     'hallCrystals',     now()),
  ('rare-minerals', 'Rare Minerals',         'published', 40, false, 'hallRareMinerals', 'hallRareMinerals', now()),
  ('geological',    'Geological Specimens',  'published', 50, false, 'hallGeological',   'hallGeological',   now()),
  ('organic',       'Organic-Origin Stones', 'published', 60, false, 'hallOrganic',      'hallOrganic',      now())
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint

INSERT INTO "hall_translations" ("hall_id", "locale", "slug", "title", "summary",
                                 "description", "image_alt", "seo_title",
                                 "seo_description", "search_text")
SELECT h."id", 'fa', v."slug", v."title", v."summary", v."description", v."image_alt",
       v."seo_title", v."seo_description", v."search_text"
FROM (VALUES
  ('gemstones', 'gemstones', 'سنگ‌های قیمتی',
   'گونه‌هایی که کمیابی، سختی و شفافیتشان آن‌ها را در تاریخ گوهرشناسی ماندگار کرده است.',
   'این تالار به گونه‌هایی اختصاص دارد که در تاریخ گوهرشناسی جایگاهی شناخته‌شده دارند: سنگ‌هایی که ترکیب شیمیایی، ساختار بلوری و شرایط تشکیلشان آن‌ها را از دیگر سنگ‌های طبیعی متمایز می‌کند. هر نمونه با نام علمی، خانوادهٔ کانی‌شناسی، مشخصات ثبت‌شده و خاستگاه جغرافیایی خود معرفی می‌شود؛ و هر ویژگی‌ای که ثبت نشده باشد، خالی می‌ماند.',
   'نمای نزدیک از یک زمرد تراش‌خورده با رگه‌های طبیعی، بر بستری از سنگ سیاه',
   'سنگ‌های قیمتی — تالار موزهٔ گموریا',
   'تالار سنگ‌های قیمتی موزهٔ گموریا: معرفی گونه‌های شناخته‌شدهٔ گوهرشناسی با نام علمی، خانوادهٔ کانی‌شناسی و خاستگاه جغرافیایی.',
   'سنگ‌های قیمتی گوهرشناسی زمرد یاقوت بریل کرندوم'),
  ('semi-precious', 'semi-precious', 'سنگ‌های نیمه‌قیمتی',
   'سنگ‌هایی با تنوع رنگی گسترده که روایت زمین را در لایه‌های خود نگه داشته‌اند.',
   'تالار سنگ‌های نیمه‌قیمتی به گونه‌هایی می‌پردازد که بیشترین گوناگونی رنگی و ساختاری را در مجموعهٔ موزه دارند. تقسیم‌بندی «قیمتی» و «نیمه‌قیمتی» یک تقسیم‌بندی نمایشی و بازاری است، نه علمی؛ از همین رو هر نمونه در این تالار همچنان با خانوادهٔ کانی‌شناسی و گروه علمی خود شناسایی می‌شود و جایگاه نمایشی، جای طبقه‌بندی علمی را نمی‌گیرد.',
   'برش عرضی یک گِیود آمیتیست با نوارهای بنفش و بلورهای داخلی',
   'سنگ‌های نیمه‌قیمتی — تالار موزهٔ گموریا',
   'تالار سنگ‌های نیمه‌قیمتی موزهٔ گموریا: گونه‌هایی با تنوع رنگی گسترده، همراه با طبقه‌بندی علمی مستقل از تقسیم‌بندی نمایشی.',
   'سنگ‌های نیمه‌قیمتی آمیتیست کوارتز عقیق تورمالین'),
  ('crystals', 'crystals', 'کریستال‌ها',
   'هندسهٔ درونی کانی که در شکل بیرونی بلور آشکار می‌شود.',
   'بلور، شکل بیرونی نظم اتمی درونی یک کانی است. آنچه در این تالار دیده می‌شود نتیجهٔ چیدمان اتم‌ها در شبکهٔ بلور است: تعداد وجه‌ها، زاویه‌ها و جهت‌گیری محورها. این تالار به خودِ ساختار بلوری می‌پردازد، نه به ارزش مادی سنگ؛ و هر نمونه با سیستم بلوری ثبت‌شدهٔ خود معرفی می‌شود.',
   'خوشهٔ بلور کوارتز شفاف با وجوه تیز بر سنگ تیره',
   'کریستال‌ها — تالار موزهٔ گموریا',
   'تالار کریستال‌های موزهٔ گموریا: ساختار بلوری کانی‌ها و رابطهٔ نظم اتمی درونی با شکل بیرونی بلور.',
   'کریستال بلور ساختار بلوری کوارتز کلسیت'),
  ('rare-minerals', 'rare-minerals', 'کانی‌های کمیاب',
   'گونه‌هایی که تنها در شرایط زمین‌شناختی ویژه و در شمار اندک شکل می‌گیرند.',
   'کمیابی یک کانی پیامد شرایط تشکیل آن است: ترکیب شیمیایی ویژه، دما و فشاری معین، و زمان کافی. این تالار گونه‌هایی را در بر می‌گیرد که در شمار محدودی از پهنه‌های زمین یافت شده‌اند. هیچ نمونه‌ای در این تالار بدون منبع ثبت‌شده معرفی نمی‌شود.',
   'نمونهٔ کانی با بافت گرانولار سبز و رگه‌های آبی و فلزی',
   'کانی‌های کمیاب — تالار موزهٔ گموریا',
   'تالار کانی‌های کمیاب موزهٔ گموریا: گونه‌هایی که تنها در شرایط زمین‌شناختی ویژه شکل می‌گیرند.',
   'کانی کمیاب کانی‌شناسی معدنیابی'),
  ('geological', 'geological', 'نمونه‌های زمین‌شناسی',
   'لایه‌ها، هسته‌ها و برش‌هایی که تاریخ یک ناحیه را در خود ثبت کرده‌اند.',
   'این تالار به سنگ و رسوب می‌پردازد، نه به گوهر: نمونه‌های زمین‌شناسی سند تاریخ یک ناحیه‌اند. لایه‌بندی، بافت و ترکیب هر نمونه چیزی دربارهٔ محیط تشکیل آن می‌گوید. نمونه‌های این تالار اغلب سنگ‌های طبیعی هستند و بسیاری از ویژگی‌های ثبت‌شدهٔ گوهرها دربارهٔ آن‌ها مصداق ندارد؛ از همین رو آن ویژگی‌ها خالی می‌مانند.',
   'برش سنگ رسوبی با لایه‌های متمایز روی پایهٔ موزه',
   'نمونه‌های زمین‌شناسی — تالار موزهٔ گموریا',
   'تالار نمونه‌های زمین‌شناسی موزهٔ گموریا: لایه‌ها، برش‌ها و نمونه‌های سنگ که تاریخ زمین‌شناختی یک ناحیه را ثبت کرده‌اند.',
   'زمین‌شناسی سنگ رسوبی لایه چینه‌شناسی'),
  ('organic', 'organic', 'سنگ‌های با منشأ آلی',
   'موادی که نه از تبلور کانی، بلکه از جانداران شکل گرفته‌اند؛ همچون مروارید و کهربا.',
   'همهٔ آنچه در موزه دیده می‌شود کانی نیست. مروارید، کهربا، مرجان و صدفِ فسیل‌شده موادی با منشأ آلی‌اند: ترکیب آن‌ها از فرآیندهای زیستی می‌آید، نه از تبلور در سنگ مذاب یا محلول. این تفاوت در طبقه‌بندی موزه صریح است و در هر نمونه ثبت می‌شود.',
   'مروارید، کهربای خام و قطعه‌ای مرجان روی سنگ زغالی',
   'سنگ‌های با منشأ آلی — تالار موزهٔ گموریا',
   'تالار سنگ‌های با منشأ آلی موزهٔ گموریا: مروارید، کهربا و مرجان؛ موادی که منشأ آن‌ها زیستی است، نه کانی‌شناختی.',
   'منشأ آلی مروارید کهربا مرجان صدف')
) AS v("code", "slug", "title", "summary", "description", "image_alt", "seo_title", "seo_description", "search_text")
JOIN "halls" h ON h."code" = v."code"
ON CONFLICT ("hall_id", "locale") DO NOTHING;
