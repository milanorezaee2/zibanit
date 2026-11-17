import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ProseProps extends ComponentProps<'div'> {
  children: ReactNode;
  /** `lead` is the museum's introductory paragraph style. */
  variant?: 'body' | 'lead' | 'caption';
}

const variants = {
  body: 'text-[15px] leading-[2.05] text-sage-300',
  lead: 'text-[16.5px] leading-[2.1] text-ivory-200 sm:text-[17.5px]',
  caption: 'text-[12.5px] leading-[1.9] text-sage-500',
} as const;

export function Prose({ variant = 'body', className, children, ...rest }: ProseProps) {
  return (
    <div className={cn('max-w-2xl', variants[variant], className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * A quoted line of Persian, set in the display face. The museum's editorial
 * voice: used once per page, never as a substitute for real typography.
 */
export function PullQuote({ children, attribution }: { children: ReactNode; attribution?: string }) {
  return (
    <figure className="my-10 border-s-2 border-gold-400/50 ps-6">
      <blockquote className="font-display text-[1.35rem] leading-[1.75] text-ivory-200 sm:text-[1.55rem]">
        {children}
      </blockquote>
      {attribution && (
        <figcaption className="mt-3 text-[12.5px] text-sage-500">{attribution}</figcaption>
      )}
    </figure>
  );
}
