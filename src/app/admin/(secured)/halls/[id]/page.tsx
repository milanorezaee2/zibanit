import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/db/client';
import { getAdminHall } from '@/db/queries/admin';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { HallForm } from '@/components/admin/hall-form';
import { Badge } from '@/components/ui/badge';
import { guardPage } from '@/lib/auth/session';
import { AccessDenied } from '@/components/admin/access-denied';
import { STATUS_LABELS } from '@/content/mineral';

export const metadata: Metadata = { title: 'ویرایش تالار' };
export const dynamic = 'force-dynamic';

export default async function EditHallPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await guardPage('hall.write');
  if (!user) return <AccessDenied area="ویرایش تالار" />;

  const { id } = await params;
  const { db } = await getDatabase();
  const hall = await getAdminHall(db, id);
  if (!hall) notFound();

  return (
    <>
      <AdminTopbar
        title={hall.title ?? hall.code}
        subtitle={`شناسهٔ ثابت: ${hall.code}`}
        actions={<Badge tone={hall.status === 'published' ? 'emerald' : 'neutral'}>{STATUS_LABELS[hall.status] ?? hall.status}</Badge>}
      />
      <div className="flex-1 px-5 py-6 sm:px-8">
        <HallForm initial={hall} />
      </div>
    </>
  );
}
