import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { MuseumImage } from './museum-image';
import { SectionHeading } from './section-heading';
import { ArrowStart } from '@/components/ui/icons';
import type { HallSummary } from '@/db/queries/halls';

/**
 * The six halls.
 *
 * The requirement was explicit: not six identical cards. The grid is therefore
 * composed rather than repeated — a feature, a companion, a row of three, and a
 * wide band for the hall that closes the tour. That is also how a real museum is
 * laid out: rooms are not the same size, and the asymmetry is what tells a visitor
 * where to start.
 *
 * Phase 1B reads the halls from the database, but the *composition* stays here:
 * a curator controls the order and which halls are featured, while the editorial
 * rhythm of the homepage remains a design decision rather than a seventh setting
 * nobody understands. The positions are therefore derived from the hall's place in
 * the published order.
 */
type Emphasis = 'feature' | 'companion' | 'standard' | 'band';

const cardSizes: Record<Emphasis, { ratio: string; sizes: string }> = {
  feature: { ratio: '16 / 11', sizes: '(min-width: 1024px) 58vw, 92vw' },
  // 1:1 keeps its height equal to the 7-column feature beside it at 16:11.
  companion: { ratio: '1 / 1', sizes: '(min-width: 1024px) 40vw, 92vw' },
  standard: { ratio: '4 / 5', sizes: '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw' },
  band: { ratio: '16 / 9', sizes: '(min-width: 1024px) 46vw, 92vw' },
};

export function hallEmphasis(index: number, total: number): Emphasis {
  if (index === 0) return 'feature';
  if (index === 1) return 'companion';
  if (index === total - 1 && total > 4) return 'band';
  return 'standard';
}

function HallCard({
  hall,
  emphasis,
  priority = false,
}: {
  hall: HallSummary;
  emphasis: Emphasis;
  priority?: boolean;
}) {
  const { ratio, sizes } = cardSizes[emphasis];

  const caption = (
    <>
      <p
        dir="ltr"
        className="font-latin text-[0.78rem] tracking-[0.22em] text-gold-300/90 uppercase"
      >
        {hall.latinName}
      </p>
      <h3 className="mt-2 text-[1.35rem] font-bold leading-snug text-ivory-50">{hall.title}</h3>
      <p className="mt-2.5 line-clamp-2 max-w-sm text-[0.85rem] leading-7 text-ivory-200/70">
        {hall.summary}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-small text-gold-200">
        <span>مشاهدهٔ تالار</span>
        <ArrowStart className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:-translate-x-1" />
      </span>
      {hall.specimenCount > 0 && (
        <span className="mt-3 block text-label text-ivory-200/60">
          {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(hall.specimenCount)} نمونه
        </span>
      )}
    </>
  );

  const image = (
    <MuseumImage
      image={hall.image}
      alt={hall.imageAlt}
      sizes={sizes}
      ratio={ratio}
      priority={priority}
      imgClassName="transition-transform duration-[1100ms] ease-museum group-hover:scale-[1.03]"
      fallback={
        <div className="flex h-full items-center justify-center" style={{ aspectRatio: ratio }}>
          <span className="font-display text-[2.5rem] text-gold-500/20" aria-hidden="true">
            ❖
          </span>
        </div>
      }
    />
  );

  // The closing hall is a two-column band rather than an overlay: at full width an
  // overlay caption would float in the middle of the photograph.
  if (emphasis === 'band') {
    return (
      <Link
        href={`/halls/${encodeURIComponent(hall.slug)}`}
        className="group grid overflow-hidden bg-surface/50 transition-colors duration-500 hover:bg-surface lg:grid-cols-2"
        style={{ borderRadius: 'var(--radius-plinth)' }}
      >
        {image}
        <div className="flex flex-col justify-center gap-2 p-8 sm:p-12">{caption}</div>
      </Link>
    );
  }

  return (
    <Link
      href={`/halls/${encodeURIComponent(hall.slug)}`}
      className="group relative block overflow-hidden"
      style={{ borderRadius: 'var(--radius-vitrine)' }}
    >
      {image}

      {/* The scrim exists only where the text sits — the photograph stays legible. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(11,14,12,0.95),rgba(11,14,12,0.62)_34%,rgba(11,14,12,0.08)_66%,transparent_82%)] transition-opacity duration-500"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">{caption}</div>
    </Link>
  );
}

export function HallShowcase({ halls }: { halls: readonly HallSummary[] }) {
  const [feature, companion, ...rest] = halls;
  const row = rest.filter((_, index) => hallEmphasis(index + 2, halls.length) === 'standard');
  const band = rest.find((_, index) => hallEmphasis(index + 2, halls.length) === 'band');

  return (
    <section id="halls" className="reveal py-section" aria-labelledby="halls-heading">
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
              <HallCard hall={feature} emphasis="feature" priority />
            </div>
          )}
          {companion && (
            <div className="lg:col-span-5">
              <HallCard hall={companion} emphasis="companion" />
            </div>
          )}
        </div>

        <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {row.map((hall) => (
            <li key={hall.code}>
              <HallCard hall={hall} emphasis="standard" />
            </li>
          ))}
        </ul>

        {band && (
          <div className="mt-5">
            <HallCard hall={band} emphasis="band" />
          </div>
        )}
      </Container>
    </section>
  );
}
