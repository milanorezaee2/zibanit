'use client';

import { useEffect, useState } from 'react';
import { publicNav } from '@/config/site';
import { NavItemView } from './nav-item';
import { ButtonLink } from '@/components/ui/button';

/**
 * Mobile navigation drawer.
 *
 * Closes on Escape and on navigation, locks background scroll, and exposes the
 * open state through `aria-expanded`. The desktop navigation is rendered in the
 * server component; this is the only interactive piece of the public header.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label="باز کردن منو"
        className="inline-flex items-center justify-center rounded-full border border-white/12 p-2.5 text-ivory-200 transition-colors hover:border-gold-400/50 hover:text-gold-200 md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
          <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="منوی اصلی"
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-obsidian-950/80 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 top-0 border-b border-white/10 bg-obsidian-900 px-5 pb-8 pt-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="eyebrow">منو</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="rounded-full border border-white/12 p-2.5 text-ivory-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav aria-label="ناوبری اصلی (موبایل)">
              <ul className="flex flex-col gap-1">
                {publicNav.map((item) => (
                  <li key={item.href} className="border-b border-white/[0.05] py-2.5 text-[15px] last:border-0">
                    <NavItemView item={item} onNavigate={() => setOpen(false)} showPhase />
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-7">
              <ButtonLink href="/admin" variant="outline" size="sm" className="w-full">
                ورود به پنل مدیریت
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
