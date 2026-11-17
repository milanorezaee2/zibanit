/**
 * GEMORIA — font loading.
 *
 * This file contains the only literal font paths in the project. `next/font`
 * resolves them at build time (they are compiler input, not runtime values), so
 * the calls cannot be generated from a loop — they are written out, once, here.
 *
 * What each role means, which scripts it covers, and how to replace a typeface is
 * documented in `src/config/fonts.ts`, which is the readable single source of
 * truth. Components never reference a typeface: they use the semantic utilities
 * `font-display`, `font-body` and `font-latin`.
 *
 * All files are self-hosted in `src/fonts/`. Nothing is fetched from a font CDN,
 * which means the museum builds and renders identically offline.
 */
import localFont from 'next/font/local';

/** Persian headings — Noto Naskh Arabic (400 / 700). */
export const displayFont = localFont({
  src: [
    { path: '../fonts/noto-naskh-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/noto-naskh-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-gemoria-display',
  display: 'swap',
  preload: true,
  fallback: ['Noto Naskh Arabic', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

/** Persian body, interface, tables, numerals — Vazirmatn (400 / 500 / 700). */
export const bodyFont = localFont({
  src: [
    { path: '../fonts/vazirmatn-arabic-latin-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/vazirmatn-arabic-latin-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/vazirmatn-arabic-latin-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-gemoria-body',
  display: 'swap',
  preload: true,
  fallback: ['Vazirmatn', 'Segoe UI', 'Tahoma', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

/** Latin wordmark and Latin display text — Cormorant Garamond (600). */
export const latinFont = localFont({
  src: [{ path: '../fonts/cormorant-garamond-600.woff2', weight: '600', style: 'normal' }],
  variable: '--font-gemoria-latin',
  display: 'swap',
  preload: true,
  fallback: ['Cormorant Garamond', 'Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
});

/** Applied to <html>. Turns the three CSS variables on for the whole document. */
export const fontVariableClasses = [
  displayFont.variable,
  bodyFont.variable,
  latinFont.variable,
].join(' ');
