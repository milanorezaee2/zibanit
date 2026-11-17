import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { ResponsiveImage } from './responsive-image';
import { ScrollCue } from '@/components/ui/icons';
import { media } from '@/content/media.generated';

/**
 * The entrance.
 *
 * Recomposed for the 1B pass. What changed and why:
 *
 *   • The headline is set in the sans face at display scale, in solid ivory. The
 *     gold-gradient headline it replaces was the piece of the page most often read
 *     as "ornamental"; a museum can be luxurious without tinting its own words.
 *   • The composition is a two-part grid rather than one column on a photograph:
 *     the eye gets a single reading line at the top, the statement in the middle,
 *     and a strip of three facts on the floor of the image — the same way an
 *     exhibition wall is organised.
 *   • The scrim is anchored to the text side and dies before the middle of the
 *     frame, so the photograph is a photograph and not a background texture.
 *
 * The hall count is passed in from the page, because it is a fact about the
 * database, not about the design.
 */
export function HeroSection({ hallCount }: { hallCount?: number }) {
  const halls =
    typeof hallCount === 'number' && hallCount > 0
      ? new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(hallCount)
      : null;

  return (
    <section
      className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <ResponsiveImage
        media={media.hero}
        alt="خوشهٔ بلور زمرد طبیعی بر بستر سنگ آتشفشانی تیره، در نور ویترین موزه"
        sizes="100vw"
        priority
        ratio="free"
        className="absolute inset-0 -z-20 h-full w-full"
        quality={88}
      />

      {/* Directional scrim: opaque where the Persian text sits, gone by 55%. */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_left,rgba(11,14,12,0.97)_0%,rgba(11,14,12,0.9)_30%,rgba(11,14,12,0.52)_55%,rgba(11,14,12,0.12)_78%,transparent_100%)]"
        aria-hidden="true"
      />
      {/* The seam into the page, so the photograph does not end in a hard edge. */}
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[linear-gradient(to_top,var(--color-canvas)_4%,rgba(11,14,12,0.6)_46%,transparent)]"
        aria-hidden="true"
      />

      <Container width="museum" className="relative pb-10 pt-40 sm:pb-14 sm:pt-48">
        <div className="max-w-[46rem]">
          <p className="flex items-center gap-4">
            <span className="h-px w-8 shrink-0 bg-gold-500/70" aria-hidden="true" />
            <span className="eyebrow" dir="ltr">
              A Digital Museum of Natural Wonders
            </span>
          </p>

          <h1
            id="hero-heading"
            className="mt-7 font-body text-display font-bold text-ivory-50"
          >
            جهانی از شگفتی‌های پنهان در دل زمین
          </h1>

          <p className="mt-7 max-w-[33rem] text-lead text-ivory-200/80">
            سنگ‌های قیمتی، کریستال‌ها و کانی‌های کمیاب — شش تالار برای دیدن، خواندن و
            شناختن؛ جایی که طبیعت میلیون‌ها سال برای خلق هر اثر وقت گذاشته است.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/halls" size="lg">
              ورود به تالارها
            </ButtonLink>
            <ButtonLink href="/search" variant="outline" size="lg">
              جست‌وجو در مجموعه
            </ButtonLink>
          </div>
        </div>

        {/* The floor of the exhibition wall: three facts, no ornament. */}
        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4 sm:gap-x-10">
          {[
            halls ? { term: 'تالار', value: halls } : null,
            { term: 'طبقه‌بندی علمی', value: 'مستقل از تالار' },
            { term: 'داده', value: 'مبتنی بر پایگاه داده' },
            { term: 'فروش', value: 'هیچ' },
          ]
            .filter((item): item is { term: string; value: string } => item !== null)
            .map((item) => (
              <div key={item.term}>
                <dt className="text-[11.5px] tracking-wide text-sage-500">{item.term}</dt>
                <dd className="mt-1.5 text-[0.95rem] text-ivory-100">{item.value}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-8 flex items-center justify-between gap-6">
          <p className="max-w-md text-small text-sage-500">
            هیچ شیئی در این مجموعه برای فروش عرضه نمی‌شود؛ موزه، موزه است.
          </p>
          <a
            href="#about"
            className="group hidden items-center gap-3 text-small text-sage-400 transition-colors hover:text-gold-200 sm:flex"
          >
            <span>آغاز بازدید</span>
            <ScrollCue className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:translate-y-0.5" />
          </a>
        </div>
      </Container>
    </section>
  );
}
