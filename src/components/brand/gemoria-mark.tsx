import { cn } from '@/lib/cn';

/**
 * The GEMORIA symbol.
 *
 * Not a diamond: diamonds are the shape a jeweller puts in a window, and this is a
 * museum. The mark is the *outline of a hexagonal crystal* with the three axes of
 * its lattice drawn inside — the same six-fold symmetry that decides how a natural
 * crystal actually grows, and the same geometry the empty vitrine uses.
 *
 * It is a single SVG with `currentColor`, so it inherits gold, ivory or stone
 * depending on where it is placed, and it never needs a second file for dark
 * backgrounds.
 */
export interface GemoriaMarkProps {
  className?: string;
  /** Stroke width in the 40-unit viewBox. Thinner reads more refined at large sizes. */
  weight?: number;
}

export function GemoriaMark({ className, weight = 1.1 }: GemoriaMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('h-9 w-9', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Hexagonal prism outline — the crystal's habit, seen head-on. */}
      <path d="M20 2.6 34.2 11v18L20 37.4 5.8 29V11z" />
      {/* The three lattice axes, at a third of the weight: enough to suggest structure. */}
      <path d="M20 2.6v34.8M5.8 11l28.4 18M34.2 11 5.8 29" strokeOpacity="0.28" />
      {/* A single facet line, so the mark reads as cut stone rather than a hexagon. */}
      <path d="M20 12.4l6.6 3.8v7.6L20 27.6l-6.6-3.8v-7.6z" strokeOpacity="0.5" />
    </svg>
  );
}
