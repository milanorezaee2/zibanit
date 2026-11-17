import type { MetadataRoute } from 'next';

/**
 * The museum's crawl policy.
 *
 * `robots.txt` is not a security control — a disallowed URL is still fetchable — so
 * the administration surface is protected by its guard as well, and every admin
 * response carries `X-Robots-Tag: noindex, nofollow, noarchive`. This file states the
 * same intent where a well-behaved crawler will read it first.
 *
 * Search result pages are excluded because they are infinite combinations of query
 * strings pointing at the same objects; the objects themselves are the canonical
 * pages. No `host` and no `sitemap` directive is emitted, because neither a canonical
 * domain nor a sitemap exists yet — writing one would be inventing a fact about the
 * institution.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/search'],
      },
    ],
  };
}
