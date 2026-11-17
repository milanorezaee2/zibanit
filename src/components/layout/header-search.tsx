import Link from 'next/link';
import { SearchIcon } from '@/components/ui/icons';

/**
 * The header's search control.
 *
 * In Phase 1A this opened a dialog that searched six hall titles — honest, but
 * small. Now the collection is real and searchable on the server, so the control is
 * a link: it goes to `/search`, the page owns the field, the debounce and the
 * filters, and there is exactly one search experience in the museum rather than two
 * that disagree.
 *
 * It is deliberately *not* a client component any more. A link is keyboard
 * accessible for free, works without JavaScript, and can be opened in a new tab
 * like any other destination.
 */
export function HeaderSearch({ className }: { className?: string }) {
  return (
    <Link
      href="/search"
      aria-label="جست‌وجو در مجموعهٔ موزه"
      className={
        'inline-flex h-10 w-10 items-center justify-center text-ivory-200 transition-colors duration-300 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 ' +
        (className ?? '')
      }
    >
      <SearchIcon className="h-[1.05rem] w-[1.05rem]" />
    </Link>
  );
}
