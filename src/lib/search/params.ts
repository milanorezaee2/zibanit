/**
 * GEMORIA — the query string contract.
 *
 * A visitor's URL is untrusted input. It is parsed here, once, into a typed
 * `SpecimenQuery`, and every field falls back rather than failing: a museum page
 * must not throw a 500 because someone typed `?hardness=banana`. Invalid values are
 * dropped (the filter behaves as if it were absent) and every value that survives
 * reaches SQL as a bound parameter.
 *
 * The same parser serves `/search` and `/halls/[slug]`, so a filter means exactly
 * the same thing in both places and the URLs are interchangeable.
 */
import { z } from 'zod';
import type { MediaFilter, SortKey, SpecimenQuery } from '@/db/queries/specimens';

const SORTS = ['newest', 'oldest', 'title-fa', 'title-en'] as const satisfies readonly SortKey[];
const MEDIA = ['image', 'video', 'model', 'panorama'] as const satisfies readonly MediaFilter[];

/** Trim, collapse whitespace and cap length. Returns undefined when empty. */
function text(max: number) {
  return z
    .string()
    .transform((value) => value.replace(/[\u0000-\u0020]+/g, ' ').trim())
    .refine((value) => value.length <= max, { message: 'too long' })
    .transform((value) => (value.length === 0 ? undefined : value))
    .catch(undefined);
}

/**
 * `z.coerce.number().catch(undefined)` looks like the obvious spelling and is not
 * allowed by Zod 4 (a catch value must have the schema's output type). Parsing the
 * string explicitly is also more honest about what is validated: anything that is
 * not an integer in range is *dropped*, not defaulted to a number the visitor never
 * asked for.
 */
const optionalInteger = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < min || parsed > max) return undefined;
      return parsed;
    });

const optionalEnum = <T extends string>(values: readonly T[]) =>
  z
    .string()
    .optional()
    .transform((value) => (value && (values as readonly string[]).includes(value) ? (value as T) : undefined));

const rawParamsSchema = z.object({
  q: text(120),
  hall: text(64),
  family: text(64),
  color: text(40),
  transparency: text(40),
  country: text(80),
  hardness: optionalInteger(1, 10),
  media: optionalEnum(MEDIA),
  sort: optionalEnum(SORTS),
  page: optionalInteger(1, 10_000),
});

export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function flatten(raw: RawSearchParams): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const key of Object.keys(rawParamsSchema.shape)) {
    result[key] = firstValue(raw[key]);
  }
  return result;
}

export function parseSpecimenSearchParams(raw: RawSearchParams): SpecimenQuery {
  const parsed = rawParamsSchema.parse(flatten(raw));

  return {
    q: parsed.q ?? null,
    hall: parsed.hall ?? null,
    family: parsed.family ?? null,
    color: parsed.color ?? null,
    transparency: parsed.transparency ?? null,
    country: parsed.country ?? null,
    hardness: parsed.hardness ?? null,
    media: (parsed.media as MediaFilter | undefined) ?? null,
    sort: (parsed.sort as SortKey | undefined) ?? 'newest',
    page: parsed.page ?? 1,
  };
}

/** Rebuilds a query string from a partial change, dropping empty values. */
export function buildQueryString(
  base: Record<string, string | number | null | undefined>,
  overrides: Record<string, string | number | null | undefined> = {},
): string {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value === null || value === undefined || value === '') continue;
    // `page=1` is the default; keeping it in the URL would make every filter link
    // look different from the page it lands on.
    if (key === 'page' && Number(value) === 1) continue;
    params.set(key, String(value));
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : '';
}

/** True when anything other than paging/sorting narrows the collection. */
export function hasActiveFilters(query: SpecimenQuery): boolean {
  return Boolean(
    query.q || query.hall || query.family || query.color || query.transparency || query.country || query.media || query.hardness,
  );
}
