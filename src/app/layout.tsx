import type { Metadata, Viewport } from 'next';
import { DEFAULT_DIRECTION, DEFAULT_LOCALE } from '@/config/app';
import { site } from '@/config/site';
import { getPublicEnv } from '@/lib/env';
import { fontVariableClasses } from './fonts';
import './globals.css';

const publicEnv = getPublicEnv();

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    default: `${site.nameFa} — ${site.tagline}`,
    template: `%s — ${site.nameFa}`,
  },
  description: site.descriptionFa,
  applicationName: site.nameLatin,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: site.nameLatin,
    title: `${site.nameFa} — ${site.tagline}`,
    description: site.descriptionFa,
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: '#0b0e0c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

/**
 * The document shell.
 *
 * `lang="fa"` and `dir="rtl"` are set once, here, for the entire application.
 * Nothing downstream sets direction per-component: the browser, the layout engine
 * and every logical CSS property inherit the correct axis from this element.
 *
 * Adding English (LTR) or Arabic later means making this attribute dynamic, not
 * rewriting components.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={DEFAULT_DIRECTION}
      className={fontVariableClasses}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
