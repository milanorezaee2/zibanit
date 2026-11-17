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

const labelClass = 'mb-2 block text-[11.5px] text-sage-500';
const controlClass =
  'h-10 w-full rounded-vitrine border border-white/12 bg-obsidian-900/70 px-3 text-small text-ivory-200 ' +
  'transition-colors hover:border-white/20 focus:border-gold-400/70 focus:outline-none focus:ring-2 focus:ring-gold-400/25';

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
    <form action={action} method="get" className="border-y border-white/[0.07] py-6" role="search">
      {Object.entries(preserved).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          {debounce ? (
            <DebouncedSearchField
              id="filter-q"
              name="q"
              label="جست‌وجو در نام، خانواده، فرمول یا خاستگاه"
              placeholder="مثلاً: زمرد، Beryl، کلمبیا"
              defaultValue={current.q ?? ''}
            />
          ) : (
            <>
              <label htmlFor="filter-q" className={labelClass}>
                جست‌وجو در نام، خانواده، فرمول یا خاستگاه
              </label>
              <input
                id="filter-q"
                name="q"
                type="search"
                defaultValue={current.q ?? ''}
                placeholder="مثلاً: زمرد، Beryl، کلمبیا"
                className={cn(controlClass, 'h-11')}
                autoComplete="off"
              />
            </>
          )}
        </div>

        {!hideHall && (
          <div>
            <label htmlFor="filter-hall" className={labelClass}>
              تالار
            </label>
            <select id="filter-hall" name="hall" defaultValue={current.hall ?? ''} className={controlClass}>
              <option value="">همهٔ تالارها</option>
              {options.halls.map((hall) => (
                <option key={hall.code} value={hall.code}>
                  {hall.title} ({hall.total})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="filter-family" className={labelClass}>
            خانوادهٔ کانی‌شناسی
          </label>
          <select
            id="filter-family"
            name="family"
            defaultValue={current.family ?? ''}
            className={controlClass}
          >
            <option value="">همه</option>
            {options.families.map((family) => (
              <option key={family.code} value={family.code}>
                {family.label} ({family.total})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-color" className={labelClass}>
            رنگ
          </label>
          <select id="filter-color" name="color" defaultValue={current.color ?? ''} className={controlClass}>
            <option value="">همه</option>
            {options.colors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.value} ({color.total})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-transparency" className={labelClass}>
            شفافیت
          </label>
          <select
            id="filter-transparency"
            name="transparency"
            defaultValue={current.transparency ?? ''}
            className={controlClass}
          >
            <option value="">همه</option>
            {options.transparency.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.value} ({entry.total})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-country" className={labelClass}>
            خاستگاه جغرافیایی
          </label>
          <select
            id="filter-country"
            name="country"
            defaultValue={current.country ?? ''}
            className={controlClass}
          >
            <option value="">همه</option>
            {options.countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.total})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-hardness" className={labelClass}>
            سختی موس
          </label>
          <select
            id="filter-hardness"
            name="hardness"
            defaultValue={current.hardness !== null && current.hardness !== undefined ? String(current.hardness) : ''}
            className={controlClass}
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
        </div>

        <div>
          <label htmlFor="filter-media" className={labelClass}>
            رسانهٔ موجود
          </label>
          <select id="filter-media" name="media" defaultValue={current.media ?? ''} className={controlClass}>
            <option value="">هر رسانه‌ای</option>
            <option value="image">تصویر</option>
            <option value="video">ویدئو</option>
            <option value="model">مدل سه‌بعدی</option>
            <option value="panorama">نمای ۳۶۰ درجه</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort" className={labelClass}>
            مرتب‌سازی
          </label>
          <select id="filter-sort" name="sort" defaultValue={current.sort ?? 'newest'} className={controlClass}>
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="title-fa">نام فارسی</option>
            <option value="title-en">نام انگلیسی</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center rounded-vitrine bg-gold-500 px-6 text-small font-medium text-obsidian-950 transition-colors hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/60"
        >
          اعمال فیلترها
        </button>

        {hasFilters && (
          <Link
            href={clearHref}
            className="text-small text-sage-400 underline decoration-sage-600/40 underline-offset-4 transition-colors hover:text-gold-200"
          >
            پاک کردن فیلترها
          </Link>
        )}

        <p className="ms-auto text-[11.5px] text-sage-600" aria-live="polite">
          فیلترها در نشانی صفحه ذخیره می‌شوند و قابل اشتراک‌گذاری‌اند.
        </p>
      </div>
    </form>
  );
}
