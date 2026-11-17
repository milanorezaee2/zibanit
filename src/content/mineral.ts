/**
 * GEMORIA — closed scientific vocabularies, in the museum's voice.
 *
 * These are *labels*, not content: the seven crystal systems and the four
 * classification axes are fixed by crystallography and by this application's
 * schema respectively, and a museum that renamed them would be wrong rather than
 * creative. Anything a curator may invent — a mineral family, a colour, a
 * locality — lives in the database instead, and this file deliberately does not
 * list it.
 */

export const CRYSTAL_SYSTEMS = [
  'triclinic',
  'monoclinic',
  'orthorhombic',
  'tetragonal',
  'trigonal',
  'hexagonal',
  'cubic',
] as const;

export type CrystalSystem = (typeof CRYSTAL_SYSTEMS)[number];

export const CRYSTAL_SYSTEM_LABELS: Record<CrystalSystem, { fa: string; en: string }> = {
  triclinic: { fa: 'سه‌شیب', en: 'Triclinic' },
  monoclinic: { fa: 'تک‌شیب', en: 'Monoclinic' },
  orthorhombic: { fa: 'راست‌لوزی', en: 'Orthorhombic' },
  tetragonal: { fa: 'چهارگوش', en: 'Tetragonal' },
  trigonal: { fa: 'سه‌گوش', en: 'Trigonal' },
  hexagonal: { fa: 'شش‌گوش', en: 'Hexagonal' },
  cubic: { fa: 'مکعبی', en: 'Cubic' },
};

export function crystalSystemLabel(value: string | null): string | null {
  if (!value) return null;
  return CRYSTAL_SYSTEM_LABELS[value as CrystalSystem]?.fa ?? null;
}

/** The four classification axes, in the order the form and the specimen page show them. */
export const TAXONOMY_KINDS = [
  'mineral_family',
  'scientific_group',
  'specimen_type',
  'origin_kind',
] as const;

export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export const TAXONOMY_LABELS: Record<TaxonomyKind, { fa: string; hint: string }> = {
  mineral_family: {
    fa: 'خانوادهٔ کانی‌شناسی',
    hint: 'گونهٔ کانی که این نمونه به آن تعلق دارد؛ مستقل از تالاری که در آن نمایش داده می‌شود.',
  },
  scientific_group: {
    fa: 'گروه علمی',
    hint: 'ردهٔ شیمیایی یا ساختاری، مانند سیلیکات یا کربنات.',
  },
  specimen_type: {
    fa: 'نوع نمونه',
    hint: 'شکل فیزیکی نمونه در موزه: بلور، برش، گِیود، نمونهٔ خام.',
  },
  origin_kind: {
    fa: 'منشأ طبیعی',
    hint: 'معدنی یا آلی — اینکه ماده چگونه به وجود آمده است.',
  },
};

/** A specimen's editorial lifecycle, in the museum's words. */
export const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  scheduled: 'زمان‌بندی‌شده',
  published: 'منتشرشده',
  archived: 'بایگانی‌شده',
};

/** The Mohs scale, for the filter slider. */
export const MOHS_RANGE = { min: 1, max: 10 } as const;
