import { Container } from '@/components/ui/container';

/**
 * The search page's loading state.
 *
 * It deliberately contains no `<h1>`: this fallback is streamed *ahead of* the page,
 * so a heading here would put two level-one headings in the same document for the
 * moment before React replaces it. The real heading arrives with the content; the
 * skeleton stays a shape.
 *
 * Server-rendered as a streamed fallback: it appears only while the museum is
 * querying, it occupies the same geometry as the result grid so nothing jumps when
 * the results arrive, and it is marked `aria-busy` so a screen reader is told what
 * is happening rather than being read a skeleton.
 */
export default function SearchLoading() {
  return (
    <div className="pt-[calc(var(--header-height)+3.5rem)] pb-section" aria-busy="true">
      <Container width="museum">
        <p className="label-fa mb-5">جست‌وجو</p>
        <p aria-hidden="true" className="font-display text-title text-ink0/60">
          کاوش در مجموعه
        </p>
        <p className="mt-4 text-body text-ink-subtle" role="status">
          در حال جست‌وجو در مجموعه…
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index}>
              <div className="bg-paper-raised/40" style={{ aspectRatio: '4 / 5' }} />
              <div className="mt-6 h-4 w-2/3 bg-paper-raised/40" />
              <div className="mt-3 h-3 w-1/3 bg-paper-raised/30" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
