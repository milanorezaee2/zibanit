import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { ResponsiveImage } from './responsive-image';
import { SectionHeading } from './section-heading';
import { ArrowStart } from '@/components/ui/icons';
import { hallImage, halls, type Hall } from '@/content/halls';

/**
 * The six halls.
 *
 * The requirement was explicit: not six identical cards. The grid is therefore
 * composed rather than repeated — a feature, a companion, a row of three, and a
 * wide band for the hall that closes the tour. That is also how a real museum is
 * laid out: rooms are not the same size, and the asymmetry is what tells a visitor
 * where to start.
 *
 * One `HallCard` serves every position; `emphasis` only changes its proportions.
 */
const cardSizes: Record<Hall['emphasis'], { ratio: string; sizes: string }> = {
  feature: { ratio: '16 / 11', sizes: '(min-width: 1024px) 58vw, 92vw' },
  // 1:1 keeps its height equal to the 7-column feature beside it at 16:11.
  companion: { ratio: '1 / 1', sizes: '(min-width: 1024px) 40vw, 92vw' },
  standard: { ratio: '4 / 5', sizes: '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw' },
  band: { ratio: '16 / 9', sizes: '(min-width: 1024px) 46vw, 92vw' },
};

function HallCard({ hall, index }: { hall: Hall; index: number }) {
  const { ratio, sizes } = cardSizes[hall.emphasis];

  const caption = (
    <>
      <p
        dir="ltr"
        className="font-latin text-[0.78rem] tracking-[0.22em] text-gold-300/90 uppercase"
      >
        {hall.titleEn}
      </p>
      <h3 className="mt-2 font-display text-subtitle text-ivory-50">{hall.titleFa}</h3>
      <p className="mt-3 max-w-sm text-small text-ivory-200/75">{hall.summary}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-small text-gold-200">
        <span>مشاهدهٔ تالار</span>
        <ArrowStart className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:-translate-x-1" />
      </span>
    </>
  );

  // The closing hall is a two-column band rather than an overlay: at full width an
  // overlay caption would float in the middle of the photograph.
  if (hall.emphasis === 'band') {
    return (
      <Link
        href={`/halls/${hall.slug}`}
        className="group grid overflow-hidden border border-white/[0.07] bg-surface/40 transition-colors duration-500 hover:border-gold-500/25 lg:grid-cols-2"
        style={{ borderRadius: 'var(--radius-vitrine)' }}
      >
        <ResponsiveImage
          media={hallImage(hall)}
          alt={hall.imageAlt}
          sizes={sizes}
          ratio={ratio}
          imgClassName="transition-transform duration-[1100ms] ease-museum group-hover:scale-[1.03]"
        />
        <div className="flex flex-col justify-center gap-2 p-8 sm:p-12">{caption}</div>
      </Link>
    );
  }

  return (
    <Link href={`/halls/${hall.slug}`} className="group relative block overflow-hidden">
      <ResponsiveImage
        media={hallImage(hall)}
        alt={hall.imageAlt}
        sizes={sizes}
        ratio={ratio}
        priority={index === 0}
        imgClassName="transition-transform duration-[1100ms] ease-museum group-hover:scale-[1.03]"
      />

      {/* The scrim exists only where the text sits — the photograph stays legible. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(11,14,12,0.94),rgba(11,14,12,0.55)_38%,transparent_72%)]"
        aria-hidden="true"
      />

      <span
        className="pointer-events-none absolute inset-3 border border-gold-500/0 transition-colors duration-500 group-hover:border-gold-500/25"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">{caption}</div>
    </Link>
  );
}

export function HallShowcase() {
  const [feature, companion, ...rest] = halls;
  const row = rest.filter((hall) => hall.emphasis === 'standard');
  const band = rest.find((hall) => hall.emphasis === 'band');

  return (
    <section id="halls" className="py-section" aria-labelledby="halls-heading">
      <Container width="museum">
        <SectionHeading
          titleId="halls-heading"
          label="تالارهای موزه"
          title="شش تالار، شش راه به دل زمین"
          description="هر تالار یک خانوادهٔ متفاوت از مواد طبیعی را روایت می‌کند؛ از سنگ‌های قیمتی تا نمونه‌هایی که منشأشان جانداران‌اند."
          action={
            <ButtonLink href="/halls" variant="quiet" size="sm">
              فهرست کامل تالارها
            </ButtonLink>
          }
        />

        <div className="grid gap-5 lg:grid-cols-12">
          {feature && (
            <div className="lg:col-span-7">
              <HallCard hall={feature} index={0} />
            </div>
          )}
          {companion && (
            <div className="lg:col-span-5">
              <HallCard hall={companion} index={1} />
            </div>
          )}
        </div>

        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {row.map((hall) => (
            <li key={hall.slug}>
              <HallCard hall={hall} index={2} />
            </li>
          ))}
        </ul>

        {band && (
          <div className="mt-5">
            <HallCard hall={band} index={halls.length - 1} />
          </div>
        )}
      </Container>
    </section>
  );
}
