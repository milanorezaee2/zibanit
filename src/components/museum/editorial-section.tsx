import { Container } from '@/components/ui/container';
import { ResponsiveImage } from './responsive-image';
import { encyclopediaTopics } from '@/content/encyclopedia';
import { media } from '@/content/media.generated';

/**
 * The introduction — the museum explaining what it is before showing anything.
 *
 * Editorial rather than promotional: a wide margin, a measured paragraph, a small
 * factual ledger at the bottom. The ledger counts what the museum actually
 * contains (six halls, five axes of study) instead of quoting a number nobody can
 * verify.
 */
const persianNumber = (value: number): string =>
  new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);

export function EditorialSection({ hallCount }: { hallCount: number }) {
  const facts = [
    { value: persianNumber(hallCount), label: 'تالار' },
    { value: persianNumber(encyclopediaTopics.length), label: 'محور دانشنامه' },
    { value: '۰', label: 'شیء فروشی' },
  ];

  return (
    <section id="about" className="reveal py-section" aria-labelledby="about-heading">
      <Container width="museum">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Text column: `order` keeps the photograph second on a phone, where a
              visitor should read the claim before seeing the ornament. */}
          <div className="order-2 lg:order-1 lg:col-span-6 lg:col-start-2">
            <p className="mb-6 flex items-center gap-3">
              <span className="label-fa">دربارهٔ موزه</span>
              <span className="gold-rule w-10" aria-hidden="true" />
            </p>

            <h2 id="about-heading" className="font-bold text-title text-ivory-100">
              موزه‌ای برای شناختن، نه برای خریدن
            </h2>

            <div className="mt-8 space-y-6 text-body text-sage-300">
              <p>
                گموریا یک گالری تصویر نیست. هر شیء در این موزه با همان دقتی ثبت می‌شود که
                در یک موزهٔ طبیعی به کار می‌رود: نام علمی، خاستگاه، ترکیب و ویژگی‌هایی که
                آن را از نمونه‌های هم‌خانواده‌اش جدا می‌کند.
              </p>
              <p>
                اینجا هیچ قیمتی نوشته نمی‌شود و هیچ چیزی فروخته نمی‌شود. هدف، ساختن مرجعی
                است برای کسانی که می‌خواهند سنگ را ببینند، بشناسند و دربارهٔ آن بخوانند —
                از ساختار بلوری تا جغرافیای پیدایش.
              </p>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/[0.07] pt-7">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="sr-only">{fact.label}</dt>
                  <dd>
                    <span className="block font-display text-[1.9rem] leading-none text-gold-300 nums">
                      {fact.value}
                    </span>
                    <span className="mt-2 block text-small text-sage-500">{fact.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-4">
            <ResponsiveImage
              media={media.editorial}
              alt="سه نمونهٔ کانیایی در اندازه‌های مختلف روی پایه‌ای سنگی در نور ویترین"
              sizes="(min-width: 1024px) 33vw, 90vw"
              ratio="4 / 5"
              className="shadow-plinth"
            />
            <p className="mt-4 text-small text-sage-600">
              ویترین موزه — تصویر جایگزین تا زمان ثبت عکس‌های اصلی مجموعه.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
