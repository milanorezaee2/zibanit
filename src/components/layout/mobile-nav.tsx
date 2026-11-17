'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { footerNav, publicNav } from '@/config/site';
import { NavItemView } from './nav-item';
import { Lockup } from '@/components/brand/lockup';
import { MenuIcon, CloseIcon, SearchIcon } from '@/components/ui/icons';

/**
 * Mobile navigation.
 *
 * Not a shrunken desktop bar: a full-height sheet with the lockup, the primary
 * navigation at a size a thumb can hit, and a route to the archive search. It
 * closes on Escape and on navigation, locks background scroll while open, and
 * moves focus to the panel so a keyboard user does not start at the top of the
 * page again.
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
        className="inline-flex h-10 w-10 items-center justify-center text-ivory-200 transition-colors hover:text-gold-200 lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="منوی اصلی"
          className="fixed inset-0 z-[70] lg:hidden"
        >
          <button
            type="button"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-obsidian-950/85 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 end-0 flex w-[min(22rem,92vw)] flex-col border-s border-white/10 bg-obsidian-900">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <Lockup href="/" size="sm" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="inline-flex h-10 w-10 items-center justify-center text-ivory-200"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="ناوبری اصلی (موبایل)" className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="flex flex-col">
                {publicNav.map((item) => (
                  <li
                    key={item.href}
                    className="border-b border-white/[0.05] py-3.5 text-[1.05rem] last:border-0"
                  >
                    <NavItemView item={item} onNavigate={() => setOpen(false)} showPhase />
                  </li>
                ))}
              </ul>

              <p className="mt-10 mb-3 text-label tracking-[0.16em] text-sage-600 uppercase">بیشتر</p>
              <ul className="flex flex-col gap-3 text-small">
                {footerNav.slice(1, 3).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="text-sage-400 transition-colors hover:text-gold-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="text-sage-400 transition-colors hover:text-gold-200"
                  >
                    پنل مدیریت
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="border-t border-white/[0.07] px-6 py-5">
              <p className="flex items-center gap-2 text-small text-sage-600">
                <SearchIcon className="h-3.5 w-3.5" />
                جست‌وجو در نوار بالای صفحه
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
