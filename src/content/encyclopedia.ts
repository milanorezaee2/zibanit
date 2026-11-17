/**
 * GEMORIA — encyclopedia topics.
 *
 * The five axes along which the museum explains a mineral. They are structural:
 * each one is a question a visitor can ask about *any* object in the collection,
 * which is why the encyclopedia is organised by them rather than by object.
 *
 * Phase 1A renders the index only — the entries themselves belong to the
 * encyclopedia phase. No article text, no invented facts.
 */
export interface EncyclopediaTopic {
  readonly slug: string;
  readonly titleFa: string;
  readonly titleEn: string;
  /** What question this axis answers. One line, factual, no claims. */
  readonly question: string;
}

export const encyclopediaTopics: readonly EncyclopediaTopic[] = [
  {
    slug: 'crystal-structure',
    titleFa: 'ساختار بلوری',
    titleEn: 'Crystal Structure',
    question: 'چیدمان اتم‌ها در شبکهٔ بلور چگونه شکل بیرونی یک کانی را تعیین می‌کند؟',
  },
  {
    slug: 'hardness',
    titleFa: 'سختی کانی‌ها',
    titleEn: 'Mineral Hardness',
    question: 'مقیاس موس چگونه مقاومت سطحی یک کانی در برابر خراش را می‌سنجد؟',
  },
  {
    slug: 'chemical-composition',
    titleFa: 'ترکیب شیمیایی',
    titleEn: 'Chemical Composition',
    question: 'چه عناصر و پیوندهایی یک گونهٔ کانی را از گونهٔ دیگر جدا می‌کند؟',
  },
  {
    slug: 'formation',
    titleFa: 'شکل‌گیری سنگ‌ها',
    titleEn: 'Rock Formation',
    question: 'فرآیندهای آذرین، دگرگونی و رسوبی در طول میلیون‌ها سال چه می‌کنند؟',
  },
  {
    slug: 'distribution',
    titleFa: 'پراکندگی جغرافیایی',
    titleEn: 'Geographic Distribution',
    question: 'کدام شرایط زمین‌شناختی، یافتن یک کانی را در یک منطقه ممکن می‌کند؟',
  },
];
