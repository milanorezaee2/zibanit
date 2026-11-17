import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/admin-shell';

/**
 * Administration Dashboard — a separate surface with a separate lifecycle.
 *
 * `noindex, nofollow` is set here *and* as an `X-Robots-Tag` header in
 * `next.config.ts`, so the dashboard is excluded from search engines even if a
 * page forgets to inherit metadata.
 *
 * ── Phase 0 security note ───────────────────────────────────────────────────
 * There is no authentication yet: sign-in, sessions, Argon2id password hashing,
 * TOTP and the RBAC matrix arrive in Phase 1, together with the tables they write
 * into (already created in this phase's migration). The dashboard therefore shows
 * only system status and contains no museum content or personal data. It must not
 * be exposed publicly before Phase 1 completes.
 */
export const metadata: Metadata = {
  title: { default: 'پنل مدیریت', template: '%s — پنل مدیریت گموریا' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell currentPath="/admin">{children}</AdminShell>;
}
