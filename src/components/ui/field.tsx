import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Form controls.
 *
 * Persian form conventions, applied consistently: label above the control, hint
 * beneath it, error replacing the hint, and — in RTL — text starting from the
 * right. Numeric and Latin-only inputs opt into `dir="ltr"` explicitly, because
 * a carat weight or a mineral formula must not be reordered by the bidi
 * algorithm.
 */

const control =
  'w-full rounded-xl border border-line-strong bg-paper-raised/80 px-3.5 py-2.5 text-sm text-ink ' +
  'placeholder:text-ink-subtle transition-colors duration-150 ' +
  'hover:border-line-strong focus:border-gold-400/70 focus:outline-none focus:ring-2 focus:ring-gold-400/25 ' +
  'disabled:opacity-45 disabled:cursor-not-allowed';

export function Label({ className, children, ...rest }: ComponentProps<'label'>) {
  return (
    <label className={cn('mb-2 block text-[12.5px] font-medium text-ink-muted', className)} {...rest}>
      {children}
    </label>
  );
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cn(control, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-28 resize-y leading-[1.9]', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<'select'>) {
  return (
    <select className={cn(control, 'appearance-none', className)} {...rest}>
      {children}
    </select>
  );
}

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, required, children, className }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('mb-5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ms-1 text-accent" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {/* Consumers pass the control; `aria-describedby` is wired centrally. */}
      <div data-describedby={describedBy}>{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] text-red-300/90" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
