import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getHallBySlug, getOtherHalls } from '@/db/queries/halls';
import { getFilterOptions, listHallSpecimens } from '@/db/queries/specimens';
import { MuseumImage } from '@/components/museum/museum-image';
import { SpecimenCard } from '@/components/museum/specimen-card';
import { EmptyState } from '@/components/museum/empty-state';
import { CollectionControls } from '@/components/museum/collection-controls';
import { Pagination, ResultSummary } from '@/components/museum/pagination';
import { Breadcrumbs } from '@/components/museum/breadcrumbs';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { parseSpecimenSearchParams, buildQueryString, type RawSearchParams } from '@/lib/search/params';

/**
 * A single hall.
 *
 * The hall's own page is where the museum moves from describing a collection to
 * showing it: the intro and catalogue text sit above, and the objects hang below
 * with the same filters, sorting and pagination the search page offers. Only
 * published objects appear — a draft is invisible here exactly as it is on the
 * homepage, and the hall reports how many objects it actually holds.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hall = await getHallBySlug(slug);

  if (!hall) {
    return { title: 'تالار یافت نشد', robots: { index: false, follow: false } };
  }

  const description = hall.description ?? hall.summary;

  return {
    title: `${hall.title} — تالارها`,
    description: hall.summary,
    alternates: { canonical: `/halls/${encodeURIComponent(hall.slug)}` },
    openGraph: {
      type: 'website',
      title: `${hall.title} — موزهٔ گموریا`,
      description,
      ...(hall.image
        ? {
            images: [
              { url: hall.image.src, width: hall.image.width, height: hall.image.height, alt: hall.imageAlt },
            ],
          }
        : {}),
    },
  };
}

export default async function HallPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  await connection();

  const { slug } = await params;
  const hall = await getHallBySlug(slug);
  if (!hall) notFound();

  const raw = await searchParams;
  const query = parseSpecimenSearchParams(raw);

  const [options, specimens, relatedHalls] = await Promise.all([
    getFilterOptions(),
    listHallSpecimens(hall.code, query),
    getOtherHalls(hall.code, 3),
  ]);

  const persian = (value: number) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

  const queryBase = {
    q: query.q,
    family: query.family,
    color: query.color,
    transparency: query.transparency,
    country: query.country,
    hardness: query.hardness,
    media: query.media,
    sort: query.sort,
  };

  const hrefForPage = (page: number) =>
    `/halls/${encodeURIComponent(hall.slug)}${buildQueryString(queryBase, { page })}`;

  return (
    <article className="pb-section">
      {/* ── 1 & 2. The hall's own hero ─────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden pt-[var(--header-height)]">
        <div className="absolute inset-0 -z-10">
          <MuseumImage
            image={hall.heroImage}
            alt={hall.imageAlt}
            sizes="100vw"
            ratio="free"
            priority
            className="h-full w-full"
            fallback={<div className="h-full w-full bg-emerald-950" />}
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,14,12,0.97),rgba(11,14,12,0.72)_45%,rgba(11,14,12,0.45))]"
            aria-hidden="true"
          />
        </div>

        <Container width="museum" className="pb-14 pt-10 sm:pb-20">
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: 'تالارها', href: '/halls' },
              { label: hall.title },
            ]}
          />

          <div className="mt-10 max-w-reading">
            <p
              dir="ltr"
              className="font-latin text-[0.78rem] tracking-[0.26em] text-gold-300/90 uppercase"
            >
              {hall.latinName}
            </p>
            <h1 className="mt-4 font-display text-title text-ivory-50">{hall.title}</h1>
            <p className="mt-6 max-w-reading text-lead text-ivory-200/90">{hall.summary}</p>
            <p className="mt-6 text-small text-ivory-300/70">
              {hall.specimenCount > 0
                ? `${persian(hall.specimenCount)} نمونهٔ منتشرشده در این تالار`
                : 'این تالار هنوز نمونهٔ منتشرشده‌ای ندارد'}
            </p>
          </div>
        </Container>
      </header>

      {/* ── 3. The catalogue text ─────────────────────────────────────────── */}
      {hall.description && (
        <section className="border-b border-white/[0.06] py-14" aria-labelledby="hall-intro">
          <Container width="museum">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <h2 id="hall-intro" className="label-fa">
                  معرفی تالار
                </h2>
              </div>
              <div className="max-w-reading lg:col-span-8 lg:col-start-5">
                <p className="text-body text-sage-300">{hall.description}</p>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ── 4–8. The objects ──────────────────────────────────────────────── */}
      <section className="py-14" aria-labelledby="hall-collection">
        <Container width="museum">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="hall-collection" className="font-display text-subtitle text-ivory-100">
              نمونه‌های این تالار
            </h2>
            {specimens.state !== 'unavailable' && (
              <ResultSummary
                total={specimens.total}
                page={specimens.page}
                pageSize={specimens.pageSize}
              />
            )}
          </div>

          {specimens.state === 'unavailable' ? (
            <EmptyState
              title="مجموعه در این لحظه در دسترس نیست"
              description="ارتباط موزه با مخزن نمونه‌ها برقرار نشد. صفحهٔ تالار باز است، اما فهرست اشیا تا بازگشت مخزن نمایش داده نمی‌شود."
              note="وضعیت سامانه در نشانی /api/health گزارش می‌شود."
            />
          ) : specimens.total === 0 && !specimens.filtered ? (
            <EmptyState
              title="این تالار هنوز شیئی ندارد"
              description="نمونه‌های این تالار پس از ثبت، بازبینی و انتشار در پنل مدیریت در همین صفحه نمایش داده می‌شوند. تا آن زمان، ویترین خالی می‌ماند."
              note="هیچ نمونهٔ نمایشی یا ساختگی در موزه منتشر نمی‌شود."
              action={
                <ButtonLink href="/halls" variant="outline" size="sm">
                  بازگشت به فهرست تالارها
                </ButtonLink>
              }
            />
          ) : (
            <>
              <CollectionControls
                action={`/halls/${encodeURIComponent(hall.slug)}`}
                options={options}
                current={query}
                hideHall
              />

              {specimens.state === 'empty' ? (
                <div className="mt-10">
                  <EmptyState
                    title="نمونه‌ای با این فیلترها یافت نشد"
                    description="هیچ شیئی در این تالار همهٔ شرط‌های انتخابی را هم‌زمان ندارد. می‌توانید فیلترها را پاک کنید یا شرط‌ها را ساده‌تر کنید."
                    action={
                      <ButtonLink
                        href={`/halls/${encodeURIComponent(hall.slug)}`}
                        variant="outline"
                        size="sm"
                      >
                        پاک کردن فیلترها
                      </ButtonLink>
                    }
                  />
                </div>
              ) : (
                <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {specimens.items.map((specimen, index) => (
                    <li key={specimen.id}>
                      <SpecimenCard specimen={specimen} priority={index === 0} />
                    </li>
                  ))}
                </ul>
              )}

              <Pagination
                page={specimens.page}
                pageCount={specimens.pageCount}
                hrefFor={hrefForPage}
                className="mt-14"
              />
            </>
          )}
        </Container>
      </section>

      {/* ── 9. Related halls ──────────────────────────────────────────────── */}
      {relatedHalls.length > 0 && (
        <section className="border-t border-white/[0.06] py-14" aria-labelledby="related-halls">
          <Container width="museum">
            <h2 id="related-halls" className="label-fa mb-6">
              تالارهای مرتبط
            </h2>
            <ul className="grid gap-6 sm:grid-cols-3">
              {relatedHalls.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/halls/${encodeURIComponent(other.slug)}`}
                    className="group flex h-full flex-col border border-white/[0.07] bg-surface/40 p-6 transition-colors hover:border-gold-500/30"
                    style={{ borderRadius: 'var(--radius-vitrine)' }}
                  >
                    <p
                      dir="ltr"
                      className="font-latin text-[0.7rem] tracking-[0.2em] text-gold-400/80 uppercase"
                    >
                      {other.latinName}
                    </p>
                    <span className="mt-2 font-display text-subtitle text-ivory-100 group-hover:text-gold-100">
                      {other.title}
                    </span>
                    <span className="mt-3 text-small text-sage-500">{other.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </article>
  );
}
