import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-body font-medium transition-colors duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40';

const variants: Record<ButtonVariant, string> = {
  /* Antique gold on obsidian — the museum's only "loud" affordance. */
  primary:
    'bg-gold-400 text-obsidian-950 hover:bg-gold-300 active:bg-gold-500 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]',
  outline:
    'border border-gold-400/45 text-gold-200 hover:border-gold-400/80 hover:bg-gold-400/10',
  ghost: 'text-ivory-200 hover:bg-white/[0.06] hover:text-gold-200',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-[15px]',
};

export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(base, variants[variant], sizes[size]);
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
