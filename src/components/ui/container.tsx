import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The museum's three widths.
 *
 * `museum`  — full-bleed galleries and the header
 * `gallery` — the default editorial measure
 * `reading` — a single column of Persian prose, where 90 characters would be cruel
 */
type Width = 'reading' | 'gallery' | 'museum' | 'full';

const widths: Record<Width, string> = {
  reading: 'max-w-reading',
  gallery: 'max-w-gallery',
  museum: 'max-w-museum',
  full: 'max-w-none',
};

export interface ContainerProps {
  children: ReactNode;
  width?: Width;
  className?: string;
  as?: ElementType;
}

export function Container({ children, width = 'gallery', className, as }: ContainerProps) {
  const Tag = as ?? 'div';
  return <Tag className={cn('mx-auto w-full px-gutter', widths[width], className)}>{children}</Tag>;
}
