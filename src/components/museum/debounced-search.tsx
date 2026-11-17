'use client';

import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from '@/components/ui/icons';

/**
 * The search field, with a debounce.
 *
 * Two requirements meet here and neither is allowed to break the other:
 *
 *   1. typing must not fire a request per keystroke
 *   2. the page must work with JavaScript disabled
 *
 * So the control is an ordinary input inside an ordinary GET form. With JavaScript
 * it waits 450ms after the last keystroke and then calls `form.requestSubmit()` —
 * the same navigation the Enter key or the submit button would cause, filters
 * intact. Without JavaScript the value simply waits for the button. Nothing here
 * re-implements routing, and there is no client-side query cache to go stale.
 *
 * The status text is `aria-live="polite"`: a screen-reader user hears that the
 * museum is searching, then the page announces the new result count itself.
 */
export interface DebouncedSearchFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  delayMs?: number;
}

export function DebouncedSearchField({
  id,
  name,
  label,
  placeholder,
  defaultValue,
  delayMs = 450,
}: DebouncedSearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const submit = () => {
    const form = inputRef.current?.form;
    if (!form) return;
    setPending(true);
    form.requestSubmit();
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[11.5px] text-sage-500">
        {label}
      </label>

      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-sage-600"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          aria-describedby={`${id}-status`}
          className="h-11 w-full rounded-vitrine border border-white/12 bg-obsidian-900/70 pe-10 ps-3 text-small text-ivory-100 placeholder:text-sage-600 transition-colors hover:border-white/20 focus:border-gold-400/70 focus:outline-none focus:ring-2 focus:ring-gold-400/25"
          onChange={() => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(submit, delayMs);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (timer.current) clearTimeout(timer.current);
              submit();
            }
          }}
        />
      </div>

      <p id={`${id}-status`} aria-live="polite" className="mt-1.5 min-h-4 text-[11.5px] text-sage-600">
        {pending ? 'در حال جست‌وجو…' : ''}
      </p>
    </div>
  );
}
