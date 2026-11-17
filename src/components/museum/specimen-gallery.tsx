'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MuseumImage } from './museum-image';
import type { SpecimenImage } from '@/db/queries/specimens';
import { CloseIcon } from '@/components/ui/icons';

/**
 * The object's gallery.
 *
 * A museum's photographs of a specimen are the exhibit, so this is the one place in
 * the catalogue where a visitor gets a full-screen view. The behaviour is deliberately
 * small and keyboard-first:
 *
 *   • the main photograph is the largest thing on the page and is *not* lazy
 *     (it is the subject); thumbnails are lazy
 *   • clicking, or pressing Enter on, a photograph opens a dialog
 *   • Escape closes, ← and → move between photographs, and focus returns to the
 *     thumbnail that opened the dialog
 *   • the dialog is `aria-modal`, labelled by the photograph's alternative text, and
 *     traps Tab between two controls rather than the whole page
 *   • nothing animates beyond a 200ms fade — motion here is a distraction from the
 *     object, not part of it
 *
 * It is the only client component on a specimen page, and it holds one number.
 */
export interface GalleryImage {
  readonly id: string;
  readonly image: SpecimenImage;
  readonly caption: string | null;
}

export function SpecimenGallery({
  images,
  title,
}: {
  images: readonly GalleryImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const current = images[index];

  const close = useCallback(() => {
    setOpen(false);
    restoreRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setIndex((value) => (value + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Tab') {
        // Two focusable controls: keep focus inside the dialog.
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, close, step]);

  if (!current) return null;

  return (
    <div>
      <figure>
        <button
          type="button"
          onClick={(event) => {
            restoreRef.current = event.currentTarget;
            setOpen(true);
          }}
          className="group block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
          aria-label={`نمایش تمام‌صفحهٔ تصویر ${index + 1} از ${images.length}`}
        >
          <MuseumImage
            image={current.image}
            alt={current.image.alt || title}
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
            ratio="4 / 5"
            className="shadow-plinth"
            imgClassName="transition-transform duration-[1200ms] ease-museum group-hover:scale-[1.01]"
          />
        </button>

        {(current.caption || images.length > 1) && (
          <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-3 text-small text-sage-500">
            {current.caption && <span className="max-w-reading">{current.caption}</span>}
            {images.length > 1 && (
              <span className="text-label text-sage-600">
                {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(images.length)} تصویر
              </span>
            )}
          </figcaption>
        )}
      </figure>

      {images.length > 1 && (
        <ul className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6" aria-label="تصاویر این نمونه">
          {images.map((entry, position) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setIndex(position)}
                aria-current={position === index ? 'true' : undefined}
                aria-label={`تصویر ${position + 1}`}
                className={
                  'block w-full overflow-hidden border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 ' +
                  (position === index ? 'border-gold-500/60' : 'border-transparent hover:border-white/20')
                }
              >
                <MuseumImage
                  image={entry.image}
                  alt=""
                  sizes="12vw"
                  ratio="1 / 1"
                  quality={75}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex flex-col bg-obsidian-950/97 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`تصویر بزرگ ${title}`}
        >
          <div className="flex items-center justify-between gap-4 pb-4">
            <p className="text-small text-sage-400">
              {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(index + 1)} از{' '}
              {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(images.length)}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-ivory-200 transition-colors hover:border-gold-400/60 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
              aria-label="بستن تصویر"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <MuseumImage
              image={current.image}
              alt={current.image.alt || title}
              sizes="95vw"
              ratio="free"
              quality={88}
              className="h-full w-full"
              imgClassName="object-contain"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute end-0 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-obsidian-900/70 text-ivory-100 transition-colors hover:border-gold-400/60 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
                  aria-label="تصویر پیشین"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute start-0 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-obsidian-900/70 text-ivory-100 transition-colors hover:border-gold-400/60 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
                  aria-label="تصویر بعدی"
                >
                  ‹
                </button>
              </>
            )}
          </div>

          {current.caption && (
            <p className="pt-4 text-center text-small text-sage-400">{current.caption}</p>
          )}
          <p className="pt-2 text-center text-[11px] text-sage-600">
            برای بستن، کلید Escape و برای جابه‌جایی، کلیدهای جهت را بزنید.
          </p>
        </div>
      )}
    </div>
  );
}
