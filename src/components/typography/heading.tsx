import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Level = 1 | 2 | 3 | 4;

export interface HeadingProps extends Omit<ComponentProps<'h2'>, 'children'> {
  level?: Level;
  children: ReactNode;
  /** Renders the headline in the antique-gold gradient. */
  gold?: boolean;
}

const levelStyles: Record<Level, string> = {
  1: 'text-[2.4rem] leading-[1.28] sm:text-[3.4rem] lg:text-[4rem]',
  2: 'text-[1.75rem] leading-[1.35] sm:text-[2.15rem]',
  3: 'text-[1.3rem] leading-[1.4]',
  4: 'text-[1.05rem] leading-[1.45]',
};

const levelTags = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export function Heading({ level = 2, gold = false, className, children, ...rest }: HeadingProps) {
  const Tag = levelTags[level];
  return (
    <Tag
      className={cn(
        'font-display',
        levelStyles[level],
        // Mutually exclusive on purpose: two `color` utilities would leave the
        // winner to stylesheet order rather than to intent.
        gold ? 'text-gold-gradient' : 'text-ivory-100',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('eyebrow', className)}>{children}</p>;
}

export function GoldRule({ className }: { className?: string }) {
  return <div className={cn('gold-rule w-full', className)} aria-hidden="true" />;
}
