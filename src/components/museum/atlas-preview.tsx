import { Container } from '@/components/ui/container';
import { CompassIcon } from '@/components/ui/icons';

/**
 * The atlas — a held door.
 *
 * Phase 1A owes this section its appearance and its future connection point, and
 * nothing else: a real map needs real coordinates, and inventing them would put
 * fiction into a museum. So the artwork is pure geometry — the graticule of a
 * sphere, the way an atlas plate is printed — with no dots claiming a location.
 *
 * When the atlas lands, the plate is replaced by the interactive map and this
 * component keeps its heading, its copy and its place in the page.
 */
export function AtlasPreview() {
  return (
    <section id="atlas" className="relative overflow-hidden border-y border-line bg-paper-sunken py-section" aria-labelledby="atlas-heading">
      <Container width="museum">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="mb-6 flex items-center gap-3">
              <span className="label-fa">اطلس جهانی</span>
              <span className="gold-rule w-10" aria-hidden="true" />
            </p>

            <h2 id="atlas-heading" className="font-bold text-title text-ink">
              از دل زمین، از سراسر جهان
            </h2>

            <p className="mt-6 max-w-reading text-lead text-ink-muted">
              ردپای کانی‌ها و سنگ‌های طبیعی را در جغرافیای زمین دنبال کنید.
            </p>

            <ul className="mt-9 space-y-4 text-body text-ink-muted">
              <li className="flex gap-4">
                <span className="mt-3 h-px w-6 shrink-0 bg-gold-500/50" aria-hidden="true" />
                <span>هر نمونه به منطقه‌ای که در آن یافت شده پیوند می‌خورد.</span>
              </li>
              <li className="flex gap-4">
                <span className="mt-3 h-px w-6 shrink-0 bg-gold-500/50" aria-hidden="true" />
                <span>نقشه، پراکندگی خانواده‌های کانیایی را در مقیاس جهانی نشان می‌دهد.</span>
              </li>
              <li className="flex gap-4">
                <span className="mt-3 h-px w-6 shrink-0 bg-gold-500/50" aria-hidden="true" />
                <span>هر نقطه، فهرست اشیای همان سرزمین را باز می‌کند.</span>
              </li>
            </ul>

            <p className="mt-10 inline-flex items-center gap-2.5 text-small text-ink-subtle">
              <CompassIcon className="h-4 w-4 text-accent/70" />
              نقشهٔ تعاملی در فاز اطلس گشوده می‌شود؛ این بخش جایگاه آن است.
            </p>
          </div>

          {/* An abstract plate: graticule only. No coastlines, no pins, no invented
              geography — a printing convention, not a claim. */}
          <div className="lg:col-span-6" aria-hidden="true">
            <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
              <div className="absolute inset-0 rounded-full border border-accent/25" />
              <div className="absolute inset-[7%] rounded-full border border-line" />
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
              <div className="absolute inset-y-0 right-[26%] w-px bg-line" />
              <div className="absolute inset-y-0 left-[26%] w-px bg-line" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              <div className="absolute inset-x-[14%] top-[26%] h-px bg-line" />
              <div className="absolute inset-x-[14%] bottom-[26%] h-px bg-line" />
              {/* One elliptical meridian, tilted — enough to read as a sphere. */}
              <div className="absolute inset-y-[4%] left-1/2 w-[46%] -translate-x-1/2 rounded-[50%] border border-line" />
              <div className="absolute inset-[18%] rounded-full border border-accent/15" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
