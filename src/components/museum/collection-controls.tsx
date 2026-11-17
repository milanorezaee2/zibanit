import Link from 'next/link';
import type { FilterOptions, SpecimenQuery } from '@/db/queries/specimens';
import { MOHS_RANGE } from '@/content/mineral';
import { cn } from '@/lib/cn';
import { DebouncedSearchField } from './debounced-search';

/**
 * Filtering and sorting, as a plain HTML form.
 *
 * No JavaScript is required to filter the collection: the form is a `GET` to the
 * same page, the values become the query string, and the result is shareable,
 * bookmarkable and reachable with the back button. That is also what makes the
 * state trivially preservable across pages — the URL *is* the state.
 *
 * Recomposed for the 1B visual pass: eight bordered boxes stacked in a grid became
 * one toolbar — a wide search field, a row of compact selects, and the action at the
 * end of the row. Each control keeps a real label (visually hidden) and a
 * self-describing default ("همهٔ رنگها", "هر سختی"), so the row stays legible
 * without eight visible captions above it.
 *
 * Only options that exist in the collection are offered, so a visitor cannot apply
 * a filter that is guaranteed to return nothing.
 */
export interface CollectionControlsProps {
  action: string;
  options: FilterOptions;
  current: SpecimenQuery;
  /** The hall's own filter is implied by the page, so it is not offered again. */
  hideHall?: boolean;
  /** Preserved as hidden inputs when the form is submitted. */
  preserved?: Record<string, string>;
  /** Applies the 450ms debounce to the text field. Used on /search. */
  debounce?: boolean;
}

const controlClass =
  'h-10 w-full appearance-none rounded-full border border-line-strong bg-paper-raised ps-4 pe-8 text-[0.82rem] text-ink-muted ' +
  'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\'%3E%3Cpath d=\'M1 1l4 4 4-4\' stroke=\'%235e645a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E")] ' +
  'bg-[length:10px_6px] bg-[position:left_0.9rem_center] bg-no-repeat ' +
  'transition-colors hover:border-line-strong focus:border-gold-400/70 focus:outline-none focus:ring-2 focus:ring-gold-400/20';

const srLabel = 'sr-only';

export function CollectionControls({
  action,
  options,
  current,
  hideHall = false,
  preserved = {},
  debounce = false,
}: CollectionControlsProps) {
  const hasFilters =
    Boolean(current.q) ||
    Boolean(current.family) ||
    Boolean(current.color) ||
    Boolean(current.transparency) ||
    Boolean(current.country) ||
    Boolean(current.media) ||
    Boolean(current.hardness);

  const clearHref = action;

  return (
    <form
      action={action}
      method="get"
      className="border-y border-line py-5"
      role="search"
    >
      {Object.entries(preserved).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-[22rem] lg:shrink-0">
          {debounce ? (
            <DebouncedSearchField
              id="filter-q"
              name="q"
              label="جست‌وجو در نام، خانواده، فرمول یا خاستگاه"
              placeholder="جست‌وجو: زمرد، Beryl، کلمبیا…"
              defaultValue={current.q ?? ''}
            />
          ) : (
            <>
              <label htmlFor="filter-q" className={srLabel}>
                جست‌وجو در نام، خانواده، فرمول یا خاستگاه
              </label>
              <input
                id="filter-q"
                name="q"
                type="search"
                defaultValue={current.q ?? ''}
                placeholder="جست‌وجو: زمرد، Beryl، کلمبیا…"
                className={cn(
                  controlClass,
                  'h-11 ps-4 pe-4 text-[0.9rem] lg:w-full',
                )}
                autoComplete="off"
              />
            </>
          )}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {!hideHall && (
            <>
              <label htmlFor="filter-hall" className={srLabel}>
                تالار
              </label>
              <select
                id="filter-hall"
                name="hall"
                defaultValue={current.hall ?? ''}
                className={cn(controlClass, 'max-w-[11rem]')}
              >
                <option value="">همهٔ تالارها</option>
                {options.halls.map((hall) => (
                  <option key={hall.code} value={hall.code}>
                    {hall.title} ({hall.total})
                  </option>
                ))}
              </select>
            </>
          )}

          <label htmlFor="filter-family" className={srLabel}>
            خانوادهٔ کانی‌شناسی
          </label>
          <select
            id="filter-family"
            name="family"
            defaultValue={current.family ?? ''}
            className={cn(controlClass, 'max-w-[12rem]')}
          >
            <option value="">همهٔ خانواده‌ها</option>
            {options.families.map((family) => (
              <option key={family.code} value={family.code}>
                {family.label} ({family.total})
              </option>
            ))}
          </select>

          <label htmlFor="filter-color" className={srLabel}>
            رنگ
          </label>
          <select
            id="filter-color"
            name="color"
            defaultValue={current.color ?? ''}
            className={cn(controlClass, 'max-w-[9.5rem]')}
          >
            <option value="">همهٔ رنگ‌ها</option>
            {options.colors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.value} ({color.total})
              </option>
            ))}
          </select>

          <label htmlFor="filter-transparency" className={srLabel}>
            شفافیت
          </label>
          <select
            id="filter-transparency"
            name="transparency"
            defaultValue={current.transparency ?? ''}
            className={cn(controlClass, 'max-w-[9.5rem]')}
          >
            <option value="">هر شفافیتی</option>
            {options.transparency.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.value} ({entry.total})
              </option>
            ))}
          </select>

          <label htmlFor="filter-country" className={srLabel}>
            خاستگاه جغرافیایی
          </label>
          <select
            id="filter-country"
            name="country"
            defaultValue={current.country ?? ''}
            className={cn(controlClass, 'max-w-[11rem]')}
          >
            <option value="">همهٔ خاستگاه‌ها</option>
            {options.countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.total})
              </option>
            ))}
          </select>

          <label htmlFor="filter-hardness" className={srLabel}>
            سختی موس
          </label>
          <select
            id="filter-hardness"
            name="hardness"
            defaultValue={
              current.hardness !== null && current.hardness !== undefined
                ? String(current.hardness)
                : ''
            }
            className={cn(controlClass, 'max-w-[8.5rem]')}
          >
            <option value="">هر سختی</option>
            {Array.from(
              { length: MOHS_RANGE.max - MOHS_RANGE.min + 1 },
              (_, index) => MOHS_RANGE.min + index,
            ).map((value) => (
              <option key={value} value={value}>
                {new Intl.NumberFormat('fa-IR').format(value)}
              </option>
            ))}
          </select>

          <label htmlFor="filter-media" className={srLabel}>
            رسانهٔ موجود
          </label>
          <select
            id="filter-media"
            name="media"
            defaultValue={current.media ?? ''}
            className={cn(controlClass, 'max-w-[9.5rem]')}
          >
            <option value="">هر رسانه‌ای</option>
            <option value="image">تصویر</option>
            <option value="video">ویدئو</option>
            <option value="model">مدل سه‌بعدی</option>
            <option value="panorama">نمای ۳۶۰ درجه</option>
          </select>

          <label htmlFor="filter-sort" className={srLabel}>
            مرتب‌سازی
          </label>
          <select
            id="filter-sort"
            name="sort"
            defaultValue={current.sort ?? 'newest'}
            className={cn(controlClass, 'max-w-[9.5rem]')}
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="title-fa">نام فارسی</option>
            <option value="title-en">نام انگلیسی</option>
          </select>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-full bg-gold-500 px-6 text-[0.82rem] font-medium text-obsidian-950 transition-colors hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/60"
          >
            اعمال
          </button>

          {hasFilters && (
            <Link
              href={clearHref}
              className="whitespace-nowrap text-[0.8rem] text-ink-subtle underline decoration-sage-600/40 underline-offset-4 transition-colors hover:text-accent"
            >
              پاک کردن
            </Link>
          )}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-ink-subtle" aria-live="polite">
        فیلترها در نشانی صفحه ذخیره می‌شوند و قابل اشتراک‌گذاری‌اند.
      </p>
    </form>
  );
}
