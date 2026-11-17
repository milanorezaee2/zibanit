import { Container } from "@/components/ui/container";
import { ResponsiveImage } from "./responsive-image";
import { ArrowStart, ScrollCue } from "@/components/ui/icons";
import { media } from "@/content/media.generated";
import Link from "next/link";

/**
 * The entrance — third iteration, and the one that stops being polite.
 *
 * What was wrong with the previous two: both were a *layout* — a column of text
 * beside a column of text, two rectangles under it, happily inside the container.
 * A layout is what a template does. An opening page needs an idea, and the idea
 * here is **scale against stillness**:
 *
 *   • the statement is set at viewport scale (up to 6rem) and breaks across three
 *     lines with one word in Naskh — the museum's two voices in a single sentence
 *   • the information a visitor needs is squeezed into a small, precise data rail
 *     whose numbers are the only large type besides the headline
 *   • the photograph is not a card in a grid: it is a full-bleed band with its
 *     label printed at the edge, the way a wall text sits at the edge of a print
 *   • the six rooms drift past on a ticker at the fold — the first movement on the
 *     page, and the only one that is not an entrance
 *
 * Nothing here animates on scroll, and the ticker stops for anyone who asks for
 * less motion. The grain is CSS, not an image.
 */
export interface HeroHall {
  readonly title: string;
  readonly latinName: string;
}

export function HeroSection({
  halls = [],
  hallCount,
}: {
  halls?: readonly HeroHall[];
  hallCount?: number;
}) {
  const count =
    typeof hallCount === "number" && hallCount > 0
      ? new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(hallCount)
      : null;

  const ticker = halls.length > 0 ? halls : [];

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="paper-grain" aria-hidden="true" />

      {/* ── The masthead rail ─────────────────────────────────────────────── */}
      <Container width="museum">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line pb-3 pt-[calc(var(--header-height)+1.5rem)]">
          <span className="text-[11px] text-ink-subtle">
            سنگ‌های قیمتی · کریستال · کانی‌های کمیاب
          </span>
          <span
            dir="ltr"
            className="text-[10.5px] tracking-[0.28em] text-ink-subtle uppercase"
          >
            A Digital Museum of Natural Wonders
          </span>
        </div>
      </Container>

      {/* ── The statement ─────────────────────────────────────────────────── */}
      <Container width="museum">
        <div className="grid gap-y-9 pb-12 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-x-12 lg:pb-16">
          <h1
            id="hero-heading"
            className="text-[clamp(2.55rem,6.4vw,6rem)] font-bold leading-[1.17] tracking-[-0.01em] text-ink lg:col-span-8"
          >
            جهانی از شگفتی‌های{" "}
            {/* One word in the Naskh face: the sentence carries both of the
                museum's voices instead of announcing them in a caption. */}
            <span className="font-display font-normal text-emerald-900">
              پنهان
            </span>{" "}
            در دل زمین
          </h1>

          <div className="flex flex-col justify-end gap-7 lg:col-span-4">
            <p className="max-w-[34rem] text-[0.98rem] leading-[2.05] text-ink-muted">
              شش تالار برای دیدن، خواندن و شناختن؛ هر شیء با نام علمی، خاستگاه و
              ویژگی‌های ثبت‌شدهٔ خودش. موزه‌ای که چیزی نمی‌فروشد و هیچ عددی را
              حدس نمی‌زند.
            </p>

            {/* One filled door and one underlined word. Two equal buttons is what
                a landing page does; a museum points. */}
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href="/halls"
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-emerald-900 ps-6 pe-2 text-[0.9rem] font-medium text-ivory-50 transition-colors hover:bg-emerald-800"
              >
                ورود به تالارها
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ivory-50/10 transition-transform duration-500 ease-museum group-hover:-translate-x-1"
                >
                  <ArrowStart className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/search"
                className="text-[0.9rem] text-ink underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors hover:decoration-emerald-900"
              >
                جست‌وجو در مجموعه
              </Link>
            </div>

            {/* The data rail: three facts, one of them a number worth setting. */}
            <dl className="mt-1 grid grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="text-[10.5px] tracking-[0.14em] text-ink-subtle">
                  تالار
                </dt>
                <dd className="mt-1 text-[1.6rem] font-bold leading-none text-ink">
                  {count ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] tracking-[0.14em] text-ink-subtle">
                  طبقه‌بندی
                </dt>
                <dd className="mt-2 text-[0.85rem] text-ink">
                  علمی، جدا از تالار
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] tracking-[0.14em] text-ink-subtle">
                  فروش
                </dt>
                <dd className="mt-2 text-[0.85rem] text-ink">هیچ</dd>
              </div>
            </dl>
          </div>
        </div>
      </Container>

      {/* ── The photograph: a band, not a card ────────────────────────────── */}
      <div className="relative h-[52svh] min-h-[20rem] w-full overflow-hidden">
        <ResponsiveImage
          media={media.hero}
          alt="خوشهٔ بلور زمرد طبیعی بر بستر سنگ آتشفشانی تیره، در نور ویترین موزه"
          sizes="100vw"
          priority
          ratio="free"
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full object-cover"
          quality={88}
        />

        <div
          className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,rgba(11,14,12,0.9),rgba(11,14,12,0.3)_48%,transparent)]"
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 bottom-0">
          <Container width="museum">
            <div className="on-dark flex flex-wrap items-end justify-between gap-4 pb-5">
              <p className="max-w-[30rem] text-[0.8rem] leading-7 text-ivory-200">
                ویترین ورودی — خوشهٔ بلور زمرد در نور موزه.
                <span className="ms-2 text-ivory-300/70">
                  تصویر جایگزین تا زمان ثبت عکس‌های اصلی مجموعه.
                </span>
              </p>

              <a
                href="#about"
                className="group inline-flex items-center gap-3 text-[0.78rem] text-ivory-200 transition-colors hover:text-ivory-50"
              >
                <span>آغاز بازدید</span>
                <ScrollCue className="h-4 w-4 transition-transform duration-500 ease-museum group-hover:translate-y-0.5" />
              </a>
            </div>
          </Container>
        </div>
      </div>

      {/* ── The ticker: the six rooms, drifting ───────────────────────────── */}
      <div className="relative overflow-hidden border-b border-line bg-paper-raised">
        <div className="ticker-track py-3" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {(ticker.length > 0
                ? ticker
                : [
                    { title: "سنگ‌های قیمتی", latinName: "Precious" },
                    { title: "کریستال‌ها", latinName: "Crystals" },
                  ]
              ).map((hall, index) => (
                <span key={`${copy}-${index}`} className="flex items-center">
                  <span className="px-6 text-[0.8rem] text-ink">
                    {hall.title}
                  </span>
                  <span
                    dir="ltr"
                    className="font-latin text-[0.72rem] tracking-[0.22em] text-ink-subtle uppercase"
                  >
                    {hall.latinName}
                  </span>
                  <span className="px-5 text-accent" aria-hidden="true">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>

        <p className="sr-only">
          شش تالار موزه: سنگ‌های قیمتی، سنگ‌های نیمه‌قیمتی، کریستال‌ها، کانی‌های
          کمیاب، نمونه‌های زمین‌شناسی و سنگ‌های با منشأ آلی.
        </p>
      </div>

      {/* The museum's one repeated promise, kept out of the rail on purpose. */}
      <Container width="museum">
        <p className="py-5 text-[0.78rem] text-ink-subtle">
          هیچ شیئی در این مجموعه برای فروش عرضه نمی‌شود؛ موزه، موزه است.
        </p>
      </Container>
    </section>
  );
}
