import type { Metadata } from 'next';
import Link from 'next/link';
import { museumSections, site } from '@/config/site';
import { APP_PHASE, PLANNED_LOCALES } from '@/config/app';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Eyebrow, GoldRule, Heading } from '@/components/typography/heading';
import { Prose, PullQuote } from '@/components/typography/prose';
import { Wordmark } from '@/components/typography/wordmark';

export const metadata: Metadata = {
  title: `${site.nameFa} — ${site.tagline}`,
  description: site.descriptionFa,
  alternates: { canonical: '/' },
};

const phases = [
  { n: '۰', title: 'بنیاد و اسکلت', note: 'همین حالا' },
  { n: '۱', title: 'هستهٔ داده و پنل مدیریت', note: 'بعدی' },
  { n: '۲', title: 'موزهٔ عمومی', note: '' },
  { n: '۳', title: 'جستجو، فیلتر و اطلس', note: '' },
  { n: '۴', title: '۳۶۰ و سه‌بعدی', note: '' },
  { n: '۵', title: 'چندزبانگی و سئو', note: '' },
  { n: '۶', title: 'سخت‌سازی و استقرار', note: '' },
  { n: '۷', title: 'انتقال محتوا و انتشار', note: '' },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_420px_at_78%_-10%,rgba(20,122,86,0.30),transparent_62%),radial-gradient(560px_360px_at_8%_110%,rgba(201,169,97,0.10),transparent_60%)]"
        />
        <Container width="wide" className="relative py-20 sm:py-28 lg:py-36">
          <div className="grid items-center gap-14 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="animate-rise">
              <Eyebrow>موزهٔ دیجیتال سنگ‌های قیمتی</Eyebrow>

              <Heading level={1} gold className="mt-6">
                سنگ، حافظهٔ زمین است
              </Heading>

              <GoldRule className="mt-8 max-w-sm" />

              <Prose variant="lead" className="mt-8">
                گموریا موزه‌ای است برای دیدن و شناختن: سنگ‌های قیمتی و نیمه‌قیمتی،
                بلورها و نمونه‌های کانی‌شناسی، هر یک با خاستگاه، کارت فنی و روایتی
                که آن را از یک نمونهٔ معمولی جدا می‌کند.
              </Prose>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <ButtonLink href="#sections" size="lg">
                  گشتی در بخش‌های موزه
                </ButtonLink>
                <ButtonLink href="/admin" variant="ghost" size="lg">
                  ورود مدیریت
                </ButtonLink>
              </div>

              <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-sage-500">
                <Badge tone="gold">فاز {APP_PHASE.number} — {APP_PHASE.name}</Badge>
                <span className="bidi-plaintext">
                  این موزه هم‌اکنون در حال ساخت است؛ مجموعهٔ اشیا در فاز ۱ و ۲ منتشر می‌شود.
                </span>
              </p>
            </div>

            {/* A typographic "vitrine": the museum label before the objects exist. */}
            <div className="relative mx-auto w-full max-w-sm animate-rise lg:mx-0">
              <div className="relative border border-gold-400/20 bg-gradient-to-b from-emerald-900/40 via-obsidian-900/60 to-obsidian-950 p-9">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 mx-auto h-px w-2/3 bg-gradient-to-l from-transparent via-gold-400/60 to-transparent"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 mx-auto h-px w-1/3 bg-gradient-to-l from-transparent via-gold-400/40 to-transparent"
                />
                <div className="flex flex-col items-center text-center">
                  <Wordmark size="lg" />
                  <p className="mt-6 font-body text-[12.5px] leading-[2] text-sage-400">
                    موزهٔ دیجیتال سنگ‌های قیمتی
                  </p>
                  <div className="my-6 h-px w-16 bg-gold-400/40" />
                  <dl className="w-full space-y-3 text-start text-[12px]">
                    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2.5">
                      <dt className="text-sage-500">مجموعه</dt>
                      <dd className="text-ivory-200">در حال شکل‌گیری</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2.5">
                      <dt className="text-sage-500">زبان</dt>
                      <dd className="text-ivory-200">فارسی</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-sage-500">فروش</dt>
                      <dd className="text-ivory-200">ندارد</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] text-sage-600">
                برچسب موزه — پیش از رسیدن نخستین شیء
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <Section
        id="sections"
        eyebrow="ساختار موزه"
        title="چهار بخش، یک مجموعه"
        description="گموریا از چهار لایه ساخته می‌شود: گالری اشیا، اطلس جغرافیایی، مجله و واژه‌نامه. هر بخش در فاز مشخصی از نقشهٔ راه به‌صورت کامل منتشر می‌شود."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {museumSections.map((section) => (
            <Card key={section.numeral} className="group">
              <CardBody className="flex h-full flex-col">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <span className="font-display nums text-[32px] leading-none text-gold-400/35 transition-colors duration-300 group-hover:text-gold-400/60">
                    {section.numeral}
                  </span>
                  <Badge tone="muted">{section.phase}</Badge>
                </div>
                <Heading level={3} className="mb-2.5">
                  {section.title}
                </Heading>
                <p className="text-[13.5px] leading-[2] text-sage-400">{section.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <Section variant="band">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>دربارهٔ گموریا</Eyebrow>
            <Heading level={2} className="mt-4">
              موزه‌ای برای نگاه کردن، نه برای خریدن
            </Heading>
            <Prose className="mt-6">
              <p>
                سنگ وقتی از دل زمین بیرون می‌آید، تنها یک کانی نیست: نشانی از جایی
                است که در آن شکل گرفته، از فشاری که تحمل کرده و از قرن‌هایی که دست‌به‌دست
                شده است. گموریا این نشانه‌ها را گرد هم می‌آورد.
              </p>
              <p className="mt-4">
                اینجا هیچ سبد خریدی وجود ندارد و هیچ شیئی برای فروش عرضه نمی‌شود.
                هر سنگ یک مدخل موزه است، با شمارهٔ اموال، خاستگاه، مشخصات فنی و
                روایت خود.
              </p>
            </Prose>
          </div>

          <div className="lg:pt-14">
            <PullQuote attribution="از دفترچهٔ راهنمای موزه">
              هر سنگ سندی است؛ موزه وظیفه دارد آن سند را بخواند، نه اینکه آن را بفروشد.
            </PullQuote>

            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-4">
                <dt className="text-[11.5px] text-sage-500">دامنهٔ مجموعه</dt>
                <dd className="mt-1.5 text-[13.5px] leading-7 text-ivory-200">
                  سنگ‌های قیمتی و نیمه‌قیمتی، بلورها، کانی‌ها و نمونه‌های زمین‌شناسی
                </dd>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-4">
                <dt className="text-[11.5px] text-sage-500">زبان‌ها</dt>
                <dd className="mt-1.5 text-[13.5px] leading-7 text-ivory-200">
                  {PLANNED_LOCALES.filter((locale) => locale.enabled)
                    .map((locale) => locale.label)
                    .join(' · ')}
                  <span className="text-sage-500">
                    {' '}
                    — و آمادگی برای{' '}
                    {PLANNED_LOCALES.filter((locale) => !locale.enabled)
                      .map((locale) => locale.label)
                      .join(' و ')}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      {/* ── Roadmap ──────────────────────────────────────────────────────── */}
      <Section
        eyebrow="شفافیت"
        title="نقشهٔ راه ساخت"
        description="موزه در هشت فاز ساخته می‌شود. هیچ فازی «تمام‌شده» اعلام نمی‌شود مگر آنکه معیارهای پذیرش آن واقعاً آزموده شده باشند."
      >
        <ol className="grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase, index) => {
            const isCurrent = index === APP_PHASE.number;
            return (
              <li
                key={phase.n}
                className={
                  isCurrent
                    ? 'bg-emerald-900/40 px-5 py-5'
                    : 'bg-obsidian-900/80 px-5 py-5'
                }
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="nums font-display text-[21px] leading-none text-gold-400/60">
                    {phase.n}
                  </span>
                  {isCurrent && <Badge tone="emerald">اکنون</Badge>}
                </div>
                <p className="mt-3 text-[13px] leading-7 text-ivory-200">{phase.title}</p>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-[12.5px] text-sage-500">
          وضعیت دقیق سامانه را می‌توانید در{' '}
          <Link href="/api/health" className="text-gold-300 underline decoration-gold-400/40 underline-offset-4">
            نقطهٔ بررسی سلامت
          </Link>{' '}
          ببینید.
        </p>
      </Section>
    </>
  );
}
