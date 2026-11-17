/**
 * GEMORIA — Administration Dashboard navigation.
 *
 * The dashboard is a separate surface from the museum: different layout,
 * different density, different intent. Every entry below is declared with the
 * permission Phase 1 will enforce, so the navigation and the authorisation model
 * cannot drift apart later.
 */
export interface AdminNavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly available: boolean;
  readonly phase?: string;
  /** Permission key enforced server-side from Phase 1. */
  readonly permission: string;
  readonly description: string;
}

export interface AdminNavGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly AdminNavItem[];
}

export const adminNav: readonly AdminNavGroup[] = [
  {
    id: 'overview',
    title: 'نمای کلی',
    items: [
      {
        id: 'dashboard',
        label: 'داشبورد',
        href: '/admin',
        available: true,
        permission: 'dashboard.read',
        description: 'وضعیت سامانه، پایگاه داده و مایگریشن‌ها',
      },
    ],
  },
  {
    id: 'collection',
    title: 'مجموعه',
    items: [
      {
        id: 'halls',
        label: 'تالارها',
        href: '/admin/halls',
        available: true,
        permission: 'hall.read',
        description: 'ترتیب، متن و انتشار شش تالار موزه',
      },
      {
        id: 'specimens',
        label: 'اشیای موزه',
        href: '/admin/specimens',
        available: true,
        permission: 'specimen.read',
        description: 'کاتالوگ اشیا، کارت فنی، گالری رسانه',
      },
      {
        id: 'taxonomy',
        label: 'تاکسونومی',
        href: '/admin/taxonomy',
        available: false,
        phase: 'فاز ۱',
        permission: 'taxonomy.read',
        description: 'گونهٔ کانی، رنگ، تراش، تیمار',
      },
      {
        id: 'geography',
        label: 'جغرافیا',
        href: '/admin/geography',
        available: false,
        phase: 'فاز ۱',
        permission: 'geography.read',
        description: 'کشور، منطقه و معدن',
      },
      {
        id: 'media',
        label: 'کتابخانهٔ رسانه',
        href: '/admin/media',
        available: true,
        permission: 'media.read',
        description: 'تصویر، ویدیو، مدل سه‌بعدی',
      },
    ],
  },
  {
    id: 'editorial',
    title: 'تحریریه',
    items: [
      {
        id: 'journal',
        label: 'مجله و واژه‌نامه',
        href: '/admin/journal',
        available: false,
        phase: 'فاز ۳',
        permission: 'article.read',
        description: 'مقاله، مدخل واژه‌نامه',
      },
      {
        id: 'home',
        label: 'چیدمان صفحهٔ خانه',
        href: '/admin/curation',
        available: false,
        phase: 'فاز ۵',
        permission: 'curation.write',
        description: 'بخش‌ها، ترتیب، اشیای شاخص',
      },
    ],
  },
  {
    id: 'administration',
    title: 'مدیریت',
    items: [
      {
        id: 'users',
        label: 'کاربران و نقش‌ها',
        href: '/admin/users',
        available: false,
        phase: 'فاز ۱',
        permission: 'user.manage',
        description: 'دسترسی، MFA، نشست‌ها',
      },
      {
        id: 'audit',
        label: 'لاگ حسابرسی',
        href: '/admin/audit',
        available: false,
        phase: 'فاز ۱',
        permission: 'audit.read',
        description: 'چه کسی، چه چیزی، چه زمانی',
      },
      {
        id: 'settings',
        label: 'تنظیمات',
        href: '/admin/settings',
        available: false,
        phase: 'فاز ۵',
        permission: 'settings.write',
        description: 'تنظیمات موزه، SEO، ریدایرکت',
      },
    ],
  },
] as const;
