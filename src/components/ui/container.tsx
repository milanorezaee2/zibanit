import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Width = 'narrow' | 'default' | 'wide';

const widths: Record<Width, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-[88rem]',
};

export interface ContainerProps {
  children: ReactNode;
  width?: Width;
  className?: string;
  as?: ElementType;
}

export function Container({ children, width = 'default', className, as }: ContainerProps) {
  const Tag = as ?? 'div';
  return <Tag className={cn('mx-auto w-full px-5 sm:px-8', widths[width], className)}>{children}</Tag>;
}
