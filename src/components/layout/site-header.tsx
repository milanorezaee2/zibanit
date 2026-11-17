import Link from 'next/link';
import { publicNav } from '@/config/site';
import { NavItemView } from './nav-item';
import { MobileNav } from './mobile-nav';
import { Wordmark } from '@/components/typography/wordmark';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-obsidian-950/80 backdrop-blur-md">
      <Container width="wide" className="flex h-[68px] items-center justify-between gap-6">
        <Link href="/" aria-label="گموریا — صفحهٔ اصلی" className="shrink-0">
          <Wordmark size="sm" />
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[13.5px]">
            {publicNav.map((item) => (
              <li key={item.href}>
                <NavItemView item={item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href="/admin" variant="outline" size="sm" className="hidden md:inline-flex">
            ورود مدیریت
          </ButtonLink>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
