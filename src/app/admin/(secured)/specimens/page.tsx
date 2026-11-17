import type { Metadata } from 'next';
import Link from 'next/link';
import { getDatabase } from '@/db/client';
import { listAdminSpecimens } from '@/db/queries/admin';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { currentUserCan } from '@/lib/auth/session';
import { STATUS_LABELS } from '@/content/mineral';
import { setSpecimenStatusAction } from './actions';

export const metadata: Metadata = { title: 'اشیای موزه' };
export const dynamic = 'force-dynamic';

const fa = (value: number) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

const STATUS_TONE: Record<string, 'emerald' | 'gold' | 'neutral'> = {
  published: 'emerald',
  draft: 'neutral',
  scheduled: 'gold',
  archived: 'neutral',
};

/**
 * The collection, as a curator sees it: every status, including the drafts and the
 * archived records a visitor never encounters.
 *
 * The status actions are separate small forms, each posting to a Server Action that
 * re-checks the permission — a button being on the page is not authorisation.
 */
export default async function AdminSpecimensPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { db } = await getDatabase();
  const params = await searchParams;

  const page = Number(params.page ?? 1) || 1;
  const list = await listAdminSpecimens(db, {
    q: params.q,
    status: params.status,
    page,
  });

  const canWrite = await currentUserCan('specimen.write');
  const canPublish = await currentUserCan('specimen.publish');

  return (
    <>
      <AdminTopbar
        title="اشیای موزه"
        subtitle={`${fa(list.total)} رکورد ثبت‌شده، در همهٔ وضعیت‌ها`}
        actions={
          canWrite ? (
            <ButtonLink href="/admin/specimens/new" size="sm">
              نمونهٔ تازه
            </ButtonLink>
          ) : (
            <Badge tone="neutral">فقط خواندن</Badge>
          )
        }
      />

      <div className="flex-1 px-5 py-6 sm:px-8">
        <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="q" className="mb-1.5 block text-[11.5px] text-ink-subtle">
              جست‌وجو
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={params.q ?? ''}
              placeholder="شمارهٔ اموال، نام یا نشانی"
              className="h-9 w-56 rounded-lg border border-line-strong bg-paper-raised/70 px-3 text-[12.5px] text-ink"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1.5 block text-[11.5px] text-ink-subtle">
              وضعیت
            </label>
            <select
              id="status"
              name="status"
              defaultValue={params.status ?? 'all'}
              className="h-9 rounded-lg border border-line-strong bg-paper-raised/70 px-3 text-[12.5px] text-ink"
            >
              <option value="all">همه</option>
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشرشده</option>
              <option value="archived">بایگانی‌شده</option>
            </select>
          </div>

          <button
            type="submit"
            className="h-9 rounded-lg border border-line-strong px-4 text-[12.5px] text-ink-muted transition-colors hover:border-gold-400/50"
          >
            اعمال
          </button>
        </form>

        {list.items.length === 0 ? (
          <div className="border border-line px-6 py-16 text-center">
            <p className="font-display text-[1.15rem] text-ink">هیچ رکوردی یافت نشد</p>
            <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-6 text-ink-subtle">
              {params.q || params.status
                ? 'با این شرط‌ها رکوردی وجود ندارد.'
                : canWrite
                  ? 'مجموعه خالی است. نخستین نمونه را از دکمهٔ «نمونهٔ تازه» ثبت کنید.'
                  : 'مجموعه خالی است. نقش شما اجازهٔ ثبت نمونهٔ تازه را ندارد.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-[12.5px]">
              <caption className="sr-only">فهرست اشیای موزه</caption>
              <thead>
                <tr className="border-b border-line text-start text-[11px] text-ink-subtle">
                  <th scope="col" className="py-2.5 pe-4 text-start font-normal">شمارهٔ اموال</th>
                  <th scope="col" className="py-2.5 pe-4 text-start font-normal">نام</th>
                  <th scope="col" className="py-2.5 pe-4 text-start font-normal">وضعیت</th>
                  <th scope="col" className="py-2.5 pe-4 text-start font-normal">آخرین ویرایش</th>
                  <th scope="col" className="py-2.5 text-start font-normal">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((row) => (
                  <tr key={row.id} className="border-b border-line align-middle">
                    <td className="py-3 pe-4">
                      <span dir="ltr" className="text-ink-muted">
                        {row.inventoryNo}
                      </span>
                    </td>
                    <td className="py-3 pe-4">
                      <Link href={`/admin/specimens/${row.id}`} className="text-ink hover:text-accent">
                        {row.title ?? '— بدون ترجمه —'}
                      </Link>
                      {row.deletedAt && (
                        <span className="ms-2 text-[10.5px] text-ink-subtle">حذف‌شده</span>
                      )}
                    </td>
                    <td className="py-3 pe-4">
                      <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="py-3 pe-4 text-ink-subtle">
                      {new Date(row.updatedAt).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/specimens/${row.id}`}
                          className="text-[11.5px] text-accent hover:text-accent"
                        >
                          ویرایش
                        </Link>

                        {canPublish && row.status !== 'published' && (
                          <form action={setSpecimenStatusAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="status" value="published" />
                            <button type="submit" className="text-[11.5px] text-emerald-300 hover:text-emerald-200">
                              انتشار
                            </button>
                          </form>
                        )}

                        {canPublish && row.status === 'published' && (
                          <form action={setSpecimenStatusAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="status" value="draft" />
                            <button type="submit" className="text-[11.5px] text-ink-muted hover:text-ink-muted">
                              خارج کردن از انتشار
                            </button>
                          </form>
                        )}

                        {row.slug && row.status === 'published' && (
                          <Link
                            href={`/specimens/${encodeURIComponent(row.slug)}`}
                            className="text-[11.5px] text-ink-subtle hover:text-accent"
                          >
                            صفحهٔ عمومی
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {list.pageCount > 1 && (
          <nav aria-label="صفحه‌بندی" className="mt-6 flex items-center gap-2 text-[12px]">
            {Array.from({ length: list.pageCount }, (_, index) => index + 1).map((number) => (
              <Link
                key={number}
                href={`/admin/specimens?${new URLSearchParams({
                  ...(params.q ? { q: params.q } : {}),
                  ...(params.status ? { status: params.status } : {}),
                  page: String(number),
                }).toString()}`}
                aria-current={number === list.page ? 'page' : undefined}
                className={
                  number === list.page
                    ? 'rounded-md bg-gold-400/15 px-2.5 py-1 text-accent'
                    : 'rounded-md px-2.5 py-1 text-ink-subtle hover:text-ink-muted'
                }
              >
                {fa(number)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
