'use client';

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
 * In the dark design the bar was transparent over a full-bleed hero and turned
 * opaque on scroll. On paper that compromise fails: dark ink over a photograph is
 * unreadable, and a translucent bar over a light page reads as a smudge. So the
 * header is now a constant: a paper bar with a hairline, blurred behind it.
 *
 * Losing the scroll listener also means it re-renders when you navigate and never
 * again — the only state left is the current pathname.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-xl',
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
              // A section counts as current for its children too: on
              // /halls/gemstones the navigation still says where you are.
              const isCurrent =
                item.href === pathname ||
                (item.href !== '/' && pathname?.startsWith(`${item.href}/`) === true);
              return (
                <li key={item.href}>
                  <NavItemView
                    item={item}
                    current={isCurrent}
                    onNavigate={undefined}
                    className="text-[0.9rem]"
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <HeaderSearch />
          <span className="mx-1 hidden h-4 w-px bg-line lg:block" aria-hidden="true" />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
