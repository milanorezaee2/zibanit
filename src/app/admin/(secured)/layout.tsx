import { AdminShell } from '@/components/layout/admin-shell';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * The secured administration shell.
 *
 * The guard is here, at the layout, so a page cannot be reached by forgetting to
 * call it — and it is repeated in every Server Action, because a layout does not
 * run for an action. Two independent checks around the same operation is the point:
 * one protects the page, one protects the write.
 *
 * `dynamic = 'force-dynamic'` is not an optimisation knob here: dashboard data must
 * never be served from a cache to the wrong person.
 */
export default async function SecuredAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AdminShell user={{ displayName: user.displayName, email: user.email, role: user.role }}>
      {children}
      <footer className="border-t border-white/[0.07] px-5 py-3 text-[11px] text-sage-600 sm:px-8">
        واردشده به‌عنوان {user.displayName} — نقش: {user.role}
      </footer>
    </AdminShell>
  );
}
