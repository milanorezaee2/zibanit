import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The empty vitrine.
 *
 * A museum with nothing on display is not a broken museum — it is a museum before
 * opening. This state says so plainly instead of inventing content: no placeholder
 * specimens, no invented names, no grey loading skeleton that pretends a fetch is
 * still running.
 */
export interface EmptyStateProps {
  title: string;
  description: string;
  /** A quiet note about *why* it is empty (a phase, a closed storeroom). */
  note?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, note, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        // A rule, not a box. An empty gallery is a statement, and a statement does
        // not need a frame around it.
        'border-y border-line px-2 py-16 text-center sm:py-20',
        className,
      )}
    >
      <div className="relative mx-auto max-w-[46rem]">
        <span className="mx-auto mb-6 block h-8 w-8 text-accent/45" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M20 3 L34 12 V28 L20 37 L6 28 V12 Z" />
            <path d="M20 3 V37 M6 12 L34 28 M34 12 L6 28" strokeOpacity="0.35" />
          </svg>
        </span>

        <h3 className="text-[1.3rem] font-bold leading-snug text-ink">{title}</h3>
        <p className="mx-auto mt-3 max-w-[44ch] text-body text-ink-muted">{description}</p>
        {note && <p className="mt-5 text-small text-ink-subtle">{note}</p>}
        {action && <div className="mt-8 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
