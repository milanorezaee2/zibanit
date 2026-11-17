import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { GemoriaMark } from '@/components/brand/gemoria-mark';

/**
 * The closing invitation.
 *
 * Placed after the discovery panel and before the footer: it is the last thing a
 * visitor reads, so it does one thing — offers the two real doors and repeats the
 * promise that nothing here is for sale. Same mark as the header, at a size that
 * is a signature rather than a logo.
 */
export function MuseumCTA() {
  return (
    <section className="border-t border-white/[0.06] py-section" aria-labelledby="cta-heading">
      <Container width="reading" className="text-center">
        <GemoriaMark className="mx-auto mb-9 h-12 w-12 text-gold-500/70" weight={0.8} />

        <h2 id="cta-heading" className="font-display text-title text-ivory-100">
          بازدید را از تالارها آغاز کنید
        </h2>

        <p className="mx-auto mt-5 max-w-reading text-body text-sage-400">
          شش تالار، یک دانشنامه و یک اطلس در حال شکل‌گرفتن است. موزه باز است؛ هرچه ثبت
          شود، همین‌جا نمایش داده خواهد شد.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href="/halls" size="lg">
            ورود به تالارهای موزه
          </ButtonLink>
          <ButtonLink href="/#atlas" variant="ghost" size="lg">
            اطلس جهانی
          </ButtonLink>
        </div>

        <p className="mt-10 text-small text-sage-600">
          گموریا فروشگاه نیست: هیچ قیمتی در این سایت وجود ندارد.
        </p>
      </Container>
    </section>
  );
}
