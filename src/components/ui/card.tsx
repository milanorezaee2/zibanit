import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends ComponentProps<'div'> {
  children: ReactNode;
  /** Adds a gold hairline and a soft glow — used for the object on display. */
  emphasis?: boolean;
}

export function Card({ className, children, emphasis = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'surface-panel relative overflow-hidden transition-colors duration-300',
        emphasis && 'border-gold-400/35 shadow-[0_24px_70px_-45px_rgba(201,169,97,0.65)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div className={cn('px-5 py-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: ComponentProps<'h3'>) {
  return (
    <h3 className={cn('font-display text-lg text-ivory-100', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardText({ className, children, ...rest }: ComponentProps<'p'>) {
  return (
    <p className={cn('text-[13.5px] leading-[1.95] text-sage-400', className)} {...rest}>
      {children}
    </p>
  );
}
