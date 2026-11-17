import type { Metadata } from 'next';

/**
 * Administration Dashboard — a separate surface with a separate lifecycle.
 *
 * This layout deliberately contains no chrome and no guard: it wraps both the
 * sign-in page and the secured shell, and a guard here would make the sign-in page
 * unreachable. The guard lives in `(secured)/layout.tsx`; this file only states the
 * crawl policy.
 *
 * `noindex, nofollow` is set here *and* as an `X-Robots-Tag` header in
 * `next.config.ts`, so the dashboard is excluded from search engines even if a page
 * forgets to inherit metadata.
 */
export const metadata: Metadata = {
  title: { default: 'پنل مدیریت', template: '%s — پنل مدیریت گموریا' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
