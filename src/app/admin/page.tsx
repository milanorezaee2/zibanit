import type { Metadata } from 'next';
import Link from 'next/link';
import { getSystemStatus } from '@/lib/system-status';
import { APP_PHASE, APP_VERSION } from '@/config/app';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';

export const metadata: Metadata = { title: 'داشبورد' };

/** Status must never be served from a cache — it is the point of the page. */
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const status = await getSystemStatus();
  const { database, application } = status;

  const healthTone =
    status.status === 'ok' ? 'emerald' : status.status === 'degraded' ? 'gold' : 'neutral';
  const healthLabel =
    status.status === 'ok' ? 'سالم' : status.status === 'degraded' ? 'نیازمند توجه' : 'خطا';

  return (
    <>
      <AdminTopbar
        title="داشبورد"
        subtitle="وضعیت سامانه، پایگاه داده و مایگریشن‌ها"
        actions={
          <>
            <Badge tone={healthTone}>وضعیت: {healthLabel}</Badge>
            <ButtonLink href="/api/health" variant="outline" size="sm">
              JSON
            </ButtonLink>
          </>
        }
      />

      <div className="flex-1 px-5 py-7 sm:px-8">
        {/* Phase 0 has no authentication. Saying so loudly is safer than a quiet footnote. */}
        <div className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gold-400/30 bg-gold-400/[0.07] px-4 py-3">
          <Badge tone="gold">توجه</Badge>
          <p className="text-[12.5px] leading-6 text-gold-100/90">
            احراز هویت در فاز ۱ اضافه می‌شود. این پنل در فاز ۰ هیچ محتوای موزه و هیچ
            دادهٔ شخصی ندارد و نباید به‌صورت عمومی در دسترس قرار گیرد.
          </p>
        </div>

        <section aria-labelledby="system-status" className="mb-8">
          <h2 id="system-status" className="mb-3 text-[12px] font-medium text-sage-500">
            پایگاه داده
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="درایور"
              value={database.driver === 'postgres' ? 'PostgreSQL' : 'PGlite (PostgreSQL/WASM)'}
              hint={database.driver === 'pglite' ? 'توسعه و پیش‌نمایش — نه تولید' : 'سرور PostgreSQL'}
              tone={database.reachable ? 'good' : 'warn'}
            />
            <Stat
              label="مقصد"
              value={<span className="text-latin">{database.target}</span>}
              hint="بدون اعتبارنامه — فقط میزبان و نام پایگاه داده"
            />
            <Stat
              label="مایگریشن‌ها"
              value={`${database.migrations.applied} از ${database.migrations.available}`}
              hint={
                database.migrations.upToDate
                  ? 'همه اعمال شده‌اند'
                  : 'مایگریشن اعمال‌نشده وجود دارد'
              }
              tone={database.migrations.upToDate ? 'good' : 'warn'}
            />
            <Stat
              label="زمان پاسخ"
              value={database.latencyMs === null ? '—' : `${database.latencyMs} ms`}
              hint={database.schemaReady ? 'شِما کامل است' : 'شِما ناقص است'}
              tone={database.reachable ? 'default' : 'warn'}
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>اقدام‌های فاز ۱</CardTitle>
              <Badge tone="muted">فاز بعدی</Badge>
            </CardHeader>
            <CardBody>
              <ul className="space-y-3 text-[13px] leading-7 text-sage-300">
                {[
                  'ورود مدیر با Argon2id، نشست امن و TOTP',
                  'ماتریس نقش‌ها و مجوزها روی جدول‌های آمادهٔ همین فاز',
                  'لاگ حسابرسی برای هر تغییر',
                  'کاتالوگ اشیا: ایجاد، ویرایش، انتشار',
                  'کتابخانهٔ رسانه با پردازش تصویر',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-400/70" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>محیط اجرا</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-[12.5px]">
                <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2.5">
                  <dt className="text-sage-500">نسخهٔ برنامه</dt>
                  <dd className="nums text-ivory-200">{application.version}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2.5">
                  <dt className="text-sage-500">فاز</dt>
                  <dd className="text-ivory-200">
                    {APP_PHASE.number} — {APP_PHASE.name}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] pb-2.5">
                  <dt className="text-sage-500">محیط</dt>
                  <dd className="text-ivory-200">{application.environment}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sage-500">بررسی</dt>
                  <dd className="nums text-sage-400">{status.checkedAt}</dd>
                </div>
              </dl>

              <p className="mt-5 border-t border-white/[0.06] pt-4 text-[11.5px] leading-6 text-sage-600">
                نسخهٔ {APP_VERSION} · برای دیدن خروجی خام:{' '}
                <Link href="/api/health" className="text-gold-300 underline underline-offset-4">
                  /api/health
                </Link>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
