import Link from 'next/link';
import { cn } from '@/lib/cn';
import { site } from '@/config/site';
import { GemoriaMark } from './gemoria-mark';

/**
 * The full lockup: symbol + wordmark, in the museum's proportions.
 *
 * Used in the header (compact), the footer (with the Persian tagline) and the
 * mobile drawer. Composing it once means the mark-to-wordmark ratio can never
 * drift between three places.
 */
export interface LockupProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const sizes = {
  sm: { mark: 'h-7 w-7', word: 'text-[15px] tracking-[0.34em]', gap: 'gap-3' },
  md: { mark: 'h-9 w-9', word: 'text-[19px] tracking-[0.38em]', gap: 'gap-3.5' },
  lg: { mark: 'h-14 w-14', word: 'text-[30px] tracking-[0.42em]', gap: 'gap-5' },
} as const;

export function Lockup({ href, size = 'md', showTagline = false, className }: LockupProps) {
  const s = sizes[size];

  const content = (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      <GemoriaMark className={cn(s.mark, 'shrink-0 text-gold-500')} weight={size === 'lg' ? 0.9 : 1.1} />
      <span className="inline-flex flex-col">
        <span
          dir="ltr"
          className={cn(
            'font-latin leading-none text-ivory-100 uppercase ps-[0.34em]',
            s.word,
          )}
        >
          {site.nameLatin}
        </span>
        {showTagline && (
          <span className="mt-2.5 font-body text-[10.5px] tracking-[0.02em] text-sage-500">
            {site.tagline}
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      aria-label={`${site.nameFa} — صفحهٔ اصلی`}
      className="inline-flex shrink-0 items-center rounded-sm transition-opacity duration-300 hover:opacity-85"
    >
      {content}
    </Link>
  );
}
