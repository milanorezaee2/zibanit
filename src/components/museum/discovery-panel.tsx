import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { ResponsiveImage } from './responsive-image';
import { media } from '@/content/media.generated';

/**
 * The discovery moment — the one section that is allowed to be atmospheric.
 *
 * A full-bleed macro of a crystal's interior, a single sentence, one door. The
 * animation is a slow scale on the photograph (1.0 → 1.04 over twelve seconds) and
 * nothing else: no parallax, no scroll hijacking, no autoplaying carousel. It stops
 * entirely under `prefers-reduced-motion`.
 */
export function DiscoveryPanel() {
  return (
    <section
      className="relative isolate flex min-h-[70svh] items-center overflow-hidden"
      aria-labelledby="discovery-heading"
    >
      <ResponsiveImage
        media={media.discovery}
        alt="نمای بسیار نزدیک از درون یک بلور سبز با شکستگی‌ها و رگه‌های درونی"
        sizes="100vw"
        ratio="free"
        className="absolute inset-0 -z-20 h-full w-full"
        imgClassName="motion-safe:animate-[gemoria-reveal_18s_ease-out_both]"
      />

      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_left,rgba(11,14,12,0.95)_0%,rgba(11,14,12,0.72)_40%,rgba(11,14,12,0.25)_70%,transparent_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,transparent,var(--color-canvas)_100%)] opacity-60"
        aria-hidden="true"
      />

      <Container width="museum" className="relative py-section">
        <div className="max-w-[38rem]">
          <p className="mb-6 flex items-center gap-3">
            <span className="label-fa">تجربهٔ کشف</span>
            <span className="gold-rule w-10" aria-hidden="true" />
          </p>

          <h2 id="discovery-heading" className="font-bold text-title text-ivory-50">
            هر سنگ، سندی از زمانی که پیش از ما بوده است
          </h2>

          <p className="mt-6 max-w-[32rem] text-lead text-ivory-200/85">
            میلیون‌ها سال فشار، حرارت و زمان، در یک وجهِ کوچک جمع شده است. در گموریا این
            سند را می‌خوانیم، نه فقط تماشا می‌کنیم.
          </p>

          <div className="mt-10">
            <ButtonLink href="/halls" size="lg" variant="outline">
              دیدن نمونه‌ها در تالارها
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
