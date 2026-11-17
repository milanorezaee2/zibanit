/**
 * GEMORIA — Typography system, single source of truth.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * Fonts are a brand decision, not a component decision. Every component in the
 * museum uses one of three semantic roles and never names a typeface:
 *
 *   font-display  → Persian headings, specimen titles, section titles
 *   font-body     → Persian body copy, interface, tables, forms, numerals
 *   font-latin    → the GEMORIA wordmark and Latin display text
 *
 * Replacing a typeface therefore means editing this file plus
 * `src/app/fonts.ts` (which holds the literal `next/font/local` calls the
 * compiler can statically analyse). No component changes.
 *
 * ── Shipped files ──────────────────────────────────────────────────────────
 * The woff2 files in `src/fonts/` are self-hosted, offline, and version
 * controlled. Amiri/Noto/Vazirmatn/… "arabic" and "latin" subsets published by
 * Fontsource were merged per weight so that a single file covers Persian
 * letters, Persian and Arabic-Indic numerals, Arabic punctuation, Latin letters
 * and Latin punctuation («», —, %, parentheses). Without the merge, every «» in
 * a Persian sentence would silently fall back to a system font.
 * Merge recipe: `scripts/fonts/README.md`.
 *
 * Verification is executable, not aspirational: `tests/fonts.test.ts` parses
 * these files and asserts glyph coverage plus shaping integrity.
 */

export type FontRoleKey = 'display' | 'body' | 'latin';

export interface FontSource {
  /** File name inside `src/fonts/`. */
  readonly file: string;
  readonly weight: '400' | '500' | '600' | '700';
  readonly style: 'normal';
}

export interface FontRole {
  readonly key: FontRoleKey;
  /** Human-readable typeface name. */
  readonly family: string;
  /** Script / stylistic classification, used in documentation. */
  readonly classification: string;
  /**
   * CSS custom property that `next/font/local` writes the generated family
   * name into. Consumed by `@theme` in `src/app/globals.css`.
   */
  readonly cssVariable: string;
  /** Tailwind utility class components must use. */
  readonly utilityClass: 'font-display' | 'font-body' | 'font-latin';
  readonly sources: readonly FontSource[];
  /** Metric-compatible fallbacks while the webfont is loading. */
  readonly fallback: readonly string[];
  readonly display: 'swap' | 'optional';
  readonly preload: boolean;
  readonly adjustFontFallback: false | 'Arial' | 'Times New Roman';
  readonly license: string;
  /** Intended usage, enforced by review. */
  readonly allowedUsage: string;
}

const OFL = 'SIL Open Font License 1.1';

export const FONTS: Readonly<Record<FontRoleKey, FontRole>> = {
  display: {
    key: 'display',
    family: 'Noto Naskh Arabic',
    classification: 'Naskh — classical, high-contrast',
    cssVariable: '--font-gemoria-display',
    utilityClass: 'font-display',
    sources: [
      { file: 'noto-naskh-arabic-400.woff2', weight: '400', style: 'normal' },
      { file: 'noto-naskh-arabic-700.woff2', weight: '700', style: 'normal' },
    ],
    fallback: ['Noto Naskh Arabic', 'Times New Roman', 'serif'],
    display: 'swap',
    preload: true,
    adjustFontFallback: 'Times New Roman',
    license: OFL,
    allowedUsage:
      'Museum headings, specimen titles, section titles, editorial pull quotes. Never body copy.',
  },
  body: {
    key: 'body',
    family: 'Vazirmatn',
    classification: 'Humanist sans — Persian-first',
    cssVariable: '--font-gemoria-body',
    utilityClass: 'font-body',
    sources: [
      { file: 'vazirmatn-arabic-latin-400.woff2', weight: '400', style: 'normal' },
      { file: 'vazirmatn-arabic-latin-500.woff2', weight: '500', style: 'normal' },
      { file: 'vazirmatn-arabic-latin-700.woff2', weight: '700', style: 'normal' },
    ],
    fallback: ['Vazirmatn', 'Segoe UI', 'Tahoma', 'sans-serif'],
    display: 'swap',
    preload: true,
    adjustFontFallback: 'Arial',
    license: OFL,
    allowedUsage:
      'All Persian body copy, navigation, buttons, forms, tables, numerals and the administration interface.',
  },
  latin: {
    key: 'latin',
    family: 'Cormorant Garamond',
    classification: 'Didone-adjacent serif — Latin display',
    cssVariable: '--font-gemoria-latin',
    utilityClass: 'font-latin',
    sources: [{ file: 'cormorant-garamond-600.woff2', weight: '600', style: 'normal' }],
    fallback: ['Cormorant Garamond', 'Georgia', 'serif'],
    display: 'swap',
    preload: true,
    adjustFontFallback: 'Times New Roman',
    license: OFL,
    allowedUsage: 'The GEMORIA wordmark and short Latin display text. Never Persian text.',
  },
} as const;

export const FONT_ROLE_LIST: readonly FontRole[] = [FONTS.display, FONTS.body, FONTS.latin];

/** Every font file the museum ships. Used by asset tests and the build report. */
export const SHIPPED_FONT_FILES: readonly string[] = FONT_ROLE_LIST.flatMap((role) =>
  role.sources.map((source) => source.file),
);

/**
 * Characters the museum's typography must be able to render. Exercised by
 * `tests/fonts.test.ts` against the actual binary files.
 */
export const REQUIRED_GLYPH_SETS = {
  persianLetters: 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیء',
  arabicOnlyLetters: 'كيةأإؤئى',
  persianNumerals: '۰۱۲۳۴۵۶۷۸۹',
  arabicIndicNumerals: '٠١٢٣٤٥٦٧٨٩',
  arabicPunctuation: '،؛؟٪٫٬',
  latinPunctuation: '«»،.:;!?()[]—–/%&+•…',
  latinLetters: 'GEMORIA',
} as const;

/** Strings whose shaping must stay intact (joining forms, ZWNJ, bidi mixing). */
export const SHAPING_SAMPLES = {
  persianWord: 'زمرد',
  withZwnj: 'می‌سازد',
  withoutZwnj: 'میسازد',
  mixedDirection: 'گموریا GEMORIA ۱۴۰۴',
  numerals: '۲۴٫۱ قیراط',
  punctuation: '«زمرد»، سنگِ امپراتوری‌ها',
} as const;
