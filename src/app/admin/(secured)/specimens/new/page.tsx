import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDatabase } from '@/db/client';
import { getHallOptions } from '@/db/queries/halls';
import { getTaxonomyOptions } from '@/db/queries/taxonomy';
import { listMediaOptions } from '@/db/mutations/media';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { SpecimenForm } from '@/components/admin/specimen-form';
import { guardPage } from '@/lib/auth/session';
import { AccessDenied } from '@/components/admin/access-denied';

export const metadata: Metadata = { title: 'نمونهٔ تازه' };
export const dynamic = 'force-dynamic';

/** A new object, always created as a draft. */
export default async function NewSpecimenPage() {
  const user = await guardPage('specimen.write');
  if (!user) return <AccessDenied area="ثبت نمونهٔ تازه" />;

  const { db } = await getDatabase();
  const [halls, taxonomy, media] = await Promise.all([
    getHallOptions(db),
    getTaxonomyOptions(db),
    listMediaOptions(db),
  ]);

  if (halls.length === 0) redirect('/admin/halls');

  return (
    <>
      <AdminTopbar
        title="نمونهٔ تازه"
        subtitle="پس از ذخیره به‌صورت پیش‌نویس ثبت می‌شود و تا انتشار در سایت دیده نمی‌شود"
      />
      <div className="flex-1 px-5 pt-6 sm:px-8">
        <SpecimenForm
          mode="create"
          options={{ halls, media, taxonomy }}
        />
      </div>
    </>
  );
}
