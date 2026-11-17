import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/db/client';
import { getAdminSpecimen } from '@/db/queries/admin';
import { getHallOptions } from '@/db/queries/halls';
import { getTaxonomyOptions } from '@/db/queries/taxonomy';
import { listMediaOptions } from '@/db/mutations/media';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { SpecimenForm } from '@/components/admin/specimen-form';
import { Badge } from '@/components/ui/badge';
import { currentUserCan, requirePermissionUser } from '@/lib/auth/session';
import { STATUS_LABELS } from '@/content/mineral';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { deleteSpecimenAction, setSpecimenStatusAction } from '../actions';

export const metadata: Metadata = { title: 'ویرایش نمونه' };
export const dynamic = 'force-dynamic';

/**
 * Edit one object.
 *
 * Publication and deletion are outside the form, as separate permitted actions:
 * saving a draft must never accidentally publish it, and a form that can delete its
 * own record is one mis-click away from an empty vitrine.
 */
export default async function EditSpecimenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requirePermissionUser('specimen.read');

  const { id } = await params;
  const { saved } = await searchParams;
  const { db } = await getDatabase();

  const specimen = await getAdminSpecimen(db, id);
  if (!specimen) notFound();

  const [halls, taxonomy, media] = await Promise.all([
    getHallOptions(db),
    getTaxonomyOptions(db),
    listMediaOptions(db),
  ]);

  const canWrite = await currentUserCan('specimen.write');
  const canPublish = await currentUserCan('specimen.publish');

  return (
    <>
      <AdminTopbar
        title={specimen.title}
        subtitle={specimen.inventoryNo}
        actions={
          <>
            <Badge tone={specimen.status === 'published' ? 'emerald' : 'neutral'}>
              {STATUS_LABELS[specimen.status] ?? specimen.status}
            </Badge>

            {canPublish && specimen.status !== 'published' && (
              <form action={setSpecimenStatusAction}>
                <input type="hidden" name="id" value={specimen.id} />
                <input type="hidden" name="status" value="published" />
                <button
                  type="submit"
                  className="h-8 rounded-lg bg-emerald-600/80 px-3 text-[11.5px] text-white transition-colors hover:bg-emerald-500"
                >
                  انتشار
                </button>
              </form>
            )}

            {canPublish && specimen.status === 'published' && (
              <form action={setSpecimenStatusAction}>
                <input type="hidden" name="id" value={specimen.id} />
                <input type="hidden" name="status" value="draft" />
                <button
                  type="submit"
                  className="h-8 rounded-lg border border-white/15 px-3 text-[11.5px] text-ivory-200 transition-colors hover:border-gold-400/50"
                >
                  خارج کردن از انتشار
                </button>
              </form>
            )}

            {specimen.status === 'published' && (
              <Link
                href={`/specimens/${encodeURIComponent(specimen.slug)}`}
                className="h-8 rounded-lg border border-white/15 px-3 text-[11.5px] leading-8 text-ivory-200 hover:border-gold-400/50"
              >
                صفحهٔ عمومی
              </Link>
            )}
          </>
        }
      />

      <div className="flex-1 px-5 pt-6 sm:px-8">
        {saved === '1' && (
          <p
            role="status"
            className="mb-5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-[12px] text-emerald-200"
          >
            تغییرات ذخیره شد. سند جست‌وجو و ترتیب نام فارسی نیز بازسازی شدند.
          </p>
        )}

        {canWrite ? (
          <SpecimenForm mode="edit" initial={specimen} options={{ halls, media, taxonomy }} />
        ) : (
          <p className="border border-white/[0.08] px-5 py-6 text-[12.5px] leading-6 text-sage-400">
            نقش شما اجازهٔ ویرایش نمونه‌ها را ندارد. این صفحه فقط خواندنی است.
          </p>
        )}

        {canPublish && !specimen.status.startsWith('archived') && (
          <section className="mb-10 border-t border-white/[0.07] pt-6" aria-labelledby="danger-zone">
            <h2 id="danger-zone" className="mb-2 text-[12.5px] font-medium text-red-300/90">
              حذف از موزه
            </h2>
            <p className="mb-4 max-w-lg text-[11.5px] leading-6 text-sage-500">
              حذف، رکورد را نابود نمی‌کند: نمونه به بایگانی می‌رود و از صفحه‌های عمومی
              ناپدید می‌شود. سابقهٔ حسابرسی و شمارهٔ اموال باقی می‌ماند.
            </p>
            <form action={deleteSpecimenAction}>
              <input type="hidden" name="id" value={specimen.id} />
              <ConfirmSubmit
                message="این نمونه از همهٔ صفحه‌های عمومی حذف می‌شود و به بایگانی می‌رود. ادامه می‌دهید؟"
                className="h-9 rounded-lg border border-red-400/30 px-4 text-[11.5px] text-red-200 transition-colors hover:border-red-400/60 hover:bg-red-500/10"
              >
                بایگانی و حذف از نمایش
              </ConfirmSubmit>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
