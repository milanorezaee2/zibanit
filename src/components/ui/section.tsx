import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container } from './container';

export interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** `plain` skips the outer padding — used by full-bleed bands. */
  variant?: 'default' | 'plain' | 'band';
  width?: 'reading' | 'gallery' | 'museum';
  titleAs?: 'h1' | 'h2';
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  variant = 'default',
  width = 'gallery',
  titleAs = 'h2',
}: SectionProps) {
  const TitleTag = titleAs;

  return (
    <section
      id={id}
      className={cn(
        variant === 'default' && 'py-16 sm:py-24',
        variant === 'band' &&
          'border-y border-line bg-paper-raised/60 py-16 sm:py-24',
        className,
      )}
    >
      <Container width={width}>
        {(eyebrow || title || description) && (
          <header className="mb-10 sm:mb-14">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            {title && (
              <TitleTag
                className={cn(
                  'text-ink',
                  titleAs === 'h1'
                    ? 'text-4xl leading-[1.3] sm:text-5xl'
                    : 'text-2xl sm:text-[2rem] leading-[1.35]',
                )}
              >
                {title}
              </TitleTag>
            )}
            {description && (
              <p className="mt-4 max-w-2xl text-[15px] leading-[2] text-ink-muted">{description}</p>
            )}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}
