import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { getPublishedHalls } from '@/db/queries/halls';
import { MuseumImage } from '@/components/museum/museum-image';
import { EmptyState } from '@/components/museum/empty-state';
import { Container } from '@/components/ui/container';
import { ArrowStart } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'تالارهای موزه',
  description:
    'شش تالار موزهٔ گموریا: سنگ‌های قیمتی، نیمه‌قیمتی، کریستال‌ها، کانی‌های کمیاب، نمونه‌های زمین‌شناسی و سنگ‌های با منشأ آلی.',
  alternates: { canonical: '/halls' },
};

const persianNumber = (value: number): string =>
  new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

/**
 * The hall index.
 *
 * Reads the halls from the database, because they are rows a curator can reorder,
 * rename and publish — not constants. The published specimen count per hall is
 * shown only when it is greater than zero: a gallery that has not opened yet says
 * so in words rather than advertising «۰ نمونه».
 */
export default async function HallsIndexPage() {
  // A live read: the index must reflect what is published now, not at build time.
  await connection();

  const halls = await getPublishedHalls();
  const totalObjects =
    halls.state === 'ready' ? halls.items.reduce((sum, hall) => sum + hall.specimenCount, 0) : 0;

  return (
    <div className="pt-[calc(var(--header-height)+3.5rem)] pb-section">
      <Container width="museum">
        <header className="mb-16 max-w-[54rem]">
          <p className="mb-4 flex items-center gap-3">
            <span className="label-fa">تالارهای موزه</span>
            <span className="h-px w-10 bg-gold-500/60" aria-hidden="true" />
          </p>
          <h1 className="font-body text-hero font-bold text-ink">
            شش تالار، شش اقلیم زمین
          </h1>
          <p className="mt-5 max-w-[52ch] text-lead text-ink-muted">
            هر تالار به یک خانوادهٔ طبیعی اختصاص دارد. جایگاه یک نمونه در تالار، تقسیم‌بندی
            نمایشی موزه است؛ طبقه‌بندی علمی آن جداگانه در صفحهٔ هر نمونه ثبت می‌شود.
            {totalObjects > 0 && (
              <>
                {' '}
                در این لحظه {persianNumber(totalObjects)} نمونهٔ منتشرشده در تالارها به نمایش
                درآمده است.
              </>
            )}
          </p>
          <p className="mt-4">
            <Link
              href="/search"
              className="text-small text-accent underline decoration-gold-500/30 underline-offset-[6px] transition-colors hover:text-accent hover:decoration-gold-400/70"
            >
              جست‌وجو در همهٔ نمونه‌های موزه
            </Link>
          </p>
        </header>

        {halls.state === 'ready' ? (
          /* A numbered index, not a card wall: each gallery is a spread with its own
             photograph, and the number is the position in the building, not a rank. */
          <ol className="border-t border-line">
            {halls.items.map((hall, index) => (
              <li key={hall.id} className="border-b border-line">
                <Link
                  href={`/halls/${encodeURIComponent(hall.slug)}`}
                  className="group grid items-center gap-8 py-9 sm:py-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-14"
                >
                  <div className="flex gap-5 sm:gap-8">
                    <span
                      aria-hidden="true"
                      className="mt-1 shrink-0 font-latin text-[1.6rem] leading-none text-accent/60 tabular-nums"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="min-w-0">
                      <p className="font-latin text-[0.72rem] tracking-[0.22em] text-accent/70 uppercase" dir="ltr">
                        {hall.latinName}
                      </p>
                      <h2 className="mt-2 text-[1.5rem] font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-accent sm:text-[1.75rem]">
                        {hall.title}
                      </h2>
                      <p className="mt-3 max-w-[46ch] text-body text-ink-muted">{hall.summary}</p>

                      <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-small">
                        <span className="inline-flex items-center gap-2 text-accent">
                          مشاهدهٔ تالار
                          <ArrowStart className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:-translate-x-1.5" />
                        </span>
                        <span className="text-ink-subtle">
                          {hall.specimenCount > 0
                            ? `${persianNumber(hall.specimenCount)} نمونهٔ منتشرشده`
                            : 'در حال آماده‌سازی'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden" style={{ borderRadius: 'var(--radius-vitrine)' }}>
                    <MuseumImage
                      image={hall.image}
                      alt={hall.imageAlt}
                      sizes="(min-width: 1024px) 26rem, 92vw"
                      ratio="16 / 10"
                      imgClassName="transition-transform duration-[1100ms] ease-museum group-hover:scale-[1.05]"
                      fallback={
                        <div
                          className="flex items-center justify-center bg-paper-raised/40"
                          style={{ aspectRatio: '16 / 10' }}
                        >
                          <span className="font-display text-[2.5rem] text-gold-500/20" aria-hidden="true">
                            ❖
                          </span>
                        </div>
                      }
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        ) : halls.state === 'empty' ? (
          <EmptyState
            title="تالارها هنوز منتشر نشده‌اند"
            description="تالارهای موزه در پایگاه داده ثبت شده‌اند اما هیچ‌کدام وضعیت «منتشرشده» ندارند. تا انتشار آن‌ها از پنل مدیریت، این صفحه خالی می‌ماند."
            note="هیچ تالاری به‌صورت نمایشی نمایش داده نمی‌شود."
          />
        ) : (
          <EmptyState
            title="فهرست تالارها در این لحظه در دسترس نیست"
            description="ارتباط موزه با مخزن محتوا برقرار نشد. صفحه باز است، اما فهرست تالارها تا بازگشت مخزن نمایش داده نمی‌شود."
            note="وضعیت سامانه در نشانی /api/health گزارش می‌شود."
          />
        )}
      </Container>
    </div>
  );
}
