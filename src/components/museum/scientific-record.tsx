import type { SpecimenDetail } from '@/db/queries/specimens';
import { crystalSystemLabel } from '@/content/mineral';

/**
 * The scientific record.
 *
 * A museum label, not a data dump: a two-column description list where the left
 * column is the property and the right column is the measurement. Rows whose value
 * is absent are *not rendered at all* — no dash, no «نامشخص», no zero. A visitor
 * reading a specimen's page must be able to trust that a line is there because a
 * curator recorded a fact, not because a template needed filling.
 *
 * Units are stated once per row; numbers are set left-to-right because a Mohs value
 * of «۷٫۵» would otherwise be reordered by the bidi algorithm into «۵٫۷». The digits
 * are rendered as Persian numerals for reading, while the underlying value stays
 * the ASCII decimal the database stores.
 */
const fa = new Intl.NumberFormat('fa-IR', { useGrouping: false });

/** A measurement is one number when the ends agree, a range when they do not. */
export function formatRange(min: string | null, max: string | null, unit?: string): string | null {
  if (min === null && max === null) return null;

  const low = min === null ? max : min;
  const high = max === null ? min : max;
  if (low === null || high === null) return null;

  const render = (value: string) => fa.format(Number(value));
  const body = low === high ? render(low) : `${render(low)}–${render(high)}`;

  return unit ? `${body} ${unit}` : body;
}

interface Row {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  /** Measurements are Latin-digit and left-to-right; prose is not. */
  readonly numeric?: boolean;
}

export function scientificRows(specimen: SpecimenDetail): readonly Row[] {
  const rows: Row[] = [];

  if (specimen.chemicalFormula) {
    rows.push({ key: 'formula', label: 'فرمول شیمیایی', value: specimen.chemicalFormula, numeric: true });
  }

  const crystal = crystalSystemLabel(specimen.crystalSystem);
  if (crystal) rows.push({ key: 'crystal', label: 'سیستم بلوری', value: crystal });

  const mohs = formatRange(specimen.mohsMin, specimen.mohsMax);
  if (mohs) rows.push({ key: 'mohs', label: 'سختی موس', value: mohs });

  const density = formatRange(specimen.densityMin, specimen.densityMax, 'g/cm³');
  if (density) rows.push({ key: 'density', label: 'چگالی', value: density });

  if (specimen.colors.length > 0) {
    rows.push({ key: 'colors', label: 'رنگ', value: specimen.colors.join('، ') });
  }

  if (specimen.transparency.length > 0) {
    rows.push({ key: 'transparency', label: 'شفافیت', value: specimen.transparency.join('، ') });
  }

  if (specimen.luster) rows.push({ key: 'luster', label: 'جلا', value: specimen.luster });
  if (specimen.cleavage) rows.push({ key: 'cleavage', label: 'رخ', value: specimen.cleavage });
  if (specimen.fracture) rows.push({ key: 'fracture', label: 'شکستگی', value: specimen.fracture });

  const refractive = formatRange(specimen.refractiveIndexMin, specimen.refractiveIndexMax);
  if (refractive && specimen.refractiveIndexMin && specimen.refractiveIndexMax) {
    rows.push({ key: 'ri', label: 'ضریب شکست', value: refractive });
  }

  return rows;
}

export function ScientificRecord({ specimen }: { specimen: SpecimenDetail }) {
  const rows = scientificRows(specimen);

  if (rows.length === 0) {
    return (
      <p className="border-s-2 border-gold-500/30 ps-5 text-body text-ink-muted">
        هیچ ویژگی علمی برای این نمونه ثبت نشده است. موزه مقدار پیش‌فرض یا برآوردی جای خالی
        نمی‌گذارد؛ هر عددی که در این جدول دیده شود، ثبت‌شده است.
      </p>
    );
  }

  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-12 sm:gap-6">
          <dt className="text-small text-ink-subtle sm:col-span-4">{row.label}</dt>
          <dd
            className={
              row.numeric
                ? 'nums text-body text-ink-muted sm:col-span-8'
                : 'text-body text-ink-muted sm:col-span-8'
            }
            {...(row.numeric ? { dir: 'ltr' } : {})}
            style={row.numeric ? { textAlign: 'start' } : undefined}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
