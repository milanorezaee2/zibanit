import type { Metadata } from 'next';
import Link from 'next/link';
import { getDatabase } from '@/db/client';
import { listAdminHalls } from '@/db/queries/admin';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';
import { currentUserCan } from '@/lib/auth/session';
import { STATUS_LABELS } from '@/content/mineral';
import { moveHallAction, setHallStatusAction } from './actions';

export const metadata: Metadata = { title: 'تالارها' };
export const dynamic = 'force-dynamic';

/**
 * The six galleries and their order.
 *
 * There is no "create hall" button: the museum's plan defines six rooms, and a
 * seventh would be a change to the institution, not to a record. What a curator
 * controls here is the copy, the cover, the order and whether a hall is open.
 */
export default async function AdminHallsPage() {
  const { db } = await getDatabase();
  const halls = await listAdminHalls(db);
  const canWrite = await currentUserCan('hall.write');

  return (
    <>
      <AdminTopbar title="تالارها" subtitle="ترتیب نمایش، متن و وضعیت انتشار تالارهای موزه" />

      <div className="flex-1 px-5 py-6 sm:px-8">
        <ul className="divide-y divide-line border-y border-line">
          {halls.map((hall) => (
            <li key={hall.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
              <span className="nums w-6 text-[11px] text-gold-500/70">
                {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(hall.sortOrder)}
              </span>

              <div className="min-w-0 flex-1">
                <Link href={`/admin/halls/${hall.id}`} className="text-[13.5px] text-ink hover:text-accent">
                  {hall.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-subtle">
                  <span dir="ltr">{hall.latinName}</span>
                  <span dir="ltr">/{hall.slug}</span>
                  <span>
                    {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(hall.specimenCount)} نمونهٔ منتشرشده
                  </span>
                  <code dir="ltr" className="text-ink-subtle">
                    {hall.code}
                  </code>
                </p>
              </div>

              <Badge tone={hall.status === 'published' ? 'emerald' : 'neutral'}>
                {STATUS_LABELS[hall.status] ?? hall.status}
              </Badge>

              <div className="flex items-center gap-3">
                <Link href={`/admin/halls/${hall.id}`} className="text-[11.5px] text-accent hover:text-accent">
                  ویرایش
                </Link>

                {canWrite && (
                  <>
                    <form action={moveHallAction}>
                      <input type="hidden" name="id" value={hall.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" aria-label={`انتقال ${hall.title} به بالا`} className="text-ink-subtle hover:text-ink-muted">
                        ↑
                      </button>
                    </form>
                    <form action={moveHallAction}>
                      <input type="hidden" name="id" value={hall.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" aria-label={`انتقال ${hall.title} به پایین`} className="text-ink-subtle hover:text-ink-muted">
                        ↓
                      </button>
                    </form>

                    <form action={setHallStatusAction}>
                      <input type="hidden" name="id" value={hall.id} />
                      <input type="hidden" name="status" value={hall.status === 'published' ? 'draft' : 'published'} />
                      <button type="submit" className="text-[11.5px] text-ink-muted hover:text-emerald-200">
                        {hall.status === 'published' ? 'بستن تالار' : 'انتشار'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-2xl text-[11.5px] leading-6 text-ink-subtle">
          تالار بسته یا پیش‌نویس در هیچ صفحهٔ عمومی دیده نمی‌شود و نشانی آن ۴۰۴ برمی‌گرداند.
          پیوند نمونه‌ها به تالار از فرم ویرایش خود نمونه انجام می‌شود.
        </p>
      </div>
    </>
  );
}
