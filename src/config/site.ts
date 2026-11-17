/**
 * GEMORIA — public museum configuration.
 *
 * Navigation is declared once and rendered by both the desktop header and the
 * mobile drawer. Items whose section does not exist yet are marked `available:
 * false`: they render as visibly disabled, are not links, and therefore cannot
 * produce a 404 or a dead end for a visitor or a crawler.
 *
 * Phase 0 ships one public page. Phase 2 turns `available` on, one section at a
 * time, as each route lands.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly available: boolean;
  /** Which phase makes this section real. Shown in the UI as a quiet note. */
  readonly phase?: string;
}

export const publicNav: readonly NavItem[] = [
  { label: 'خانه', href: '/', available: true },
  { label: 'موزه', href: '/museum', available: false, phase: 'فاز ۲' },
  { label: 'مجموعه‌ها', href: '/collections', available: false, phase: 'فاز ۲' },
  { label: 'اطلس', href: '/atlas', available: false, phase: 'فاز ۳' },
  { label: 'مجله', href: '/journal', available: false, phase: 'فاز ۳' },
];

export const museumSections = [
  {
    numeral: '۰۱',
    title: 'موزه',
    description:
      'گالری اشیای شاخص: سنگ‌های قیمتی و نیمه‌قیمتی، بلورها و نمونه‌های کانی‌شناسی، هر یک با کارت فنی، خاستگاه و روایت خود.',
    phase: 'فاز ۲',
    available: false,
  },
  {
    numeral: '۰۲',
    title: 'اطلس جغرافیایی',
    description:
      'کره‌ای از معادن و مناطق یافت: از موزوی کلمبیا تا پنجشیر افغانستان، با پیوند مستقیم هر نقطه به اشیای همان سرزمین.',
    phase: 'فاز ۳',
    available: false,
  },
  {
    numeral: '۰۳',
    title: 'مجلهٔ موزه',
    description:
      'مقاله‌های بلند دربارهٔ کانی‌شناسی، تاریخ گوهرشناسی و پشت‌صحنهٔ مجموعه‌ها؛ نوشته‌شده برای خواندن، نه برای فروش.',
    phase: 'فاز ۳',
    available: false,
  },
  {
    numeral: '۰۴',
    title: 'واژه‌نامه',
    description:
      'مرجعی برای زبان سنگ: تفاوت بریل و زمرد، معنای تراش امرالد، و آنچه «بدون تیمار» واقعاً می‌گوید.',
    phase: 'فاز ۳',
    available: false,
  },
] as const;

export const footerLinks = [
  { label: 'دربارهٔ گموریا', available: false, phase: 'فاز ۲' },
  { label: 'تماس', available: false, phase: 'فاز ۲' },
  { label: 'حریم خصوصی', available: false, phase: 'فاز ۶' },
  { label: 'شرایط استفاده', available: false, phase: 'فاز ۶' },
] as const;

export const site = {
  nameFa: 'گموریا',
  nameLatin: 'GEMORIA',
  tagline: 'موزهٔ دیجیتال سنگ‌های قیمتی',
  descriptionFa:
    'گموریا موزهٔ دیجیتال سنگ‌های قیمتی، کانی‌ها و نمونه‌های زمین‌شناسی است؛ مجموعه‌ای برای دیدن، خواندن و شناختن — نه برای خرید.',
  descriptionEn:
    'GEMORIA is a digital museum of gemstones, minerals and geological specimens: a collection to look at and learn from, not to buy.',
} as const;
