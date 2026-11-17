'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { publicNav } from '@/config/site';
import { NavItemView } from './nav-item';
import { MobileNav } from './mobile-nav';
import { HeaderSearch } from './header-search';
import { Lockup } from '@/components/brand/lockup';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/cn';

/**
 * The header.
 *
 * Fixed rather than sticky, because the hero is meant to run underneath it: at the
 * top of the page the header is a gradient scrim over the photograph, and once the
 * visitor has scrolled past the fold it settles into a bordered bar with a blurred
 * backdrop. The transition is the only movement, and it is 500ms of background
 * colour — no shrinking, no sliding, nothing that reflows the page.
 *
 * It is the only client component in the public shell besides the drawer and the
 * search dialog, and it holds exactly one piece of state: whether the page has
 * scrolled.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        frame = 0;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-museum',
        scrolled
          ? 'border-b border-white/[0.08] bg-canvas/88 backdrop-blur-md'
          : 'border-b border-transparent bg-[linear-gradient(to_bottom,rgba(11,14,12,0.72),transparent)]',
      )}
    >
      <Container
        width="museum"
        className="flex h-[var(--header-height)] items-center justify-between gap-6"
      >
        <Lockup href="/" size="sm" />

        <nav aria-label="ناوبری اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {publicNav.map((item) => {
              const isCurrent = item.href === pathname;
              return (
                <li key={item.href}>
                  <NavItemView
                    item={item}
                    current={isCurrent}
                    onNavigate={undefined}
                    className="text-[0.84rem]"
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <HeaderSearch />
          <span className="mx-1 hidden h-4 w-px bg-white/10 lg:block" aria-hidden="true" />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
