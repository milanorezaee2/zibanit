import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'muted';
  className?: string;
}

const tones = {
  default: 'text-ivory-100',
  good: 'text-emerald-200',
  warn: 'text-gold-200',
  muted: 'text-sage-400',
} as const;

export function Stat({ label, value, hint, tone = 'default', className }: StatProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5',
        className,
      )}
    >
      <p className="text-[11.5px] text-sage-500">{label}</p>
      <p className={cn('mt-1 font-body text-[15px] font-medium nums break-words', tones[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11.5px] leading-6 text-sage-600">{hint}</p>}
    </div>
  );
}
