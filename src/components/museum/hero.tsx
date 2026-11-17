import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { ResponsiveImage } from './responsive-image';
import { ScrollCue } from '@/components/ui/icons';
import { media } from '@/content/media.generated';

/**
 * The entrance — daylight version.
 *
 * The museum no longer opens with a dark photograph and a gold headline. It opens
 * the way a lit gallery does: paper, a statement at display scale, a short
 * paragraph that says what the place is, two doors, and then one large photograph
 * with a caption on it.
 *
 * The composition is a three-band wall:
 *
 *   1. a hairline masthead (Latin subtitle, Persian label) that frames the page
 *   2. the statement across eight columns and the introduction across four, so
 *      the eye has one long line and one short one — not a centred block
 *   3. a 21:9 photograph with its label living *on* the image, followed by a
 *      measured strip of facts on paper
 *
 * The hall count is passed in from the page because it is a fact about the
 * database, not a design element.
 */
export function HeroSection({ hallCount }: { hallCount?: number }) {
  const halls =
    typeof hallCount === 'number' && hallCount > 0
      ? new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(hallCount)
      : null;

  return (
    <section
      className="relative isolate pt-[calc(var(--header-height)+2.5rem)] sm:pt-[calc(var(--header-height)+4rem)]"
      aria-labelledby="hero-heading"
    >
      <Container width="museum">
        {/* 1. The masthead: two small facts about what this page is. */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line pb-4">
          <span className="eyebrow" dir="ltr">
            A Digital Museum of Natural Wonders
          </span>
          <span className="text-[0.78rem] text-ink-subtle">
            موزهٔ دیجیتال سنگ‌های قیمتی، کریستال‌ها و کانی‌ها
          </span>
        </div>

        {/* 2. The statement, and the sentence that qualifies it. */}
        <div className="mt-10 grid items-end gap-x-12 gap-y-9 lg:grid-cols-12">
          <h1
            id="hero-heading"
            className="text-[2.6rem] font-bold leading-[1.22] text-ink sm:text-[3.6rem] lg:col-span-8 lg:text-[4.6rem]"
          >
            جهانی از شگفتی‌های
            <span className="text-accent"> پنهان</span> در دل زمین
          </h1>

          <div className="lg:col-span-4 lg:pb-2">
            <p className="text-[1.02rem] leading-[2.05] text-ink-muted">
              سنگ‌های قیمتی، کریستال‌ها و کانی‌های کمیاب؛ شش تالار برای دیدن، خواندن و
              شناختن. هر شیء با نام علمی، خاستگاه و ویژگی‌های ثبت‌شده‌اش نمایش داده
              می‌شود — بدون هیچ قیمت و هیچ فروش.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="/halls" size="lg">
                ورود به تالارها
              </ButtonLink>
              <ButtonLink href="/search" variant="outline" size="lg">
                جست‌وجو در مجموعه
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* 3. One photograph, with its label on the image rather than beside it. */}
        <div
          className="relative mt-12 overflow-hidden bg-paper-raised"
          style={{ borderRadius: 'var(--radius-plinth)' }}
        >
          <ResponsiveImage
            media={media.hero}
            alt="خوشهٔ بلور زمرد طبیعی بر بستر سنگ آتشفشانی تیره، در نور ویترین موزه"
            sizes="(min-width: 1408px) 88rem, 96vw"
            priority
            ratio="21 / 9"
            className="h-full w-full"
            quality={88}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(11,14,12,0.86),rgba(11,14,12,0.28)_52%,transparent)]"
            aria-hidden="true"
          />

          <div className="on-dark absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
            <p className="max-w-[34rem] text-[0.85rem] leading-7 text-ivory-200">
              ویترین ورودی — خوشهٔ بلور زمرد در نور موزه.
              <span className="ms-2 text-ivory-300/70">
                تصویر جایگزین تا زمان ثبت عکس‌های اصلی مجموعه.
              </span>
            </p>

            <a
              href="#about"
              className="group inline-flex items-center gap-3 text-[0.8rem] text-ivory-200 transition-colors hover:text-ivory-50"
            >
              <span>آغاز بازدید</span>
              <ScrollCue className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:translate-y-0.5" />
            </a>
          </div>
        </div>

        {/* The floor strip: facts, then the one statement the museum makes twice. */}
        <div className="mt-8 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              halls ? { term: 'تالار', value: halls } : null,
              { term: 'طبقه‌بندی علمی', value: 'مستقل از تالار' },
              { term: 'منبع داده', value: 'پایگاه دادهٔ موزه' },
            ]
              .filter((item): item is { term: string; value: string } => item !== null)
              .map((item) => (
                <div key={item.term} className="flex items-baseline gap-2">
                  <dt className="text-[0.78rem] text-ink-subtle">{item.term}</dt>
                  <dd className="text-[0.95rem] font-medium text-ink">{item.value}</dd>
                </div>
              ))}
          </dl>

          <p className="max-w-[26rem] text-[0.8rem] leading-7 text-ink-subtle">
            هیچ شیئی در این مجموعه برای فروش عرضه نمی‌شود؛ موزه، موزه است.
          </p>
        </div>
      </Container>
    </section>
  );
}
