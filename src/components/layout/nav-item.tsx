import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/config/site';

/**
 * One navigation entry.
 *
 * The current page is marked with `aria-current="page"` as well as a gold
 * hairline: colour alone is not a state a screen reader — or a colour-blind
 * visitor — can perceive.
 *
 * Sections that do not exist yet render as inert text with their phase noted,
 * deliberately not links, so the museum never ships a 404 in its own navigation.
 */
export function NavItemView({
  item,
  className,
  onNavigate,
  showPhase = false,
  current = false,
}: {
  item: NavItem;
  className?: string;
  onNavigate?: () => void;
  showPhase?: boolean;
  current?: boolean;
}) {
  if (!item.available) {
    return (
      <span
        aria-disabled="true"
        title={item.phase ? `${item.label} — ${item.phase}` : undefined}
        className={cn('cursor-default text-ink-subtle', className)}
      >
        {item.label}
        {showPhase && item.phase && (
          <span className="ms-1.5 align-middle text-[9.5px] text-ink-subtle">({item.phase})</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'group relative inline-flex py-2 text-ink-muted/85 transition-colors duration-300 hover:text-accent',
        current && 'text-ink',
        className,
      )}
    >
      {item.label}
      {/* The state indicator: a hairline that is present when current, grows on hover. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 -bottom-0.5 h-px origin-right bg-gold-500 transition-transform duration-500 ease-museum',
          current ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
        )}
      />
    </Link>
  );
}
