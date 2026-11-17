import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SectionHeading } from './section-heading';
import { encyclopediaTopics } from '@/content/encyclopedia';

/**
 * The encyclopedia, as an index.
 *
 * A museum's reference section is a list of questions, not a list of articles —
 * so the five axes are numbered like catalogue entries, each with the Latin name
 * a specialist would look up and the question a visitor actually asks.
 *
 * The rows are index entries rather than article links: an axis is a question, and
 * the articles that answer it are written and cited one at a time. The section does
 * link to the encyclopedia index, which exists from Phase 1B and lists whatever has
 * actually been published.
 */
const persianNumber = (value: number): string =>
  new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false }).format(value);

export function EncyclopediaPreview() {
  return (
    <section id="encyclopedia" className="reveal py-section" aria-labelledby="encyclopedia-heading">
      <Container width="museum">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              titleId="encyclopedia-heading"
              eyebrow="Encyclopedia"
              title="دانشنامهٔ سنگ"
              description="پنج محوری که موزه برای شناخت هر کانی به کار می‌برد؛ از شبکهٔ بلور تا جغرافیای پیدایش."
              className="mb-8"
            />
            <p className="max-w-reading text-small text-sage-500">
              مدخل‌ها همراه با مجموعهٔ نمونه‌ها منتشر می‌شوند. هیچ مقاله‌ای پیش از
              بازبینی علمی در موزه منتشر نخواهد شد.
            </p>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <ol className="border-t border-white/[0.07]">
              {encyclopediaTopics.map((topic, index) => (
                <li key={topic.slug} className="border-b border-white/[0.07]">
                  <div className="group flex items-baseline gap-5 py-6 transition-colors duration-300 hover:bg-white/[0.015] sm:gap-8 sm:py-7">
                    <span className="nums shrink-0 font-display text-[0.95rem] text-gold-500/60" aria-hidden="true">
                      {persianNumber(index + 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-bold text-subtitle text-ivory-100">{topic.titleFa}</h3>
                        <span
                          dir="ltr"
                          className="font-latin text-[0.72rem] tracking-[0.18em] text-sage-600 uppercase"
                        >
                          {topic.titleEn}
                        </span>
                      </div>
                      <p className="mt-2 text-small text-sage-400">{topic.question}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-7 text-small text-sage-600">
              مدخل‌های دانشنامه پس از نگارش و بازبینی علمی منتشر می‌شوند.{' '}
              <Link
                href="/encyclopedia"
                className="text-gold-300 underline decoration-gold-500/30 underline-offset-[6px] transition-colors hover:text-gold-200 hover:decoration-gold-400/70"
              >
                ورود به دانشنامه
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
