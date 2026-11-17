import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'gold' | 'emerald' | 'neutral' | 'muted';

const tones: Record<BadgeTone, string> = {
  gold: 'border-gold-400/40 bg-gold-400/10 text-gold-200',
  emerald: 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200',
  neutral: 'border-white/12 bg-white/[0.05] text-ivory-300',
  muted: 'border-dashed border-white/12 bg-transparent text-sage-500',
};

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] leading-5 font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
