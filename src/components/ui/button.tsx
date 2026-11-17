import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-body font-medium transition-colors duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40';

const variants: Record<ButtonVariant, string> = {
  /* Antique gold on obsidian — the museum's only "loud" affordance, and it is
     still a quiet one: no shadow, no gradient, no bounce. */
  primary: 'bg-gold-500 text-obsidian-950 hover:bg-gold-400 active:bg-gold-600',
  /* The second action: an outline that only resolves on intent. */
  outline:
    'border border-gold-500/40 text-gold-200 hover:border-gold-400/80 hover:bg-gold-500/10',
  ghost: 'text-ivory-200 hover:bg-white/[0.05] hover:text-gold-200',
  /* Inline text action with a rule that grows — used at the end of a heading row. */
  quiet:
    'rounded-none px-0 text-gold-300 hover:text-gold-200 underline decoration-gold-500/30 decoration-1 underline-offset-[6px] hover:decoration-gold-400/70',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-4 text-small',
  md: 'min-h-11 px-6 text-[0.875rem]',
  lg: 'min-h-13 px-9 text-[0.9375rem]',
};

export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  // `quiet` is a text action: pill geometry and horizontal padding would fight it.
  const geometry = variant === 'quiet' ? 'rounded-none' : 'rounded-vitrine';
  return cn(base, geometry, variants[variant], sizes[size]);
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button className={cn(buttonStyles(variant, size), className)} {...rest}>
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function ButtonLink({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonStyles(variant, size), className)} {...rest}>
      {children}
    </Link>
  );
}
