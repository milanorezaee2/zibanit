import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { ResolvedImage } from '@/lib/media/storage';

/**
 * GEMORIA — the single image primitive for the catalogue.
 *
 * Every photograph in the museum goes through this component, whether it comes
 * from the build manifest (the six halls, the homepage) or from the media library
 * (an object photographed today). It differs from the Phase 1A component in one
 * respect: the source is a *resolved image* — src, intrinsic dimensions, and an
 * optional blur placeholder — rather than a manifest entry, because a catalogue
 * image may have neither a manifest row nor a blur.
 *
 * Layout stability is unconditional: the wrapper always has an aspect ratio before
 * the bytes arrive, so a slow connection costs paint time and never a shift.
 *
 * When there is no image at all, the caller gets neither a grey rectangle nor a
 * broken icon: `fallback` is rendered, and the museum shows a vitrine.
 */
export interface MuseumImageProps {
  image: ResolvedImage | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** CSS aspect-ratio (`3 / 4`). Defaults to the photograph's own. */
  ratio?: string;
  /** `free` lets the parent control height — used by full-bleed heroes. */
  className?: string;
  imgClassName?: string;
  quality?: number;
  fallback?: React.ReactNode;
}

export function MuseumImage({
  image,
  alt,
  sizes,
  priority = false,
  ratio,
  className,
  imgClassName,
  quality = 82,
  fallback = null,
}: MuseumImageProps) {
  const aspect = ratio === 'free' ? undefined : (ratio ?? (image ? `${image.width} / ${image.height}` : '4 / 5'));

  if (!image) {
    return (
      <div
        className={cn('relative overflow-hidden bg-paper-raised', className)}
        style={aspect ? { aspectRatio: aspect } : undefined}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-paper-raised', className)}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        {...(image.blurDataURL
          ? { placeholder: 'blur' as const, blurDataURL: image.blurDataURL }
          : { placeholder: 'empty' as const })}
        className={cn('object-cover', imgClassName)}
      />
    </div>
  );
}
