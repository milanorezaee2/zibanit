export type ClassValue = string | false | null | undefined;

/** Minimal class-name joiner — no runtime dependency for a three-line helper. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
