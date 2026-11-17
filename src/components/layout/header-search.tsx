'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { hallIndex } from '@/content/hall-index';
import { SearchIcon, CloseIcon } from '@/components/ui/icons';

/**
 * The header search.
 *
 * What exists to be searched today is the six halls, so that is what it searches —
 * by Persian name, by Latin name, and by the words in each hall's summary. Pretending
 * to search a specimen archive that is still empty would be a worse experience than
 * an honest, small, instant one; when the archive fills, this component grows a
 * server query and the hall results stay as the first group.
 *
 * Keyboard: Escape closes, the field is focused on open, and the dialog is inert for
 * screen readers only while it is open.
 */
export function HeaderSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fa');
    if (!needle) return hallIndex;
    return hallIndex.filter((hall) =>
      [hall.titleFa, hall.titleEn, hall.summary]
        .join(' ')
        .toLocaleLowerCase('fa')
        .includes(needle),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="جست‌وجو در موزه"
        aria-haspopup="dialog"
        className={
          'inline-flex h-10 w-10 items-center justify-center text-ivory-200 transition-colors duration-300 hover:text-gold-200 ' +
          (className ?? '')
        }
      >
        <SearchIcon className="h-[1.05rem] w-[1.05rem]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="جست‌وجو">
          <button
            type="button"
            aria-label="بستن جست‌وجو"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-obsidian-950/85 backdrop-blur-sm"
          />

          <div className="relative mx-auto mt-24 w-[calc(100%-2rem)] max-w-xl border border-white/10 bg-obsidian-900 shadow-plinth">
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-5">
              <SearchIcon className="h-4 w-4 shrink-0 text-gold-500/80" />
              <label htmlFor="museum-search" className="sr-only">
                جست‌وجو در تالارها
              </label>
              <input
                id="museum-search"
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="نام تالار یا موضوع را بنویسید…"
                autoComplete="off"
                className="h-14 w-full bg-transparent text-[0.95rem] text-ivory-100 outline-none placeholder:text-sage-600"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                className="shrink-0 text-sage-500 transition-colors hover:text-ivory-200"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {results.map((hall) => (
                <li key={hall.slug}>
                  <Link
                    href={`/halls/${hall.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-display text-[1.05rem] text-ivory-100">{hall.titleFa}</span>
                      <span dir="ltr" className="font-latin text-[0.7rem] tracking-[0.16em] text-sage-600 uppercase">
                        {hall.titleEn}
                      </span>
                    </span>
                    <span className="text-small text-sage-500">{hall.summary}</span>
                  </Link>
                </li>
              ))}

              {results.length === 0 && (
                <li className="px-4 py-8 text-center text-small text-sage-500">
                  تالاری با این نام یافت نشد. مجموعهٔ نمونه‌ها هنوز منتشر نشده است.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
