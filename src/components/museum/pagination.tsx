import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Server-side pagination.
 *
 * Links, not JavaScript: page 3 of a filtered collection is a real URL that can be
 * printed on a wall label, shared, refreshed and crawled. The current filters are
 * carried through by the caller, which builds the hrefs — so changing page never
 * loses a filter, and changing a filter never silently keeps a page number that no
 * longer exists (the action of the filter form points at page 1).
 *
 * The page numbers are rendered with Persian numerals, as everywhere else in the
 * interface, while the URL keeps ASCII digits.
 */
export interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a given page, preserving the current query. */
  hrefFor: (page: number) => string;
  className?: string;
}

const persian = (value: number): string => new Intl.NumberFormat('fa-IR').format(value);

/** A window of at most five page numbers, centred on the current page. */
function pageWindow(page: number, pageCount: number): number[] {
  const span = 5;
  let start = Math.max(1, page - Math.floor(span / 2));
  const end = Math.min(pageCount, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({ page, pageCount, hrefFor, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const base =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-vitrine border px-3 text-small transition-colors';

  return (
    <nav aria-label="صفحه‌بندی" className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={cn(base, 'border-white/12 text-sage-300 hover:border-gold-500/40 hover:text-gold-200')}
        >
          پیشین
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(base, 'border-white/[0.06] text-sage-700')}>
          پیشین
        </span>
      )}

      <ul className="flex items-center gap-2">
        {pageWindow(page, pageCount).map((number) => (
          <li key={number}>
            {number === page ? (
              <span
                aria-current="page"
                className={cn(base, 'border-gold-500/50 bg-gold-500/10 text-gold-200')}
              >
                {persian(number)}
              </span>
            ) : (
              <Link
                href={hrefFor(number)}
                className={cn(
                  base,
                  'border-white/12 text-sage-300 hover:border-gold-500/40 hover:text-gold-200',
                )}
                aria-label={`صفحهٔ ${persian(number)}`}
              >
                {persian(number)}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={cn(base, 'border-white/12 text-sage-300 hover:border-gold-500/40 hover:text-gold-200')}
        >
          بعدی
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(base, 'border-white/[0.06] text-sage-700')}>
          بعدی
        </span>
      )}
    </nav>
  );
}

/** «نمایش ۱–۱۲ از ۳۴ نمونه» — the context a page number cannot give. */
export function ResultSummary({
  total,
  page,
  pageSize,
  noun = 'نمونه',
}: {
  total: number;
  page: number;
  pageSize: number;
  noun?: string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <p className="text-small text-sage-500" aria-live="polite">
      نمایش {persian(from)}–{persian(to)} از {persian(total)} {noun}
    </p>
  );
}
