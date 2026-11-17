import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findHall, hallImage, halls } from '@/content/halls';
import { ResponsiveImage } from '@/components/museum/responsive-image';
import { EmptyState } from '@/components/museum/empty-state';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';

/**
 * A single hall.
 *
 * Today it holds the hall's own photograph and description, plus an honest empty
 * vitrine where its objects will appear. The route exists in Phase 1A because the
 * homepage promises it: a "view hall" link that goes nowhere is a broken promise,
 * and the collection inside is Phase 1B's work, not this page's.
 */
export function generateStaticParams() {
  return halls.map((hall) => ({ slug: hall.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hall = findHall(slug);
  if (!hall) return { title: 'تالار یافت نشد' };

  return {
    title: `${hall.titleFa} — تالارها`,
    description: hall.summary,
    openGraph: {
      title: `${hall.titleFa} — موزهٔ گموریا`,
      description: hall.summary,
      images: [{ url: hallImage(hall).src, width: hallImage(hall).width, height: hallImage(hall).height }],
    },
  };
}

export default async function HallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hall = findHall(slug);
  if (!hall) notFound();

  return (
    <article className="pt-[calc(var(--header-height)+3.5rem)] pb-section">
      <Container width="museum">
        <nav aria-label="مسیر" className="mb-10 text-small text-sage-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-gold-200">
                خانه
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/halls" className="transition-colors hover:text-gold-200">
                تالارها
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-sage-300">
              {hall.titleFa}
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <ResponsiveImage
              media={hallImage(hall)}
              alt={hall.imageAlt}
              sizes="(min-width: 1024px) 40vw, 92vw"
              ratio="4 / 5"
              priority
              className="shadow-plinth"
            />
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:pt-6">
            <p dir="ltr" className="font-latin text-[0.75rem] tracking-[0.24em] text-gold-400/80 uppercase">
              {hall.titleEn}
            </p>
            <h1 className="mt-4 font-display text-title text-ivory-100">{hall.titleFa}</h1>
            <p className="mt-6 max-w-reading text-lead text-sage-300">{hall.summary}</p>

            <div className="mt-12">
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
            </div>
          </div>
        </div>
      </Container>
    </article>
  );
}
