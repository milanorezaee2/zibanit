import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The heading of every gallery section.
 *
 * Two voices, deliberately unequal: a small Persian label (or a Latin eyebrow
 * where the section is conceptual) above a Naskh headline, then an optional
 * single-sentence description. The gold rule is the museum's punctuation — it is
 * the same rule in every section, which is what makes sections feel related.
 */
export interface SectionHeadingProps {
  id?: string;
  /** Small Persian label above the headline. */
  label?: string;
  /** Small Latin line, used instead of `label` on conceptual sections. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Rendered at the far end of the heading row — a single quiet link at most. */
  action?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
  titleId?: string;
}

export function SectionHeading({
  label,
  eyebrow,
  title,
  description,
  action,
  align = 'start',
  className,
  titleId,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        'mb-10 sm:mb-14',
        align === 'center' && 'mx-auto max-w-reading text-center',
        className,
      )}
    >
      {(label || eyebrow) && (
        <p className={cn('mb-4 flex items-center gap-3', align === 'center' && 'justify-center')}>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : <span className="label-fa">{label}</span>}
          <span className="h-px w-10 shrink-0 bg-gold-500/60" aria-hidden="true" />
        </p>
      )}

      <div
        className={cn(
          'flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between',
          align === 'center' && 'sm:flex-col sm:items-center',
        )}
      >
        <h2
          id={titleId}
          className="max-w-[26ch] font-body text-title font-bold text-ink"
        >
          {title}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {description && (
        <p
          className={cn(
            'mt-4 max-w-[52ch] text-body text-ink-muted',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
