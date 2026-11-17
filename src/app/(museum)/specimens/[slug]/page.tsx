import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getSpecimenBySlug } from '@/db/queries/specimens';
import { Breadcrumbs } from '@/components/museum/breadcrumbs';
import { SpecimenGallery, type GalleryImage } from '@/components/museum/specimen-gallery';
import { ScientificRecord } from '@/components/museum/scientific-record';
import { SpecimenCard } from '@/components/museum/specimen-card';
import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button';
import { TAXONOMY_LABELS, type TaxonomyKind } from '@/content/mineral';
import { Prose } from '@/components/typography/prose';

/**
 * One object.
 *
 * Section order follows how a visitor reads an exhibit: what it is (photograph,
 * name, family, one paragraph), then what it looks like up close (the gallery),
 * then the measurements, then the science, then where it came from, then what else
 * resembles it, and finally the doors out of the room.
 *
 * Two rules govern the whole page:
 *
 *   • a section is rendered only if the data behind it exists — no empty headings,
 *     no «—» placeholders, no invented values
 *   • `notFound()` for anything that is not published, so an archived object is
 *     indistinguishable from one that never existed
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const specimen = await getSpecimenBySlug(slug);

  if (!specimen) {
    return { title: 'نمونه یافت نشد', robots: { index: false, follow: false } };
  }

  const description =
    specimen.summary ??
    [specimen.title, specimen.scientificName, specimen.classification[0]?.label]
      .filter(Boolean)
      .join(' — ');

  return {
    title: specimen.title,
    description,
    alternates: { canonical: `/specimens/${encodeURIComponent(specimen.slug)}` },
    openGraph: {
      type: 'article',
      title: `${specimen.title} — موزهٔ گموریا`,
      description,
      ...(specimen.image
        ? {
            images: [
              {
                url: specimen.image.src,
                width: specimen.image.width,
                height: specimen.image.height,
                alt: specimen.image.alt,
              },
            ],
          }
        : {}),
    },
  };
}

const fa = (value: number) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

export default async function SpecimenPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();

  const { slug } = await params;
  const specimen = await getSpecimenBySlug(slug);
  if (!specimen) notFound();

  /* The gallery is the primary photograph followed by the attached gallery images.
     Only images are shown here; a video or a 3D model has a record, a role and an
     attachment point, but no viewer yet — and a fake viewer would be worse than an
     honest absence. */
  const gallery: GalleryImage[] = [
    ...(specimen.image
      ? [{ id: 'primary', image: specimen.image, caption: specimen.image.alt }]
      : []),
    ...specimen.gallery
      .filter((entry) => entry.image !== null)
      .map((entry) => ({ id: entry.id, image: entry.image!, caption: entry.caption })),
  ];

  const nonImageMedia = specimen.gallery.filter((entry) => entry.image === null);
  const primaryOrigin = specimen.provenance[0];
  const classification = specimen.classification.reduce<Record<string, string>>((result, entry) => {
    result[entry.kind] = entry.label;
    return result;
  }, {});

  const breadcrumbs = [
    { label: 'خانه', href: '/' },
    { label: 'تالارها', href: '/halls' },
    ...(specimen.halls[0]
      ? [
          {
            label: specimen.halls[0].title,
            href: `/halls/${encodeURIComponent(specimen.halls[0].slug)}`,
          },
        ]
      : []),
    { label: specimen.title },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...('href' in item && item.href
        ? { item: new URL(item.href, process.env.APP_URL ?? 'http://localhost').toString() }
        : {}),
    })),
  };

  return (
    <article className="pb-section pt-[calc(var(--header-height)+2.5rem)]">
      <script
        type="application/ld+json"
        // Only breadcrumbs are emitted: the object is not a product, and marking it
        // up as one would be an untrue structured-data claim.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Container width="museum">
        <Breadcrumbs items={breadcrumbs} />

        {/* ── 1 & 2. The object and its gallery ────────────────────────────── */}
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            {gallery.length > 0 ? (
              <SpecimenGallery images={gallery} title={specimen.title} />
            ) : (
              <div
                className="flex items-center justify-center border border-white/[0.06] bg-surface/40"
                style={{ aspectRatio: '4 / 5' }}
              >
                <p className="max-w-[16rem] text-center text-small text-sage-600">
                  این نمونه هنوز عکسی ندارد. تصویر پس از ثبت در کتابخانهٔ رسانه در همین
                  ویترین نمایش داده می‌شود.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
              <p className="label-fa">نمونهٔ موزه</p>

              <h1 className="mt-4 font-display text-title text-ivory-50">{specimen.title}</h1>

              {(specimen.scientificName ?? specimen.subtitle) && (
                <p
                  dir="ltr"
                  className="mt-3 font-latin text-[1.05rem] tracking-[0.14em] text-gold-300/90 uppercase"
                >
                  {specimen.scientificName ?? specimen.subtitle}
                </p>
              )}

              {specimen.summary && (
                <p className="mt-6 text-lead text-ivory-200/90">{specimen.summary}</p>
              )}

              <dl className="mt-8 space-y-3 border-t border-white/[0.07] pt-6 text-small">
                {classification.mineral_family && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sage-500">{TAXONOMY_LABELS.mineral_family.fa}</dt>
                    <dd className="text-ivory-200">{classification.mineral_family}</dd>
                  </div>
                )}
                {primaryOrigin && (primaryOrigin.countryName ?? primaryOrigin.region) && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sage-500">خاستگاه</dt>
                    <dd className="text-ivory-200">
                      {[primaryOrigin.countryName, primaryOrigin.region].filter(Boolean).join('، ')}
                    </dd>
                  </div>
                )}
                {specimen.weightCt && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sage-500">وزن</dt>
                    <dd className="nums text-ivory-200" dir="ltr">
                      {fa(Number(specimen.weightCt))} ct
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sage-500">شمارهٔ اموال</dt>
                  <dd className="nums text-ivory-300" dir="ltr">
                    {specimen.inventoryNo}
                  </dd>
                </div>
              </dl>

              {nonImageMedia.length > 0 && (
                <p className="mt-6 border-s-2 border-gold-500/30 ps-4 text-[12px] leading-6 text-sage-500">
                  {fa(nonImageMedia.length)} رسانهٔ غیرتصویری (ویدئو یا مدل) برای این نمونه ثبت
                  شده است. نمایشگر آن‌ها در فاز بعدی موزه افزوده می‌شود.
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {specimen.halls[0] && (
                  <ButtonLink
                    href={`/halls/${encodeURIComponent(specimen.halls[0].slug)}`}
                    variant="outline"
                    size="sm"
                  >
                    بازگشت به تالار {specimen.halls[0].title}
                  </ButtonLink>
                )}
                <ButtonLink href="/search" variant="ghost" size="sm">
                  جست‌وجو در مجموعه
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. The scientific record ─────────────────────────────────────── */}
        <section className="mt-section" aria-labelledby="specimen-science">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-3">
              <h2 id="specimen-science" className="label-fa">
                مشخصات علمی
              </h2>
              <p className="mt-3 max-w-[18rem] text-[12px] leading-6 text-sage-600">
                فقط ویژگی‌های ثبت‌شده نمایش داده می‌شوند. مقادیر علمی بدون منبع معتبر در
                موزه ثبت نمی‌شوند.
              </p>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <ScientificRecord specimen={specimen} />

              {specimen.classification.length > 1 && (
                <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {specimen.classification.map((entry) => (
                    <div key={`${entry.kind}-${entry.code}`} className="flex flex-col gap-1">
                      <dt className="text-[11.5px] text-sage-600">
                        {TAXONOMY_LABELS[entry.kind as TaxonomyKind]?.fa ?? entry.kind}
                      </dt>
                      <dd className="text-small text-ivory-200">
                        {entry.label}
                        {entry.latinName && (
                          <span
                            dir="ltr"
                            className="ms-2 font-latin text-[0.72rem] tracking-[0.08em] text-gold-400/70 uppercase"
                          >
                            {entry.latinName}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. The scientific introduction ───────────────────────────────── */}
        {(specimen.story ?? specimen.formation ?? specimen.history ?? specimen.notes) && (
          <section className="mt-section border-t border-white/[0.06] pt-14" aria-labelledby="specimen-story">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-3">
                <h2 id="specimen-story" className="label-fa">
                  معرفی علمی
                </h2>
              </div>
              <div className="space-y-10 lg:col-span-8 lg:col-start-5">
                {specimen.story && (
                  <div>
                    <h3 className="mb-3 text-small text-gold-300/90">توضیح علمی</h3>
                    <Prose variant="body">{specimen.story}</Prose>
                  </div>
                )}
                {specimen.formation && (
                  <div>
                    <h3 className="mb-3 text-small text-gold-300/90">نحوهٔ شکل‌گیری</h3>
                    <Prose variant="body">{specimen.formation}</Prose>
                  </div>
                )}
                {specimen.history && (
                  <div>
                    <h3 className="mb-3 text-small text-gold-300/90">اطلاعات تاریخی</h3>
                    <Prose variant="body">{specimen.history}</Prose>
                  </div>
                )}
                {specimen.notes && (
                  <div>
                    <h3 className="mb-3 text-small text-gold-300/90">توضیحات تکمیلی</h3>
                    <Prose variant="body">{specimen.notes}</Prose>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 5. Geographic origin ─────────────────────────────────────────── */}
        {(specimen.provenance.length > 0 || specimen.provenanceText) && (
          <section
            className="mt-section border-t border-white/[0.06] pt-14"
            aria-labelledby="specimen-origin"
          >
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-3">
                <h2 id="specimen-origin" className="label-fa">
                  منشأ جغرافیایی
                </h2>
                <p className="mt-3 max-w-[18rem] text-[12px] leading-6 text-sage-600">
                  اطلس تعاملی در فاز بعدی به همین داده‌ها متصل می‌شود.
                </p>
              </div>

              <div className="lg:col-span-8 lg:col-start-5">
                {specimen.provenanceText && (
                  <p className="mb-6 text-body text-sage-300">{specimen.provenanceText}</p>
                )}

                <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                  {specimen.provenance.map((place) => (
                    <li key={place.id} className="py-4">
                      <p className="text-body text-ivory-200">
                        {[place.locality, place.region, place.countryName].filter(Boolean).join('، ') ||
                          'محل ثبت‌شده'}
                      </p>
                      {place.countryCode && (
                        <p dir="ltr" className="mt-1 text-[11.5px] tracking-[0.16em] text-sage-600 uppercase">
                          {place.countryCode}
                        </p>
                      )}
                      {place.note && <p className="mt-2 text-small text-sage-500">{place.note}</p>}
                    </li>
                  ))}
                </ul>

                {specimen.provenance.some((place) => place.latitude && place.longitude) && (
                  <p className="mt-4 text-[11.5px] text-sage-600">
                    مختصات جغرافیایی ثبت شده و برای نمایش روی نقشهٔ اطلس آماده است.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. What else resembles it ────────────────────────────────────── */}
        {specimen.related.length > 0 && (
          <section
            className="mt-section border-t border-white/[0.06] pt-14"
            aria-labelledby="specimen-related"
          >
            <h2 id="specimen-related" className="label-fa mb-8">
              نمونه‌های مرتبط
            </h2>
            <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {specimen.related.map((card) => (
                <li key={card.id}>
                  <SpecimenCard specimen={card} size="compact" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── 7. The doors out of the room ─────────────────────────────────── */}
        <section className="mt-section border-t border-white/[0.06] pt-14" aria-labelledby="specimen-nav">
          <h2 id="specimen-nav" className="label-fa mb-8">
            ادامهٔ مسیر
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specimen.halls.length > 0 && (
              <nav aria-label="تالارهای این نمونه">
                <h3 className="mb-3 text-small text-gold-300/90">تالارها</h3>
                <ul className="space-y-2">
                  {specimen.halls.map((hall) => (
                    <li key={hall.slug}>
                      <Link
                        href={`/halls/${encodeURIComponent(hall.slug)}`}
                        className="text-small text-sage-400 transition-colors hover:text-gold-200"
                      >
                        {hall.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {specimen.articles.length > 0 && (
              <nav aria-label="مقالات مرتبط">
                <h3 className="mb-3 text-small text-gold-300/90">در دانشنامه</h3>
                <ul className="space-y-2">
                  {specimen.articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/encyclopedia/${encodeURIComponent(article.slug)}`}
                        className="text-small text-sage-400 transition-colors hover:text-gold-200"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <nav aria-label="جست‌وجوی بیشتر">
              <h3 className="mb-3 text-small text-gold-300/90">کاوش بیشتر</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={classification.mineral_family ? `/search?family=${encodeURIComponent(classification.mineral_family)}` : '/search'}
                    className="text-small text-sage-400 transition-colors hover:text-gold-200"
                  >
                    جست‌وجو در مجموعهٔ موزه
                  </Link>
                </li>
                <li>
                  <Link
                    href="/encyclopedia"
                    className="text-small text-sage-400 transition-colors hover:text-gold-200"
                  >
                    دانشنامهٔ موزه
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </section>

      </Container>
    </article>
  );
}
