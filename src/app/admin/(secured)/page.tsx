import type { Metadata } from 'next';
import Link from 'next/link';
import { getSystemStatus } from '@/lib/system-status';
import { APP_PHASE, APP_VERSION } from '@/config/app';
import { AdminTopbar } from '@/components/layout/admin-shell';
import { getSessionUser } from '@/lib/auth/session';
import { listRecentAudit, listAdminSpecimens } from '@/db/queries/admin';
import { getDatabase } from '@/db/client';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';

export const metadata: Metadata = { title: 'داشبورد' };

/** Status must never be served from a cache — it is the point of the page. */
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [status, user, handle] = await Promise.all([
    getSystemStatus(),
    getSessionUser(),
    getDatabase(),
  ]);

  const [specimens, audit] = await Promise.all([
    listAdminSpecimens(handle.db, { pageSize: 1 }),
    listRecentAudit(handle.db, 8),
  ]);

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
        <div className="mb-7 grid gap-3 sm:grid-cols-3">
          <Stat
            label="نمونه‌های ثبت‌شده"
            value={new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(specimens.total)}
            hint="همهٔ وضعیت‌ها، اعم از پیش‌نویس و منتشرشده"
          />
          <Stat label="نقش شما" value={user?.role ?? '—'} hint={user?.email ?? '—'} />
          <Stat
            label="آخرین تغییر ثبت‌شده"
            value={audit[0] ? audit[0].action : '—'}
            hint={audit[0] ? new Date(audit[0].createdAt).toLocaleString('fa-IR') : 'بدون سابقه'}
          />
        </div>

        <section aria-labelledby="system-status" className="mb-8">
          <h2 id="system-status" className="mb-3 text-[12px] font-medium text-ink-subtle">
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
              <ul className="space-y-3 text-[13px] leading-7 text-ink-muted">
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
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                  <dt className="text-ink-subtle">نسخهٔ برنامه</dt>
                  <dd className="nums text-ink-muted">{application.version}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                  <dt className="text-ink-subtle">فاز</dt>
                  <dd className="text-ink-muted">
                    {APP_PHASE.number} — {APP_PHASE.name}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                  <dt className="text-ink-subtle">محیط</dt>
                  <dd className="text-ink-muted">{application.environment}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-subtle">بررسی</dt>
                  <dd className="nums text-ink-muted">{status.checkedAt}</dd>
                </div>
              </dl>

              <p className="mt-5 border-t border-line pt-4 text-[11.5px] leading-6 text-ink-subtle">
                نسخهٔ {APP_VERSION} · برای دیدن خروجی خام:{' '}
                <Link href="/api/health" className="text-accent underline underline-offset-4">
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
