import Link from 'next/link';
import { MuseumImage } from './museum-image';
import type { SpecimenCard as SpecimenCardModel } from '@/db/queries/specimens';
import { ArrowStart } from '@/components/ui/icons';

/**
 * One object in the collection.
 *
 * Deliberately not a product card: no price, no badge, no "add" affordance. The
 * hierarchy is what a museum label actually carries — the object's name, its
 * Latin name, where it came from, and one measured fact.
 *
 * From Phase 1B it is a link, because the object now has a page of its own. The
 * whole card is the target (a museum label is a single thing to click, not a title
 * with a trailing arrow), and the focus ring is on the anchor so a keyboard
 * visitor sees exactly what they are about to open.
 */
export interface SpecimenCardProps {
  specimen: SpecimenCardModel;
  /** First card in a row is the one the browser may preload. */
  priority?: boolean;
  /** Compact variant for the related-object rail. */
  size?: 'default' | 'compact';
}

export function SpecimenCard({ specimen, priority = false, size = 'default' }: SpecimenCardProps) {
  return (
    <article className="group h-full">
      <Link
        href={`/specimens/${encodeURIComponent(specimen.slug)}`}
        className="flex h-full flex-col focus-visible:outline-none"
      >
        {specimen.image ? (
          <MuseumImage
            image={specimen.image}
            alt={specimen.image.alt}
            sizes={
              size === 'compact'
                ? '(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw'
                : '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw'
            }
            ratio="4 / 5"
            priority={priority}
            className="mb-6"
            imgClassName="transition-transform duration-[900ms] ease-museum group-hover:scale-[1.02]"
          />
        ) : (
          // No photograph yet: a quiet vitrine with the object's initial letter in
          // Naskh, rather than a grey rectangle pretending to be an image.
          <div
            className="mb-6 flex items-center justify-center border border-white/[0.06] bg-surface/40"
            style={{ aspectRatio: '4 / 5' }}
            aria-hidden="true"
          >
            <span className="font-display text-[3.5rem] leading-none text-gold-500/25">
              {specimen.title.trim().charAt(0)}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <h3 className="font-display text-subtitle text-ivory-100 transition-colors duration-300 group-hover:text-gold-100">
            {specimen.title}
          </h3>

          {(specimen.subtitle ?? specimen.scientificName) && (
            <p
              dir="ltr"
              className="mt-2 self-start font-latin text-small tracking-[0.12em] text-gold-400/80 uppercase"
            >
              {specimen.subtitle ?? specimen.scientificName}
            </p>
          )}

          {specimen.summary && (
            <p className="mt-4 line-clamp-3 text-small text-sage-400">{specimen.summary}</p>
          )}

          <dl className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 text-small text-sage-500">
            {specimen.mineralFamily && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">خانوادهٔ کانی‌شناسی</dt>
                <dd>{specimen.mineralFamily}</dd>
              </div>
            )}
            {specimen.provenance && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">خاستگاه</dt>
                <dd className="bidi-plaintext">{specimen.provenance}</dd>
              </div>
            )}
            {specimen.weightCt && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">وزن</dt>
                <dd className="nums" dir="ltr">
                  {specimen.weightCt} ct
                </dd>
              </div>
            )}
            <span className="ms-auto inline-flex items-center gap-1.5 text-gold-300/80">
              <span className="sr-only">صفحهٔ </span>
              <span aria-hidden="true">ببینید</span>
              <ArrowStart className="h-3.5 w-3.5 transition-transform duration-500 ease-museum group-hover:-translate-x-1" />
            </span>
          </dl>
        </div>
      </Link>
    </article>
  );
}
