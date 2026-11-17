import Link from 'next/link';
import { footerLinks, footerNav, site } from '@/config/site';
import { APP_PHASE, APP_VERSION } from '@/config/app';
import { Lockup } from '@/components/brand/lockup';
import { Container } from '@/components/ui/container';
import { NavItemView } from './nav-item';

/**
 * The footer.
 *
 * Four columns: who the museum is, where to go in it, what is not yet open, and
 * the honest line at the bottom — this is not a shop, and there is no contact
 * address until there is a real one to print.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-obsidian-950">
      <Container width="museum" className="py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Lockup size="sm" showTagline />
            <p className="mt-6 max-w-sm text-small leading-[2] text-sage-500">{site.descriptionFa}</p>
          </div>

          <nav aria-label="بخش‌های موزه">
            <h2 className="mb-5 text-label tracking-[0.16em] text-gold-400 uppercase">موزه</h2>
            <ul className="flex flex-col gap-3 text-small">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <NavItemView item={item} className="text-sage-400 hover:text-gold-200" />
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-5 text-label tracking-[0.16em] text-gold-400 uppercase">در آینده</h2>
            <ul className="flex flex-col gap-3 text-small">
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
              <li>
                <span aria-disabled="true" title="اطلس — فاز ۳" className="cursor-default text-sage-600">
                  نقشهٔ جغرافیایی
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-label tracking-[0.16em] text-gold-400 uppercase">مدیریت</h2>
            <ul className="flex flex-col gap-3 text-small">
              <li>
                <Link href="/admin" className="text-sage-400 transition-colors hover:text-gold-200">
                  پنل مدیریت
                </Link>
              </li>
              <li>
                <a href="/api/health" className="text-sage-400 transition-colors hover:text-gold-200">
                  وضعیت سامانه
                </a>
              </li>
            </ul>

            <p className="mt-8 max-w-[16rem] text-small text-sage-600">
              نشانی تماس در این مرحله اعلام نمی‌شود؛ اطلاعات تماس تنها پس از راه‌اندازی رسمی
              منتشر خواهد شد.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-7 text-small text-sage-600 sm:flex-row sm:items-center sm:justify-between">
          <p>گموریا یک موزهٔ دیجیتال است، نه فروشگاه: هیچ شیئی در این سایت برای فروش عرضه نمی‌شود.</p>
          <p className="nums flex items-center gap-2">
            <span dir="ltr" className="font-latin tracking-[0.3em] text-sage-500">
              GEMORIA
            </span>
            <span aria-hidden="true">·</span>
            <span>
              نسخهٔ {APP_VERSION} · فاز {APP_PHASE.slug}
            </span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
