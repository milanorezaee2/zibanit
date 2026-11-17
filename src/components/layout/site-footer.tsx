import Link from 'next/link';
import { footerLinks, site } from '@/config/site';
import { Wordmark } from '@/components/typography/wordmark';
import { Container } from '@/components/ui/container';

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-white/[0.07] bg-obsidian-950/70">
      <Container width="wide" className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark size="sm" className="items-start" />
            <p className="mt-5 max-w-md text-[13px] leading-[1.95] text-sage-500">
              {site.descriptionFa}
            </p>
          </div>

          <nav aria-label="ناوبری پانوشت">
            <h2 className="mb-4 text-[12px] font-medium text-gold-400">موزه</h2>
            <ul className="flex flex-col gap-2.5 text-[13px]">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <span
                    aria-disabled="true"
                    title={`${link.label} — ${link.phase}`}
                    className="cursor-default text-sage-600"
                  >
                    {link.label}
                  </span>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-[12px] font-medium text-gold-400">مدیریت</h2>
            <ul className="flex flex-col gap-2.5 text-[13px]">
              <li>
                <Link href="/admin" className="text-ivory-200 transition-colors hover:text-gold-200">
                  پنل مدیریت
                </Link>
              </li>
              <li>
                <a
                  href="/api/health"
                  className="text-sage-500 transition-colors hover:text-gold-200"
                >
                  وضعیت سامانه
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[11.5px] text-sage-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            گموریا یک موزهٔ دیجیتال است، نه فروشگاه: هیچ شیئی در این سایت برای فروش
            عرضه نمی‌شود.
          </p>
          <p className="nums">
            GEMORIA · نسخهٔ ۰٫۱٫۰ · فاز ۰
          </p>
        </div>
      </Container>
    </footer>
  );
}
