import type { Metadata } from 'next';
import { getDatabase } from '@/db/client';
import { listMediaOptions } from '@/db/mutations/media';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { MediaForm } from '@/components/admin/media-form';
import { Badge } from '@/components/ui/badge';
import { guardPage } from '@/lib/auth/session';
import { AccessDenied } from '@/components/admin/access-denied';

export const metadata: Metadata = { title: 'کتابخانهٔ رسانه' };
export const dynamic = 'force-dynamic';

/**
 * The media library.
 *
 * A reference register, not an uploader: every row points at a file that already
 * exists under the public root, so replacing the storage driver with object storage
 * or a CDN later changes what a key resolves to, not what the database says.
 */
export default async function AdminMediaPage() {
  const user = await guardPage('media.read');
  if (!user) return <AccessDenied area="کتابخانهٔ رسانه" />;

  const { db } = await getDatabase();
  const media = await listMediaOptions(db);

  return (
    <>
      <AdminTopbar
        title="کتابخانهٔ رسانه"
        subtitle={`${new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(media.length)} فایل ثبت‌شده`}
      />

      <div className="grid flex-1 gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[22rem_1fr]">
        <section aria-labelledby="register-media">
          <h2 id="register-media" className="mb-3 text-[13px] font-medium text-ivory-100">
            ثبت فایل تازه
          </h2>
          <p className="mb-5 text-[11.5px] leading-6 text-sage-600">
            فایل را نخست در پوشهٔ رسانهٔ عمومی قرار دهید، سپس مسیر آن را اینجا ثبت کنید.
            بارگذاری از مرورگر در این فاز انجام نمی‌شود.
          </p>
          <MediaForm />
        </section>

        <section aria-labelledby="media-list">
          <h2 id="media-list" className="mb-3 text-[13px] font-medium text-ivory-100">
            فایل‌ها
          </h2>

          {media.length === 0 ? (
            <p className="border border-white/[0.08] px-5 py-8 text-[12.5px] leading-6 text-sage-500">
              کتابخانه خالی است. تا زمانی که تصویری ثبت نشود، فرم نمونه‌ها گزینهٔ تصویری
              برای انتخاب ندارد.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {media.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <span dir="ltr" className="min-w-0 flex-1 truncate text-[12px] text-ivory-200">
                    {row.storageKey}
                  </span>
                  <Badge tone="neutral">{row.kind}</Badge>
                  {row.width && row.height && (
                    <span dir="ltr" className="text-[11px] text-sage-600">
                      {row.width}×{row.height}
                    </span>
                  )}
                  <span className="max-w-xs truncate text-[11px] text-sage-600">{row.altText ?? 'بدون متن جانشین'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
