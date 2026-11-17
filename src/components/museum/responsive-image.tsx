import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { MediaEntry } from '@/content/media.generated';

/**
 * Every photograph in the museum goes through this component.
 *
 * It always uses `fill` inside a wrapper whose aspect ratio is known **before**
 * the image loads, so a slow connection costs paint time but never causes layout
 * shift. The blur placeholder comes from the generated manifest: a photograph
 * resolves out of its own shadow instead of popping in from nothing.
 *
 * `sizes` is required rather than defaulted, because the browser cannot guess how
 * wide a gallery column will be and a wrong guess downloads the wrong file.
 */
export interface ResponsiveImageProps {
  media: MediaEntry;
  alt: string;
  sizes: string;
  /** Only the hero image is above the fold. */
  priority?: boolean;
  /**
   * CSS aspect-ratio, e.g. `3 / 4`. Defaults to the photograph's own.
   * `free` fills whatever box the parent gives it — used by the hero, where the
   * section's height is controlled by the viewport, not by the photograph.
   */
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
    <div
      className={cn('relative overflow-hidden bg-obsidian-850', className)}
      style={ratio === 'free' ? undefined : { aspectRatio: ratio ?? `${media.width} / ${media.height}` }}
    >
      <Image
        src={media.src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder="blur"
        blurDataURL={media.blurDataURL}
        className={cn('object-cover', imgClassName)}
      />
    </div>
  );
}
