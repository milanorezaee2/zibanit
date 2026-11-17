import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getArticleBySlug } from '@/db/queries/articles';
import { Breadcrumbs } from '@/components/museum/breadcrumbs';
import { MuseumImage } from '@/components/museum/museum-image';
import { Container } from '@/components/ui/container';
import { Prose } from '@/components/typography/prose';
import { EmptyState } from '@/components/museum/empty-state';
import { ButtonLink } from '@/components/ui/button';

/**
 * One encyclopedia entry.
 *
 * The body is stored as plain text with blank lines between paragraphs, and it is
 * rendered as paragraphs — not as HTML. That is a deliberate constraint: the museum
 * does not execute markup written by whoever holds the editor, so an article cannot
 * smuggle a script, an iframe or a tracking pixel into a page. When rich text is
 * genuinely needed, it will be a restricted document model, not `innerHTML`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: 'مقاله یافت نشد', robots: { index: false, follow: false } };
  }

  return {
    title: article.title,
    description: article.excerpt ?? article.title,
    alternates: { canonical: `/encyclopedia/${encodeURIComponent(article.slug)}` },
    openGraph: {
      type: 'article',
      title: `${article.title} — دانشنامهٔ گموریا`,
      description: article.excerpt ?? article.title,
      ...(article.image
        ? { images: [{ url: article.image.src, width: article.image.width, height: article.image.height }] }
        : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const paragraphs = (article.body ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <article className="pb-section pt-[calc(var(--header-height)+3.5rem)]">
      <Container width="museum">
        <Breadcrumbs
          items={[
            { label: 'خانه', href: '/' },
            { label: 'دانشنامه', href: '/encyclopedia' },
            { label: article.title },
          ]}
        />

        <header className="mt-10 max-w-reading">
          <h1 className="font-display text-title text-ivory-50">{article.title}</h1>
          {article.latinTitle && (
            <p
              dir="ltr"
              className="mt-4 font-latin text-[0.95rem] tracking-[0.16em] text-gold-300/90 uppercase"
            >
              {article.latinTitle}
            </p>
          )}
          {article.excerpt && <p className="mt-6 text-lead text-ivory-200/90">{article.excerpt}</p>}
          {article.publishedAt && (
            <p className="mt-6 text-small text-sage-600">
              انتشار:{' '}
              <time dateTime={article.publishedAt} className="nums">
                {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(
                  new Date(article.publishedAt),
                )}
              </time>
            </p>
          )}
        </header>

        {article.image && (
          <div className="mt-10">
            <MuseumImage
              image={article.image}
              alt={article.image.alt}
              sizes="(min-width: 1024px) 70vw, 100vw"
              ratio="16 / 9"
              priority
              className="shadow-plinth"
            />
          </div>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            {paragraphs.length > 0 ? (
              <Prose variant="body" className="max-w-reading space-y-6">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </Prose>
            ) : (
              <p className="text-body text-sage-500">متن این مقاله هنوز ثبت نشده است.</p>
            )}

            {article.sources.length > 0 && (
              <section className="mt-14 border-t border-white/[0.07] pt-8" aria-labelledby="sources">
                <h2 id="sources" className="label-fa mb-4">
                  منابع
                </h2>
                <ol className="space-y-3 text-small text-sage-400">
                  {article.sources.map((source) => (
                    <li key={source.id} className="flex flex-wrap items-baseline gap-2">
                      <span>{source.title}</span>
                      {source.publisher && <span className="text-sage-600">— {source.publisher}</span>}
                      {source.year && <span className="nums text-sage-600">({source.year})</span>}
                      {source.url && (
                        <a
                          href={source.url}
                          rel="noopener noreferrer nofollow"
                          target="_blank"
                          dir="ltr"
                          className="text-gold-300 underline decoration-gold-500/30 underline-offset-4 hover:text-gold-200"
                        >
                          پیوند
                          <span className="sr-only"> (در پنجرهٔ تازه)</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4" aria-labelledby="illustrating">
            <h2 id="illustrating" className="label-fa mb-5">
              نمونه‌های مرتبط
            </h2>

            {article.specimens.length === 0 ? (
              <EmptyState
                title="هنوز نمونه‌ای به این مقاله پیوند نخورده است"
                description="هر مقاله با نمونه‌هایی از مجموعه پیوند می‌خورد که پدیدهٔ توصیف‌شده را نشان می‌دهند."
                className="px-6 py-10"
                action={
                  <ButtonLink href="/search" variant="outline" size="sm">
                    جست‌وجو در مجموعه
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="space-y-5">
                {article.specimens.map((specimen) => (
                  <li key={specimen.slug}>
                    <Link
                      href={`/specimens/${encodeURIComponent(specimen.slug)}`}
                      className="group flex items-center gap-4"
                    >
                      {specimen.image && (
                        <MuseumImage
                          image={specimen.image}
                          alt={specimen.image.alt}
                          sizes="96px"
                          ratio="1 / 1"
                          quality={75}
                          className="w-20 shrink-0"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block font-display text-subtitle text-ivory-100 group-hover:text-gold-100">
                          {specimen.title}
                        </span>
                        {specimen.subtitle && (
                          <span
                            dir="ltr"
                            className="mt-1 block font-latin text-[0.7rem] tracking-[0.14em] text-gold-400/70 uppercase"
                          >
                            {specimen.subtitle}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </Container>
    </article>
  );
}
