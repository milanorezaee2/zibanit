import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/login-form';
import { getSessionUser } from '@/lib/auth/session';
import { Wordmark } from '@/components/typography/wordmark';

export const metadata: Metadata = {
  title: 'ورود به پنل',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * The sign-in page.
 *
 * Kept outside the secured shell so that it does not depend on the session it
 * creates. A signed-in administrator who lands here is sent straight to the
 * dashboard rather than being shown a second login form.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect('/admin');

  const { next } = await searchParams;
  const destination = next && next.startsWith('/admin') ? next : '/admin';

  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Wordmark size="md" />
          <p className="mt-4 text-[11px] tracking-[0.18em] text-sage-600 uppercase">
            Museum Administration
          </p>
        </div>

        <div
          className="border border-white/[0.08] bg-surface/60 p-7 sm:p-8"
          style={{ borderRadius: 'var(--radius-vitrine)' }}
        >
          <h1 className="font-display text-[1.35rem] text-ivory-100">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-[12.5px] leading-6 text-sage-500">
            دسترسی فقط برای اعضای مجاز موزه. نشست پس از دوازده ساعت منقضی می‌شود.
          </p>

          <LoginForm destination={destination} />
        </div>

        <p className="mt-6 text-center text-[11.5px] leading-6 text-sage-600">
          حساب‌های مدیریتی با اسکریپت{' '}
          <code dir="ltr" className="text-sage-500">
            npm run admin:create
          </code>{' '}
          ساخته می‌شوند؛ هیچ گذرواژه‌ای در کد یا در پایگاه داده به‌صورت ساده ذخیره نمی‌شود.
        </p>
      </div>
    </main>
  );
}
