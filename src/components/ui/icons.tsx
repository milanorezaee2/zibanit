/**
 * GEMORIA — the museum's complete icon set.
 *
 * Six line icons, drawn to a 24-unit grid at 1.25 stroke so they sit at the same
 * optical weight as Naskh at small sizes. Inline SVG rather than an icon package:
 * six paths do not justify a dependency, and an icon font would be a second
 * network request for something this small.
 *
 * Direction: `ArrowStart` points toward the *start* of the inline axis, which is
 * left in RTL and right in LTR — it flips with the document, not with a prop.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function ArrowStart(props: IconProps) {
  return (
    <svg {...base} {...props} className={['rtl:-scale-x-100', props.className].filter(Boolean).join(' ')}>
      <path d="M18 12H6" />
      <path d="m11 7-5 5 5 5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ScrollCue(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v15" />
      <path d="m7 14 5 5 5-5" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  );
}
