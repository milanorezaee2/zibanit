/**
 * GEMORIA — the specimen form's contract.
 *
 * One schema, used in three places: the Server Action that writes, the admin form
 * that renders errors, and the tests. A field that is not in this file is not
 * savable, which is what stops a hand-crafted POST from setting `status:
 * 'published'` on a record the form never offered.
 *
 * Validation rules worth stating:
 *
 *   • every scientific field is optional and empty means *absent*, never zero
 *   • a range is either complete or absent; a min without a max is a typo, not a
 *     measurement, and is rejected
 *   • units are part of the label (Mohs, g/cm³), so the number is validated
 *     against the physical range of that unit rather than against 0–100
 *   • Persian numerals are accepted on input and stored as ASCII digits
 */
import { z } from 'zod';
import { CRYSTAL_SYSTEMS } from '@/content/mineral';

const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

/** Persian/Arabic digits → ASCII, then trim. Empty string becomes undefined. */
function normalizeDigits(value: string): string {
  return value
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .trim();
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `حداکثر ${max} نویسه`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const optionalDecimal = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return '';
      return normalizeDigits(value);
    })
    .refine((value) => value === '' || /^\d+(\.\d{1,3})?$/.test(value), {
      message: `${label} باید یک عدد مثبت باشد (حداکثر سه رقم اعشار)`,
    })
    .refine(
      (value) => value === '' || (Number(value) >= min && Number(value) <= max),
      { message: `${label} باید بین ${min} و ${max} باشد` },
    )
    .transform((value) => (value === '' ? null : value));

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : null));

const optionalUuid = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length > 0 ? value.trim() : null))
  .refine((value) => value === null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value), {
    message: 'شناسهٔ نامعتبر',
  });

/** Comma-separated values, Persian comma included. Empty entries are dropped. */
const optionalList = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(/[،,]/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0 && entry.length <= max),
    );

export const provenanceSlotSchema = z.object({
  countryName: optionalText(80),
  countryCode: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim().toUpperCase() : null))
    .refine((value) => value === null || /^[A-Z]{2}$/.test(value), { message: 'کد کشور باید دو حرف لاتین باشد' }),
  region: optionalText(120),
  locality: optionalText(160),
  note: optionalText(400),
});

export const specimenFormSchema = z
  .object({
    inventoryNo: z
      .string()
      .trim()
      .min(2, 'شمارهٔ اموال باید حداقل دو نویسه باشد')
      .max(64, 'شمارهٔ اموال حداکثر ۶۴ نویسه است'),

    /* ── 1. General ──────────────────────────────────────────────────────── */
    slug: z
      .string()
      .trim()
      .min(2, 'نشانی یکتا لازم است')
      .max(120, 'نشانی یکتا حداکثر ۱۲۰ نویسه است')
      .regex(SLUG_PATTERN, 'نشانی یکتا فقط می‌تواند شامل حروف، ارقام و خط تیره باشد'),
    title: z.string().trim().min(2, 'نام فارسی لازم است').max(160, 'نام حداکثر ۱۶۰ نویسه است'),
    subtitle: optionalText(160),
    scientificName: optionalText(160),

    /* ── 2. Descriptions ─────────────────────────────────────────────────── */
    summary: optionalText(400),
    story: optionalText(8_000),
    formation: optionalText(8_000),
    history: optionalText(8_000),
    notes: optionalText(4_000),

    /* ── 3. Scientific record ────────────────────────────────────────────── */
    chemicalFormula: optionalText(160),
    crystalSystem: z
      .string()
      .optional()
      .transform((value) => (value && value.trim().length > 0 ? value.trim() : null))
      .refine(
        (value) => value === null || (CRYSTAL_SYSTEMS as readonly string[]).includes(value),
        { message: 'سیستم بلوری نامعتبر است' },
      ),
    mohsMin: optionalDecimal(0, 10, 'سختی موس'),
    mohsMax: optionalDecimal(0, 10, 'سختی موس'),
    densityMin: optionalDecimal(0, 30, 'چگالی'),
    densityMax: optionalDecimal(0, 30, 'چگالی'),
    refractiveIndexMin: optionalDecimal(1, 4, 'ضریب شکست'),
    refractiveIndexMax: optionalDecimal(1, 4, 'ضریب شکست'),
    colors: optionalList(40),
    transparency: optionalList(40),
    luster: optionalText(80),
    cleavage: optionalText(120),
    fracture: optionalText(120),

    /* ── 4. Classification ───────────────────────────────────────────────── */
    mineralFamilyId: optionalUuid,
    scientificGroupId: optionalUuid,
    specimenTypeId: optionalUuid,
    originKindId: optionalUuid,
    halls: z.array(z.string().trim().min(1)).max(12).default([]),

    /* ── 5. Geography ────────────────────────────────────────────────────── */
    provenances: z.array(provenanceSlotSchema).default([]),

    /* ── 6. Media ────────────────────────────────────────────────────────── */
    primaryMediaId: optionalUuid,
    galleryMediaIds: z.array(z.string().trim().min(1)).max(24).default([]),

    /* ── 7. SEO ──────────────────────────────────────────────────────────── */
    seoTitle: optionalText(160),
    seoDescription: optionalText(320),

    /* ── 8. Publication ──────────────────────────────────────────────────── */
    weightCt: optionalDecimal(0, 100_000, 'وزن'),
    dimensionsMm: optionalText(80),
    pieces: z
      .string()
      .optional()
      .transform((value) => Number(normalizeDigits(value ?? '1') || '1'))
      .refine((value) => Number.isInteger(value) && value >= 1 && value <= 9_999, {
        message: 'تعداد قطعات باید عددی بین ۱ و ۹۹۹۹ باشد',
      }),
    acquiredAt: optionalDate,
    certificateRef: optionalText(120),
    isFeatured: z.coerce.boolean().default(false),
    isHighlight: z.coerce.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    const ranges: Array<[string, string | null, string | null, string]> = [
      ['mohs', value.mohsMin, value.mohsMax, 'سختی موس'],
      ['density', value.densityMin, value.densityMax, 'چگالی'],
      ['ri', value.refractiveIndexMin, value.refractiveIndexMax, 'ضریب شکست'],
    ];

    for (const [field, min, max, label] of ranges) {
      if ((min === null) !== (max === null)) {
        ctx.addIssue({
          code: 'custom',
          path: [field === 'mohs' ? 'mohsMin' : field === 'density' ? 'densityMin' : 'refractiveIndexMin'],
          message: `${label} باید هم کمینه و هم بیشینه داشته باشد`,
        });
      } else if (min !== null && max !== null && Number(max) < Number(min)) {
        ctx.addIssue({
          code: 'custom',
          path: [field === 'mohs' ? 'mohsMax' : field === 'density' ? 'densityMax' : 'refractiveIndexMax'],
          message: `بیشینهٔ ${label} نمی‌تواند کمتر از کمینه باشد`,
        });
      }
    }
  });

export type SpecimenFormValues = z.infer<typeof specimenFormSchema>;

/** `{ "slug": "..." }` for the form, and a Persian message for the alert. */
export interface FormState {
  readonly status: 'idle' | 'error' | 'saved';
  readonly message?: string;
  readonly fieldErrors?: Record<string, string>;
  readonly values?: Record<string, string>;
}

/** Flattens Zod issues into one message per field, first issue wins. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
