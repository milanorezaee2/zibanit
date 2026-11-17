import { ResponsiveImage } from './responsive-image';
import type { FeaturedSpecimen } from '@/db/queries/specimens';
import { media } from '@/content/media.generated';

/**
 * One object in the collection.
 *
 * Deliberately not a product card: no price, no badge, no "add" affordance. The
 * hierarchy is what a museum label actually carries — the object's name, its
 * Latin name, where it came from, and one measured fact.
 *
 * It is not a link yet. Detail pages arrive with the hall pages in Phase 1B;
 * shipping a link to a route that does not exist would be worse than shipping a
 * label that is simply read.
 */
export interface SpecimenCardProps {
  specimen: FeaturedSpecimen;
  /** First card in a row is the one the browser may preload. */
  priority?: boolean;
}

export function SpecimenCard({ specimen, priority = false }: SpecimenCardProps) {
  return (
    <article className="group flex h-full flex-col">
      {specimen.image ? (
        <ResponsiveImage
          media={{
            src: specimen.image.src,
            width: specimen.image.width,
            height: specimen.image.height,
            blurDataURL: '',
          }}
          alt={specimen.image.alt}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
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
        <h3 className="font-display text-subtitle text-ivory-100">{specimen.title}</h3>

        {specimen.subtitle && (
          <p
            dir="ltr"
            className="mt-2 self-start font-latin text-small tracking-[0.12em] text-gold-400/80 uppercase"
          >
            {specimen.subtitle}
          </p>
        )}

        {specimen.summary && (
          <p className="mt-4 line-clamp-3 text-small text-sage-400">{specimen.summary}</p>
        )}

        <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.06] pt-4 text-small text-sage-500">
          {specimen.provenance && (
            <div className="flex items-center gap-2">
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
        </dl>
      </div>
    </article>
  );
}

/** Fallback used when a record has no media row at all. */
export const specimenPlaceholder = media.editorial;
