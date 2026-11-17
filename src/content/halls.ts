/**
 * GEMORIA — the six halls of the museum.
 *
 * This is the museum's *architecture*, not its content: which galleries exist,
 * what they are called and in what order a visitor walks through them. The
 * specimens inside each hall come from the database and the dashboard — nothing
 * on this list is a curated object.
 *
 * Phase 1A: the six halls are declared here so the homepage and the halls index
 * share one source. Phase 1B moves them into `halls` / `hall_translations` tables
 * with the same shape; this module then becomes the seed and the type, and no
 * component changes.
 *
 * Bilingual titles are not decoration: the Latin line is the museum's second
 * voice (a Persian visitor reads «سنگ‌های قیمتی», an international one reads
 * "Precious Gemstones"). It is also the shape the English locale will need.
 */
import { media, type MediaKey } from './media.generated';

export type HallEmphasis = 'feature' | 'companion' | 'standard' | 'band';

export interface Hall {
  readonly slug: string;
  /** Persian title — the one a visitor reads first. */
  readonly titleFa: string;
  /** Latin title, set small and quiet beneath the Persian one. */
  readonly titleEn: string;
  /** One sentence. A hall label, not an article. */
  readonly summary: string;
  readonly imageKey: MediaKey;
  /** Intentional asymmetry: not six identical cards. */
  readonly emphasis: HallEmphasis;
  /** Human-readable description for the image alternative text. */
  readonly imageAlt: string;
}

export const halls: readonly Hall[] = [
  {
    slug: 'gemstones',
    titleFa: 'سنگ‌های قیمتی',
    titleEn: 'Precious Gemstones',
    summary:
      'گونه‌هایی که کمیابی، سختی و شفافیتشان آن‌ها را در تاریخ گوهرشناسی ماندگار کرده است.',
    imageKey: 'hallGemstones',
    emphasis: 'feature',
    imageAlt: 'نمای نزدیک از یک زمرد تراش‌خورده با رگه‌های طبیعی، بر بستری از سنگ سیاه',
  },
  {
    slug: 'semi-precious',
    titleFa: 'سنگ‌های نیمه‌قیمتی',
    titleEn: 'Semi-Precious Stones',
    summary: 'سنگ‌هایی با تنوع رنگی گسترده که روایت زمین را در لایه‌های خود نگه داشته‌اند.',
    imageKey: 'hallSemiPrecious',
    emphasis: 'companion',
    imageAlt: 'برش عرضی یک گِیود آمیتیست با نوارهای بنفش و بلورهای داخلی',
  },
  {
    slug: 'crystals',
    titleFa: 'کریستال‌ها',
    titleEn: 'Crystals',
    summary: 'هندسهٔ درونی کانی که در شکل بیرونی بلور آشکار می‌شود.',
    imageKey: 'hallCrystals',
    emphasis: 'standard',
    imageAlt: 'خوشهٔ بلور کوارتز شفاف با وجوه تیز بر سنگ تیره',
  },
  {
    slug: 'rare-minerals',
    titleFa: 'کانی‌های کمیاب',
    titleEn: 'Rare Minerals',
    summary: 'گونه‌هایی که تنها در شرایط زمین‌شناختی ویژه و در شمار اندک شکل می‌گیرند.',
    imageKey: 'hallRareMinerals',
    emphasis: 'standard',
    imageAlt: 'نمونهٔ کانی با بافت گرانولار سبز و رگه‌های آبی و فلزی',
  },
  {
    slug: 'geological',
    titleFa: 'نمونه‌های زمین‌شناسی',
    titleEn: 'Geological Specimens',
    summary: 'لایه‌ها، هسته‌ها و برش‌هایی که تاریخ یک ناحیه را در خود ثبت کرده‌اند.',
    imageKey: 'hallGeological',
    emphasis: 'standard',
    imageAlt: 'برش سنگ رسوبی با لایه‌های متمایز روی پایهٔ موزه',
  },
  {
    slug: 'organic',
    titleFa: 'سنگ‌های با منشأ آلی',
    titleEn: 'Organic-Origin Stones',
    summary: 'موادی که نه از تبلور کانی، بلکه از جانداران شکل گرفته‌اند؛ همچون مروارید و کهربا.',
    imageKey: 'hallOrganic',
    emphasis: 'band',
    imageAlt: 'مروارید، کهربای خام و قطعه‌ای مرجان روی سنگ زغالی',
  },
];

export function hallImage(hall: Hall) {
  return media[hall.imageKey];
}

export function findHall(slug: string): Hall | undefined {
  return halls.find((hall) => hall.slug === slug);
}
