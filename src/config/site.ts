/**
 * GEMORIA — public museum configuration.
 *
 * Navigation is declared once and rendered by the desktop header, the mobile
 * drawer and the sitemap-bearing footer. An item whose destination does not
 * exist yet is marked `available: false`: it renders as inert text with its
 * phase, is not a link, and therefore cannot produce a 404 — for a visitor or
 * for a crawler.
 *
 * Phase 1A makes the whole primary navigation real: every entry points at a
 * section that exists today. Legal pages (privacy, terms) stay inert until the
 * hosting phase decides what they must say.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly available: boolean;
  /** Which phase makes this section real. Shown in the UI as a quiet note. */
  readonly phase?: string;
}

/**
 * The header's primary navigation, in reading order (right to left).
 *
 * `/#atlas` rather than `#atlas`: the anchors are absolute so the same header
 * works on every page, not only on the homepage.
 */
export const publicNav: readonly NavItem[] = [
  { label: 'خانه', href: '/', available: true },
  { label: 'تالارهای موزه', href: '/halls', available: true },
  { label: 'اطلس جهانی', href: '/#atlas', available: true },
  { label: 'دانشنامه', href: '/#encyclopedia', available: true },
  { label: 'دربارهٔ موزه', href: '/#about', available: true },
];

/** Secondary column in the footer: the museum itself. */
export const footerNav: readonly NavItem[] = [
  { label: 'تالارهای موزه', href: '/halls', available: true },
  { label: 'نمونه‌های منتخب', href: '/#featured', available: true },
  { label: 'اطلس جهانی', href: '/#atlas', available: true },
  { label: 'دانشنامه', href: '/#encyclopedia', available: true },
  { label: 'دربارهٔ موزه', href: '/#about', available: true },
];

/** Legal column. Inert until the hosting phase decides what these must say. */
export const footerLinks = [
  { label: 'حریم خصوصی', available: false, phase: 'فاز ۶' },
  { label: 'شرایط استفاده', available: false, phase: 'فاز ۶' },
  { label: 'دسترس‌پذیری', available: false, phase: 'فاز ۶' },
] as const;

export const site = {
  nameFa: 'گموریا',
  nameLatin: 'GEMORIA',
  tagline: 'موزهٔ دیجیتال سنگ‌های قیمتی',
  /** Used as the default meta description. */
  descriptionFa:
    'گموریا موزهٔ دیجیتال سنگ‌های قیمتی، کانی‌ها و نمونه‌های زمین‌شناسی است؛ مجموعه‌ای برای دیدن، خواندن و شناختن — نه برای خرید.',
  descriptionEn:
    'GEMORIA is a digital museum of gemstones, minerals and geological specimens: a collection to look at and learn from, not to buy.',
} as const;

/**
 * A canonical URL is only honest if the deployment actually knows its public
 * origin. `APP_URL` defaults to localhost in development, and emitting
 * `canonical: http://localhost:3000` into a released page is worse than emitting
 * none at all: it tells crawlers the canonical version of the museum is a laptop.
 */
export function officialUrl(appUrl: string): string | null {
  try {
    const url = new URL(appUrl);
    const isLocal =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.endsWith('.local') ||
      url.hostname.startsWith('192.168.');
    if (isLocal || url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}
