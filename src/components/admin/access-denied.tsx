import Link from 'next/link';

/**
 * The honest answer to a signed-in account that lacks a permission.
 *
 * Not a redirect and not a 500: the person is authenticated, they simply may not be
 * here. The panel names the permission in the museum's voice, offers the way back,
 * and renders no record, no count and no identifier from the area it is guarding.
 */
export function AccessDenied({ area }: { area: string }) {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center sm:px-8">
      <p className="label-fa mb-4">دسترسی محدود</p>
      <h1 className="font-display text-subtitle text-ink">اجازهٔ ورود به {area} را ندارید</h1>
      <p className="mt-4 text-[12.5px] leading-7 text-ink-muted">
        نقش حساب شما این بخش را پوشش نمی‌دهد. اگر به آن نیاز دارید، مدیر موزه می‌تواند
        نقش شما را تغییر دهد. هیچ اطلاعاتی از این بخش برای شما نمایش داده نشد.
      </p>
      <Link
        href="/admin"
        className="mt-8 inline-flex min-h-10 items-center rounded-vitrine border border-gold-400/40 px-5 text-[12.5px] text-accent hover:bg-gold-400/10"
      >
        بازگشت به داشبورد
      </Link>
    </div>
  );
}
