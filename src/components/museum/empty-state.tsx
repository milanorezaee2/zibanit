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
        'relative border border-white/[0.07] bg-surface/40 px-6 py-16 text-center sm:px-14 sm:py-20',
        className,
      )}
      style={{ borderRadius: 'var(--radius-vitrine)' }}
    >
      {/* The vitrine's inner hairline — a frame, not a card. */}
      <div
        className="pointer-events-none absolute inset-3 border border-gold-500/15"
        style={{ borderRadius: 'var(--radius-vitrine)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-reading">
        <span className="mx-auto mb-7 block h-10 w-10 text-gold-500/60" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M20 3 L34 12 V28 L20 37 L6 28 V12 Z" />
            <path d="M20 3 V37 M6 12 L34 28 M34 12 L6 28" strokeOpacity="0.35" />
          </svg>
        </span>

        <h3 className="font-display text-subtitle text-ivory-100">{title}</h3>
        <p className="mx-auto mt-4 max-w-reading text-body text-sage-400">{description}</p>
        {note && <p className="mt-6 text-small text-sage-600">{note}</p>}
        {action && <div className="mt-9 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
