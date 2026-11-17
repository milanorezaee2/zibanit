/**
 * GEMORIA — Persian text normalisation.
 *
 * A Persian visitor types what a Persian keyboard produces. A curator types what
 * their editor produces. The two are frequently not the same bytes:
 *
 *   ي (U+064A Arabic yeh)      vs ی (U+06CC Persian yeh)
 *   ك (U+0643 Arabic kaf)      vs ک (U+06A9 Persian keheh)
 *   نیمه‌قیمتی (with ZWNJ)     vs نیمهقیمتی (without)
 *   ۱۴۰۴ (Persian digits)      vs 1404
 *
 * Without normalisation «یاقوت» typed on an Arabic keyboard finds nothing, and
 * «نیمه‌قیمتی» typed without the half-space finds nothing either. So one function
 * normalises *both* the stored text and the query, and it is the only place the
 * rules live.
 *
 * The rules are deliberately conservative — they fold orthographic variation and
 * nothing else. They never delete a letter, never transliterate, never stem.
 */

/** Arabic → Persian letter folding, applied to both sides of every comparison. */
const LETTER_FOLDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\u064A/g, '\u06CC'], // ي → ی
  [/\u0649/g, '\u06CC'], // ى → ی
  [/\u0643/g, '\u06A9'], // ك → ک
  [/\u06C0/g, '\u0647\u0654'], // ۀ → هٔ
  [/\u0629/g, '\u0647'], // ة → ه
  [/\u06C1/g, '\u0647'], // ہ → ه
  [/\u0640/g, ''], // tatweel: a stretching artefact, never semantic
];

/**
 * Diacritics (harakat) and the superscript alef. Removed because a search box is
 * not a typesetter: «مُروارید» and «مروارید» are the same object.
 */
const DIACRITICS = /[\u064B-\u0652\u0653-\u0655\u0670\u06D6-\u06ED]/g;

/** Zero-width characters: ZWNJ (نیم‌فاصله), ZWJ, and BOM. */
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

/** Persian (۰-۹) and Arabic-Indic (٠-٩) digits → ASCII digits. */
const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;
const ARABIC_DIGITS = /[\u0660-\u0669]/g;

function foldDigits(value: string): string {
  return value
    .replace(PERSIAN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(ARABIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

/**
 * The canonical form used for storage, comparison and full-text indexing.
 *
 * Order matters: fold letters first (so `ك` becomes `ک` before anything else
 * looks at it), then strip, then fold digits, then collapse whitespace.
 */
export function normalizePersian(input: string): string {
  let value = input.normalize('NFKC');

  for (const [pattern, replacement] of LETTER_FOLDS) {
    value = value.replace(pattern, replacement);
  }

  value = value
    .replace(DIACRITICS, '')
    .replace(ZERO_WIDTH, '')
    // A hyphen between Persian words is orthographic noise in a search index;
    // it is kept in the display title, not in the searchable form.
    .replace(/\u2010|\u2011|\u2012|\u2013|\u2014/g, ' ')
    .replace(/[_/\\|]+/g, ' ');

  value = foldDigits(value).toLocaleLowerCase('en-US');

  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Turns a free-text query into something safe to hand to `plainto_tsquery`.
 *
 * `plainto_tsquery` already neutralises operators, but it treats a bare `&`, `|`,
 * `!`, `:` and parentheses as syntax in `to_tsquery`; normalising punctuation to
 * spaces means the museum never depends on which of the two is used.
 */
export function normalizeQuery(raw: string): string {
  return normalizePersian(raw)
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Persian alphabetical order ───────────────────────────────────────────────
   `ORDER BY title` uses the cluster's collation. On the C.UTF-8 cluster this
   project is required to run for Persian tokenisation, that is code-point order,
   in which «آب» comes after «یاقوت». Rather than require an ICU locale the
   deployment may not have, the museum materialises a sort key: each letter is
   replaced by its position in the Persian alphabet. The result is a plain text
   column that sorts correctly under *any* collation, identically on PGlite and
   PostgreSQL, with a B-tree index on it. */

const PERSIAN_ALPHABET = 'آاءأإبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی';

/** Letters sharing a shape sort together: آ/ا first, then ب, and so on. */
const ALPHABET_FOLD: Record<string, string> = {
  '\u0622': 'ا',
  '\u0623': 'ا',
  '\u0625': 'ا',
  '\u0621': 'ا',
  '\u0624': 'و',
  '\u0626': 'ی',
};

/**
 * A sortable key in Persian alphabetical order.
 *
 * Persian letters become two-digit codes `01`–`33`; everything else (Latin,
 * digits, punctuation) is pushed into a later bucket so that, for example, a
 * Latin scientific name sorts after every Persian title. The key is capped at 48
 * characters: a museum title longer than that is already being read, not sorted.
 */
export function persianSortKey(input: string): string {
  const normalized = normalizePersian(input).replace(/\s+/g, '');
  const codes: string[] = [];

  for (const character of Array.from(normalized).slice(0, 48)) {
    const folded = ALPHABET_FOLD[character] ?? character;
    const index = PERSIAN_ALPHABET.indexOf(folded);

    if (index >= 0) {
      codes.push(String(index + 1).padStart(2, '0'));
    } else if (/[0-9]/.test(character)) {
      codes.push(`8${character}`);
    } else {
      codes.push(`9${String(character.codePointAt(0) ?? 0).padStart(6, '0')}`);
    }
  }

  return codes.join('');
}

/* ── Search documents ────────────────────────────────────────────────────────
   `search_text` is what `search_tsv` is generated from, so it has to contain
   every field a visitor might search by — not just the title. It is composed at
   write time by `recomputeSpecimenSearchText()`, which reads the specimen, its
   translation, its classification and its provenance in one place. */

export interface SearchTextFields {
  readonly title?: string | null;
  readonly subtitle?: string | null;
  readonly scientificName?: string | null;
  readonly chemicalFormula?: string | null;
  readonly slug?: string | null;
  readonly summary?: string | null;
  readonly colors?: readonly string[] | null;
  readonly labels?: readonly (string | null | undefined)[];
  readonly localities?: readonly (string | null | undefined)[];
}

/**
 * Builds the indexable document for one translated specimen.
 *
 * Slugs are split on hyphens so that `/specimens/emerald-muzo` is findable by
 * typing «emerald» or «muzo», and the Persian slug («زمرد-موزو») by typing either
 * word. Duplicate words are removed to keep the tsvector small.
 */
export function buildSearchText(fields: SearchTextFields): string {
  const parts: string[] = [
    fields.title,
    fields.subtitle,
    fields.scientificName,
    fields.chemicalFormula,
    fields.slug?.replace(/[-_/]+/g, ' '),
    fields.summary,
    ...(fields.colors ?? []),
    ...(fields.labels ?? []),
    ...(fields.localities ?? []),
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  const normalized = normalizePersian(parts.join(' '));
  const seen = new Set<string>();

  return normalized
    .split(' ')
    .filter((word) => {
      if (word.length === 0 || seen.has(word)) return false;
      seen.add(word);
      return true;
    })
    .join(' ');
}
