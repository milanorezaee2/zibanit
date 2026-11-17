import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/config/site';

/**
 * One navigation entry.
 *
 * Sections that do not exist yet are rendered as inert text with their phase
 * noted — deliberately not links, so the museum never ships a 404 in its own
 * main navigation, and a screen reader announces the state rather than pretending
 * the destination is available.
 */
export function NavItemView({
  item,
  className,
  onNavigate,
  showPhase = false,
}: {
  item: NavItem;
  className?: string;
  onNavigate?: () => void;
  showPhase?: boolean;
}) {
  if (!item.available) {
    return (
      <span
        aria-disabled="true"
        title={item.phase ? `${item.label} — ${item.phase}` : undefined}
        className={cn('cursor-default text-sage-600', className)}
      >
        {item.label}
        {showPhase && item.phase && (
          <span className="ms-1.5 align-middle text-[9.5px] text-sage-600/80">({item.phase})</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'text-ivory-200 transition-colors duration-200 hover:text-gold-200',
        className,
      )}
    >
      {item.label}
    </Link>
  );
}
