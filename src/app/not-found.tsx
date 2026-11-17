import Link from 'next/link';
import { Wordmark } from '@/components/typography/wordmark';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Wordmark size="md" />
      <p className="mt-10 font-latin text-[64px] leading-none text-accent/30">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">این صفحه در موزه وجود ندارد</h1>
      <p className="mt-3 max-w-md text-[13.5px] leading-7 text-ink-muted">
        ممکن است نشانی را اشتباه وارد کرده باشید، یا این بخش هنوز در فازهای بعدی ساخته
        نشده باشد.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-gold-400/45 px-6 py-2.5 text-[13.5px] text-accent transition-colors hover:bg-gold-400/10"
      >
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}
