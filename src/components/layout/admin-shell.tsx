import Link from 'next/link';
import type { ReactNode } from 'react';
import { adminNav } from '@/config/admin-navigation';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/typography/wordmark';
import { Badge } from '@/components/ui/badge';

/**
 * The administration shell.
 *
 * Structurally separate from the museum: its own navigation model, its own
 * density, its own surfaces. Entries that are not implemented yet render as inert
 * text with their phase, so an administrator can see the shape of the tool without
 * being able to reach a page that does not exist.
 */
export function AdminSidebar({ currentPath = '/admin' }: { currentPath?: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-white/[0.07] bg-obsidian-900/50 lg:flex">
      <div className="border-b border-white/[0.07] px-5 py-5">
        <Link href="/admin" aria-label="داشبورد مدیریت گموریا">
          <Wordmark size="sm" />
        </Link>
        <p className="mt-3 text-[10.5px] tracking-[0.14em] text-sage-600">پنل مدیریت</p>
      </div>

      <nav aria-label="ناوبری پنل مدیریت" className="flex-1 overflow-y-auto px-3 py-5">
        {adminNav.map((group) => (
          <div key={group.id} className="mb-6 last:mb-0">
            <p className="mb-2 px-2 text-[10.5px] font-medium tracking-[0.12em] text-sage-600">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentPath === item.href;
                const content = (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {!item.available && (
                      <span className="text-[9.5px] text-sage-600">{item.phase}</span>
                    )}
                  </>
                );

                return (
                  <li key={item.id}>
                    {item.available ? (
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                          isActive
                            ? 'bg-gold-400/12 text-gold-200'
                            : 'text-ivory-300 hover:bg-white/[0.05] hover:text-ivory-100',
                        )}
                      >
                        {content}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        title={`${item.description} — ${item.phase}`}
                        className="-mx-0 flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-sage-600"
                      >
                        {content}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-[11px] text-gold-200">
            مد
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] text-ivory-200">مدیر موزه</p>
            <p className="text-[10.5px] text-sage-600">ورود از فاز ۱</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Mobile navigation for the dashboard: a single horizontal, scrollable row. */
export function AdminMobileNav() {
  return (
    <div className="border-b border-white/[0.07] bg-obsidian-900/70 lg:hidden">
      <nav aria-label="ناوبری پنل مدیریت (موبایل)" className="overflow-x-auto px-4 py-2.5">
        <ul className="flex items-center gap-1.5 whitespace-nowrap">
          {adminNav.flatMap((group) => group.items).map((item) =>
            item.available ? (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="rounded-full bg-gold-400/12 px-3 py-1.5 text-[12px] text-gold-200"
                >
                  {item.label}
                </Link>
              </li>
            ) : (
              <li key={item.id}>
                <span
                  aria-disabled="true"
                  className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[12px] text-sage-600"
                >
                  {item.label}
                </span>
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}

export function AdminTopbar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-white/[0.07] bg-obsidian-950/60 px-5 py-4 backdrop-blur-sm sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-[19px] leading-tight text-ivory-100">{title}</h1>
            <Badge tone="gold">فاز ۰</Badge>
          </div>
          {subtitle && <p className="mt-1 text-[12px] text-sage-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function AdminShell({
  children,
  currentPath,
}: {
  children: ReactNode;
  currentPath?: string;
}) {
  return (
    <div className="flex min-h-dvh bg-obsidian-950">
      <AdminSidebar currentPath={currentPath} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        {children}
      </div>
    </div>
  );
}
