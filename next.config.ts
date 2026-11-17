import type { NextConfig } from 'next';

/**
 * GEMORIA — Next.js configuration.
 *
 * Deliberately vendor-neutral: no hosting-provider integration, no platform
 * environment variables, no edge-runtime assumptions. The same build runs on a
 * plain VPS (Docker), on a managed platform, or locally. Hosting is decided in
 * Phase 6.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Vendor-neutral deployment artifact: a self-contained server bundle that can
  // be copied into any container image without a hosting provider's tooling.
  output: 'standalone',
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  // The Administration Dashboard is never indexed, never cached by intermediaries.
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
