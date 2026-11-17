import type { Metadata } from 'next';
import Link from 'next/link';
import { halls } from '@/content/halls';
import { ResponsiveImage } from '@/components/museum/responsive-image';
import { Container } from '@/components/ui/container';
import { hallImage } from '@/content/halls';
import { ArrowStart } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'تالارهای موزه',
  description: 'شش تالار موزهٔ گموریا: سنگ‌های قیمتی، نیمه‌قیمتی، کریستال‌ها، کانی‌های کمیاب، نمونه‌های زمین‌شناسی و سنگ‌های با منشأ آلی.',
};

/**
 * The hall index.
 *
 * This page exists so the primary navigation has a real destination: every hall
 * card on the homepage links here or deeper, and every link resolves. It lists
 * the six halls; the objects inside them arrive with the collection in Phase 1B.
 */
export default function HallsIndexPage() {
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
            هر تالار به یک خانوادهٔ طبیعی اختصاص دارد. اشیای هر تالار پس از ثبت و انتشار در
            پنل مدیریت، در همان صفحه نمایش داده می‌شوند.
          </p>
        </header>

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {halls.map((hall) => (
            <li key={hall.slug}>
              <Link href={`/halls/${hall.slug}`} className="group block">
                <ResponsiveImage
                  media={hallImage(hall)}
                  alt={hall.imageAlt}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                  ratio="4 / 5"
                  imgClassName="transition-transform duration-[1100ms] ease-museum group-hover:scale-[1.03]"
                />
                <p dir="ltr" className="mt-5 font-latin text-[0.72rem] tracking-[0.2em] text-gold-400/80 uppercase">
                  {hall.titleEn}
                </p>
                <h2 className="mt-2 font-display text-subtitle text-ivory-100">{hall.titleFa}</h2>
                <p className="mt-3 text-small text-sage-400">{hall.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-small text-gold-300">
                  مشاهدهٔ تالار
                  <ArrowStart className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:-translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
