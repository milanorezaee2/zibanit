import Link from 'next/link';

/**
 * The museum's breadcrumb.
 *
 * A list of links plus a plain current page, marked up as an ordered list inside a
 * labelled `nav`, so a screen reader announces «مسیر» and then the trail. The
 * separators are decorative and hidden from assistive technology.
 *
 * The same items are used to emit `BreadcrumbList` structured data on pages where
 * every step is a real URL — the JSON-LD is generated from this array, so the two
 * can never disagree.
 */
export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="مسیر" className="text-small text-sage-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-gold-200">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-sage-300">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
