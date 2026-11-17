import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SkipLink } from '@/components/layout/skip-link';

/**
 * The public museum shell.
 *
 * A route group, so it can grow (`/museum`, `/collections`, `/specimens`, …)
 * without any of those routes inheriting the administration dashboard's chrome —
 * and vice versa. The separation is structural, not cosmetic.
 */
export default function MuseumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
