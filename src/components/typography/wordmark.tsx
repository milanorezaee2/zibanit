import { cn } from '@/lib/cn';
import { site } from '@/config/site';

export interface WordmarkProps {
  className?: string;
  /** Persian sub-line beneath the Latin mark. */
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-[13px] tracking-[0.34em]',
  md: 'text-[16px] tracking-[0.4em]',
  lg: 'text-[26px] tracking-[0.44em]',
} as const;

/**
 * The GEMORIA mark.
 *
 * Latin, set in Cormorant Garamond with wide tracking — the one place the museum
 * uses a Latin display face. The Persian tagline sits beneath it at a much smaller
 * size and in the body face, so the two scripts never compete.
 */
export function Wordmark({ className, showTagline = false, size = 'md' }: WordmarkProps) {
  return (
    <span className={cn('inline-flex flex-col items-center', className)}>
      <span
        className={cn('font-latin leading-none text-gold-300 uppercase ps-[0.4em]', sizes[size])}
        dir="ltr"
      >
        {site.nameLatin}
      </span>
      {showTagline && (
        <span className="mt-2 font-body text-[10.5px] tracking-[0.06em] text-sage-500">
          {site.tagline}
        </span>
      )}
    </span>
  );
}
