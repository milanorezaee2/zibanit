import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { ResponsiveImage } from './responsive-image';
import { ScrollCue } from '@/components/ui/icons';
import { media } from '@/content/media.generated';

/**
 * The entrance.
 *
 * One photograph, one sentence, two doors. The photograph is composed with its
 * subject on the far side and deep shadow on the near side, which is where the
 * Persian text sits — so the scrim only has to do the last ten percent of the
 * work, and the image is not washed out to make room for a headline.
 *
 * The hero is the only place that uses a full-viewport band, and the only image
 * that is `priority`: everything below the fold waits its turn.
 */
export function HeroSection() {
  return (
    <section
      className="relative isolate flex min-h-[88svh] items-end overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* The photograph: full-bleed, cropped by the section, never by the text. */}
      <ResponsiveImage
        media={media.hero}
        alt="خوشهٔ بلور زمرد طبیعی بر بستر سنگ آتشفشانی تیره، در نور ویترین موزه"
        sizes="100vw"
        priority
        ratio="free"
        className="absolute inset-0 -z-20 h-full w-full"
        quality={88}
      />

      {/* Two scrims: one directional for the text, one vertical for the seam into
          the page. Neither is a black overlay — the photograph stays visible. */}
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_left,rgba(11,14,12,0.96)_0%,rgba(11,14,12,0.82)_28%,rgba(11,14,12,0.35)_58%,rgba(11,14,12,0.1)_78%,transparent_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-[linear-gradient(to_top,var(--color-canvas),transparent)]"
        aria-hidden="true"
      />

      <Container width="museum" className="relative pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="max-w-[42rem] animate-rise">
          <p className="flex items-center gap-4">
            <span className="gold-rule w-10 shrink-0" aria-hidden="true" />
            <span className="eyebrow" dir="ltr">
              A Digital Museum of Natural Wonders
            </span>
          </p>

          <h1
            id="hero-heading"
            className="mt-8 font-display text-display text-gold-gradient"
          >
            جهانی از شگفتی‌های پنهان در دل زمین
          </h1>

          <p className="mt-8 max-w-[34rem] text-lead text-ivory-200/90">
            به دنیای سنگ‌های قیمتی، کریستال‌ها و کانی‌های کمیاب سفر کنید؛ جایی که طبیعت
            میلیون‌ها سال برای خلق هر اثر زمان صرف کرده است.
          </p>

          <div className="mt-11 flex flex-wrap items-center gap-4">
            <ButtonLink href="/halls" size="lg">
              ورود به تالارهای موزه
            </ButtonLink>
            <ButtonLink href="#featured" variant="outline" size="lg">
              کاوش در مجموعه‌ها
            </ButtonLink>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between gap-6 border-t border-white/[0.08] pt-6">
          <p className="max-w-md text-small text-sage-500">
            موزه‌ای برای دیدن و شناختن؛ هیچ شیئی در این مجموعه برای فروش عرضه نمی‌شود.
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
