import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getFilterOptions, listSpecimens } from '@/db/queries/specimens';
import { CollectionControls } from '@/components/museum/collection-controls';
import { Pagination, ResultSummary } from '@/components/museum/pagination';
import { SpecimenCard } from '@/components/museum/specimen-card';
import { EmptyState } from '@/components/museum/empty-state';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { parseSpecimenSearchParams, buildQueryString, hasActiveFilters, type RawSearchParams } from '@/lib/search/params';
import { normalizeQuery } from '@/lib/search/normalize';

export const metadata: Metadata = {
  title: 'جست‌وجو در مجموعه',
  description:
    'جست‌وجو در مجموعهٔ موزهٔ گموریا بر پایهٔ نام فارسی، نام علمی، خانوادهٔ کانی‌شناسی، فرمول شیمیایی و خاستگاه جغرافیایی.',
  // A search result page is not a document: it must not compete with the objects
  // themselves in an index, and every filtered variant would be a duplicate.
  robots: { index: false, follow: true },
};

/**
 * Search.
 *
 * Everything happens on the server: the query string is parsed into filters, the
 * database is asked once per page, and the result is HTML. No result set is ever
 * shipped to the client to be filtered there, which means the page works without
 * JavaScript, cannot leak unpublished rows through a client cache, and stays the
 * same size whether the collection holds ten objects or ten thousand.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await connection();

  const raw = await searchParams;
  const query = parseSpecimenSearchParams(raw);

  const [options, results] = await Promise.all([getFilterOptions(), listSpecimens(query)]);

  const active = hasActiveFilters(query);
  const normalized = query.q ? normalizeQuery(query.q) : '';

  const queryBase = {
    q: query.q,
    hall: query.hall,
    family: query.family,
    color: query.color,
    transparency: query.transparency,
    country: query.country,
    hardness: query.hardness,
    media: query.media,
    sort: query.sort,
  };

  const hrefForPage = (page: number) => `/search${buildQueryString(queryBase, { page })}`;
  const persian = (value: number) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

  return (
    <div className="pt-[calc(var(--header-height)+3.5rem)] pb-section">
      <Container width="museum">
        <header className="mb-10 max-w-reading">
          <p className="mb-5 flex items-center gap-3">
            <span className="label-fa">جست‌وجو</span>
            <span className="gold-rule w-10" aria-hidden="true" />
          </p>
          <h1 className="font-display text-title text-ivory-100">کاوش در مجموعه</h1>
          <p className="mt-5 text-body text-sage-400">
            جست‌وجو روی نام فارسی، نام علمی، خانوادهٔ کانی‌شناسی، فرمول شیمیایی و خاستگاه
            جغرافیایی انجام می‌شود. حروف عربی و فارسی، نیم‌فاصله و اعداد فارسی پیش از
            جست‌وجو یکسان‌سازی می‌شوند.
          </p>
        </header>

        <CollectionControls action="/search" options={options} current={query} debounce />

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-subtitle text-ivory-100">
            {normalized ? `نتایج برای «${query.q}»` : 'همهٔ نمونه‌های منتشرشده'}
          </h2>
          {results.state !== 'unavailable' && (
            <ResultSummary total={results.total} page={results.page} pageSize={results.pageSize} />
          )}
        </div>

        {results.state === 'unavailable' ? (
          <div className="mt-8">
            <EmptyState
              title="جست‌وجو در این لحظه ممکن نیست"
              description="ارتباط موزه با مخزن نمونه‌ها برقرار نشد. صفحه باز است، اما نتیجه‌ای تا بازگشت مخزن نمایش داده نمی‌شود."
              note="وضعیت سامانه در نشانی /api/health گزارش می‌شود."
            />
          </div>
        ) : results.total === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={active ? 'نمونه‌ای با این مشخصات یافت نشد' : 'مجموعه هنوز منتشر نشده است'}
              description={
                active
                  ? 'هیچ نمونه‌ای همهٔ شرط‌های انتخابی را هم‌زمان ندارد. می‌توانید فیلترها را پاک کنید یا نام دیگری را بیازمایید.'
                  : 'مجموعهٔ موزه در حال آماده‌سازی است. نمونه‌ها پس از ثبت، بررسی و انتشار در پنل مدیریت در همین صفحه قابل جست‌وجو می‌شوند.'
              }
              note="هیچ نمونهٔ نمایشی یا ساختگی در موزه منتشر نمی‌شود."
              action={
                active ? (
                  <ButtonLink href="/search" variant="outline" size="sm">
                    پاک کردن فیلترها
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/halls" variant="outline" size="sm">
                    دیدن تالارهای موزه
                  </ButtonLink>
                )
              }
            />
          </div>
        ) : (
          <>
            <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {results.items.map((specimen, index) => (
                <li key={specimen.id}>
                  <SpecimenCard specimen={specimen} priority={index === 0} />
                </li>
              ))}
            </ul>

            <Pagination
              page={results.page}
              pageCount={results.pageCount}
              hrefFor={hrefForPage}
              className="mt-14"
            />

            <p className="mt-6 text-center text-[11.5px] text-sage-600">
              {persian(results.total)} نمونه در {persian(results.pageCount)} صفحه — هر صفحه
              {persian(results.pageSize)} نمونه.
            </p>
          </>
        )}
      </Container>
    </div>
  );
}
