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
        <header className="mb-14 max-w-reading">
          <p className="mb-5 flex items-center gap-3">
            <span className="label-fa">تالارهای موزه</span>
            <span className="gold-rule w-10" aria-hidden="true" />
          </p>
          <h1 className="font-display text-title text-ivory-100">شش تالار</h1>
          <p className="mt-5 text-body text-sage-400">
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
              className="text-small text-gold-300 underline decoration-gold-500/30 underline-offset-[6px] transition-colors hover:text-gold-200 hover:decoration-gold-400/70"
            >
              جست‌وجو در همهٔ نمونه‌های موزه
            </Link>
          </p>
        </header>

        {halls.state === 'ready' ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {halls.items.map((hall) => (
              <li key={hall.id}>
                <Link href={`/halls/${encodeURIComponent(hall.slug)}`} className="group block">
                  <MuseumImage
                    image={hall.image}
                    alt={hall.imageAlt}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    ratio="4 / 5"
                    imgClassName="transition-transform duration-[1100ms] ease-museum group-hover:scale-[1.03]"
                    fallback={
                      <div
                        className="flex items-center justify-center bg-surface/40"
                        style={{ aspectRatio: '4 / 5' }}
                      >
                        <span className="font-display text-[3rem] text-gold-500/20" aria-hidden="true">
                          ❖
                        </span>
                      </div>
                    }
                  />
                  <p
                    dir="ltr"
                    className="mt-5 font-latin text-[0.72rem] tracking-[0.2em] text-gold-400/80 uppercase"
                  >
                    {hall.latinName}
                  </p>
                  <h2 className="mt-2 font-display text-subtitle text-ivory-100">{hall.title}</h2>
                  <p className="mt-3 text-small text-sage-400">{hall.summary}</p>
                  <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-gold-300">
                    <span className="inline-flex items-center gap-2">
                      مشاهدهٔ تالار
                      <ArrowStart className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:-translate-x-1" />
                    </span>
                    {hall.specimenCount > 0 ? (
                      <span className="text-sage-500">{persianNumber(hall.specimenCount)} نمونه</span>
                    ) : (
                      <span className="text-sage-600">در حال آماده‌سازی</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
