import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { listArticles } from '@/db/queries/articles';
import { encyclopediaTopics } from '@/content/encyclopedia';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/museum/empty-state';
import { MuseumImage } from '@/components/museum/museum-image';

export const metadata: Metadata = {
  title: 'دانشنامه',
  description:
    'دانشنامهٔ موزهٔ گموریا: پنج محور برای شناخت سنگ‌ها و کانی‌ها — ساختار بلوری، سختی، ترکیب شیمیایی، شکل‌گیری و پراکندگی جغرافیایی.',
  alternates: { canonical: '/encyclopedia' },
};

const persianNumber = (value: number): string =>
  new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false }).format(value);

/**
 * The encyclopedia index.
 *
 * Two layers, deliberately distinct: the five *axes* are structural (they are how
 * the museum organises a question) and the *articles* are content (they are written
 * and cited by a curator). On a fresh database the axes are shown and the articles
 * are absent — with an honest explanation rather than a placeholder essay.
 */
export default async function EncyclopediaIndexPage() {
  await connection();
  const articles = await listArticles(24);

  return (
    <div className="pt-[calc(var(--header-height)+3.5rem)] pb-section">
      <Container width="museum">
        <header className="mb-14 max-w-reading">
          <p className="mb-5 flex items-center gap-3">
            <span className="label-fa">دانشنامه</span>
            <span className="h-px w-10 bg-gold-500/60" aria-hidden="true" />
          </p>
          <h1 className="font-body text-hero font-bold text-ink">پنج محور برای شناخت یک کانی</h1>
          <p className="mt-5 text-body text-ink-muted">
            دانشنامهٔ موزه به‌جای فهرست کردن سنگ‌ها، پرسش‌هایی را سازمان می‌دهد که دربارهٔ
            هر کانی می‌توان پرسید. هر مقاله با منابع علمی منتشر می‌شود و به نمونه‌هایی از
            مجموعه پیوند می‌خورد که همان پدیده را نشان می‌دهند.
          </p>
        </header>

        <section aria-labelledby="axes" className="mb-16">
          <h2 id="axes" className="label-fa mb-6">
            محورهای دانشنامه
          </h2>
          <ol className="grid gap-px overflow-hidden border border-line bg-paper-raised sm:grid-cols-2 lg:grid-cols-3">
            {encyclopediaTopics.map((topic, index) => (
              <li key={topic.slug} className="bg-paper p-6 sm:p-8">
                <span className="nums block font-display text-[0.95rem] text-accent/55" aria-hidden="true">
                  {persianNumber(index + 1)}
                </span>
                <h3 className="mt-3 font-display text-subtitle text-ink">{topic.titleFa}</h3>
                <p
                  dir="ltr"
                  className="mt-2 font-latin text-[0.72rem] tracking-[0.18em] text-ink-subtle uppercase"
                >
                  {topic.titleEn}
                </p>
                <p className="mt-4 text-small text-ink-muted">{topic.question}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="articles">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="articles" className="label-fa">
              مقالات منتشرشده
            </h2>
            <p className="text-small text-ink-subtle">
              {articles.length > 0
                ? `${new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(articles.length)} مقاله`
                : 'هنوز مقاله‌ای منتشر نشده است'}
            </p>
          </div>

          {articles.length === 0 ? (
            <EmptyState
              title="مقاله‌ای در دانشنامه منتشر نشده است"
              description="مدخل‌های دانشنامه پس از نوشته شدن، بازبینی علمی و ارجاع به منابع معتبر منتشر می‌شوند. تا آن زمان، ساختار پنج محور بالا پابرجاست."
              note="هیچ متن علمی ساختگی در موزه منتشر نمی‌شود."
            />
          ) : (
            <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/encyclopedia/${encodeURIComponent(article.slug)}`}
                    className="group block"
                  >
                    {article.image && (
                      <MuseumImage
                        image={article.image}
                        alt={article.image.alt}
                        sizes="(min-width: 1024px) 30vw, 92vw"
                        ratio="16 / 11"
                        className="mb-5"
                        imgClassName="transition-transform duration-[1000ms] ease-museum group-hover:scale-[1.02]"
                      />
                    )}
                    <h3 className="font-display text-subtitle text-ink group-hover:text-accent">
                      {article.title}
                    </h3>
                    {article.latinTitle && (
                      <p
                        dir="ltr"
                        className="mt-2 font-latin text-[0.72rem] tracking-[0.18em] text-accent/80 uppercase"
                      >
                        {article.latinTitle}
                      </p>
                    )}
                    {article.excerpt && (
                      <p className="mt-3 line-clamp-3 text-small text-ink-muted">{article.excerpt}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </div>
  );
}
