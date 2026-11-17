import { connection } from 'next/server';
import { getFeaturedSpecimens } from '@/db/queries/specimens';
import { SpecimenCard } from './specimen-card';
import { EmptyState } from './empty-state';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeading } from './section-heading';
import { Container } from '@/components/ui/container';

/**
 * The featured objects, read from the database.
 *
 * This is the one section of the homepage that is not static. `connection()`
 * tells Next this subtree depends on a live read, which does two things:
 *
 *   • the homepage is rendered per request instead of being frozen at build time
 *     with whatever the collection contained that day
 *   • `next build` never needs a database, so a container image can be built in
 *     CI without production credentials — the same artifact then attaches to
 *     whichever PostgreSQL the environment provides (D-02)
 *
 * When the collection is empty — which it is today — the museum says so with an
 * empty vitrine rather than inventing objects. When the database is unreachable
 * the page still opens, and the notice is honest about which of the two it is.
 */
export async function FeaturedCollection() {
  await connection();

  const featured = await getFeaturedSpecimens(6);

  return (
    <section id="featured" className="reveal py-section" aria-labelledby="featured-heading">
      <Container width="museum">
        <SectionHeading
          titleId="featured-heading"
          label="مجموعهٔ موزه"
          title="نمونه‌های منتخب"
          description="اشیائی که در ویترین‌های موزه جای گرفته‌اند: هر یک با نام، خاستگاه و ویژگی‌ای که آن را شاخص می‌کند."
          action={
            featured.state === 'ready' ? (
              <ButtonLink href="/halls" variant="quiet" size="sm">
                دیدن همهٔ تالارها
              </ButtonLink>
            ) : undefined
          }
        />

      {featured.state === 'ready' ? (
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {featured.items.map((specimen, index) => (
            <li key={specimen.id}>
              <SpecimenCard specimen={specimen} priority={index === 0} />
            </li>
          ))}
        </ul>
      ) : featured.state === 'empty' ? (
        <EmptyState
          title="ویترین‌ها هنوز خالی‌اند"
          description="مجموعهٔ موزه در حال آماده‌سازی است. نمونه‌ها پس از ثبت، بررسی و انتشار در پنل مدیریت، به‌ترتیب در همین بخش جای می‌گیرند."
          note="هیچ نمونه‌ای به‌صورت نمایشی یا ساختگی نمایش داده نمی‌شود."
          action={
            <ButtonLink href="/halls" variant="outline" size="md">
              آشنایی با تالارهای موزه
            </ButtonLink>
          }
        />
      ) : (
        <EmptyState
          title="مجموعه در این لحظه در دسترس نیست"
          description="ارتباط موزه با مخزن نمونه‌ها برقرار نشد. صفحهٔ موزه باز است، اما فهرست اشیا تا بازگشت مخزن نمایش داده نمی‌شود."
          note="وضعیت سامانه در نشانی /api/health گزارش می‌شود."
        />
      )}
      </Container>
    </section>
  );
}
