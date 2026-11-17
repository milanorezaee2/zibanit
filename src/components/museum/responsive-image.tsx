import type { MediaEntry } from '@/content/media.generated';
import { MuseumImage } from './museum-image';

/**
 * A build-time photograph, adapted to the catalogue's image primitive.
 *
 * Phase 1A introduced this component for the nine photographs that ship with the
 * application. Phase 1B generalised the primitive (`MuseumImage`) so that objects
 * from the media library render through exactly the same wrapper — including the
 * aspect-ratio reservation that keeps Cumulative Layout Shift at zero. This file
 * remains as the manifest-entry adapter so no Phase 1A call site had to change.
 */
export interface ResponsiveImageProps {
  media: MediaEntry;
  alt: string;
  sizes: string;
  priority?: boolean;
  ratio?: string;
  className?: string;
  imgClassName?: string;
  quality?: number;
}

export function ResponsiveImage({
  media,
  alt,
  sizes,
  priority = false,
  ratio,
  className,
  imgClassName,
  quality = 82,
}: ResponsiveImageProps) {
  return (
    <MuseumImage
      image={{
        src: media.src,
        width: media.width,
        height: media.height,
        blurDataURL: media.blurDataURL,
      }}
      alt={alt}
      sizes={sizes}
      priority={priority}
      ratio={ratio}
      className={className}
      imgClassName={imgClassName}
      quality={quality}
    />
  );
}
