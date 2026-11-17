'use client';

import { useActionState } from 'react';
import { saveSpecimenAction } from '@/app/admin/(secured)/specimens/actions';
import type { AdminSpecimenForm } from '@/db/queries/admin';
import type { TaxonomyOption } from '@/db/queries/taxonomy';
import type { MediaRow } from '@/db/mutations/media';
import type { FormState } from '@/lib/validation/specimen';
import { CRYSTAL_SYSTEMS, CRYSTAL_SYSTEM_LABELS, TAXONOMY_LABELS, type TaxonomyKind } from '@/content/mineral';
import { Field, Input, Select, Textarea } from '@/components/ui/field';

/**
 * The specimen form.
 *
 * Eight numbered sections, in the order a curator works: what the object is, what
 * to say about it, what it measures, how it is classified, where it came from, what
 * photographs exist, how it should be found, and whether it is public. The numbering
 * is not decoration — it is how someone is told over the phone which part of the
 * form has a problem.
 *
 * Behaviour that matters:
 *
 *   • nothing is lost on a validation error: the action echoes the submitted values
 *     back and the inputs re-render from them
 *   • the submit button disables while pending, so a double click cannot create two
 *     records
 *   • every input has a label, every error is linked by id and announced
 *   • scientific fields are optional and empty means absent — never zero
 *   • publication is *not* a field of this form: it is a separate permitted action
 */
export interface SpecimenFormProps {
  mode: 'create' | 'edit';
  initial?: AdminSpecimenForm | null;
  options: {
    halls: readonly { code: string; title: string }[];
    media: readonly MediaRow[];
    taxonomy: Record<TaxonomyKind, readonly TaxonomyOption[]>;
  };
}

const INITIAL_STATE: FormState = { status: 'idle' };

const dateValue = (value: string | null | undefined): string =>
  value ? value.slice(0, 10) : '';

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const id = `section-${number}`;
  return (
    <section className="border-t border-white/[0.07] py-8" aria-labelledby={id}>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="nums text-[11px] text-gold-500/70" aria-hidden="true">
          {new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false }).format(number)}
        </span>
        <h2 id={id} className="text-[13.5px] font-medium text-ivory-100">
          {title}
        </h2>
        {hint && <p className="w-full text-[11.5px] leading-6 text-sage-600">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function SpecimenForm({ mode, initial, options }: SpecimenFormProps) {
  const [state, formAction, pending] = useActionState(saveSpecimenAction, INITIAL_STATE);

  const value = (name: string, fallback = ''): string =>
    state.values?.[name] ?? fallback;

  const error = (name: string): string | undefined => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="pb-16" noValidate>
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {state.status === 'error' && state.message && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-[12.5px] leading-6 text-red-200"
        >
          {state.message}
        </p>
      )}

      {/* ── 1. General ───────────────────────────────────────────────────── */}
      <Section number={1} title="اطلاعات عمومی" hint="شمارهٔ اموال شناسهٔ ثابت شیء است و به نشانی صفحه ربطی ندارد.">
        <div className="grid gap-x-6 sm:grid-cols-2">
          <Field id="inventoryNo" label="شمارهٔ اموال" required error={error('inventoryNo')}>
            <Input
              id="inventoryNo"
              name="inventoryNo"
              dir="ltr"
              required
              defaultValue={value('inventoryNo', initial?.inventoryNo ?? '')}
            />
          </Field>

          <Field
            id="slug"
            label="نشانی یکتا (slug)"
            required
            error={error('slug')}
            hint="در آدرس صفحه استفاده می‌شود؛ حروف فارسی یا لاتین و خط تیره."
          >
            <Input id="slug" name="slug" required defaultValue={value('slug', initial?.slug ?? '')} />
          </Field>

          <Field id="title" label="نام فارسی" required error={error('title')}>
            <Input id="title" name="title" required defaultValue={value('title', initial?.title ?? '')} />
          </Field>

          <Field id="subtitle" label="نام لاتین نمایشی" error={error('subtitle')}>
            <Input id="subtitle" name="subtitle" dir="ltr" defaultValue={value('subtitle', initial?.subtitle ?? '')} />
          </Field>

          <Field
            id="scientificName"
            label="نام علمی یا انگلیسی"
            error={error('scientificName')}
            hint="نام کانی یا گونه؛ در موزه ترجمه نمی‌شود."
          >
            <Input
              id="scientificName"
              name="scientificName"
              dir="ltr"
              defaultValue={value('scientificName', initial?.scientificName ?? '')}
            />
          </Field>
        </div>
      </Section>

      {/* ── 2. Descriptions ─────────────────────────────────────────────── */}
      <Section number={2} title="توضیحات" hint="متن‌های بلند به‌صورت پاراگراف نمایش داده می‌شوند؛ HTML پذیرفته نمی‌شود.">
        <Field id="summary" label="معرفی کوتاه" error={error('summary')}>
          <Textarea id="summary" name="summary" rows={3} defaultValue={value('summary', initial?.summary ?? '')} />
        </Field>

        <div className="grid gap-x-6 sm:grid-cols-2">
          <Field id="story" label="توضیح علمی" error={error('story')}>
            <Textarea id="story" name="story" rows={6} defaultValue={value('story', initial?.story ?? '')} />
          </Field>

          <Field id="formation" label="نحوهٔ شکل‌گیری" error={error('formation')}>
            <Textarea id="formation" name="formation" rows={6} defaultValue={value('formation', initial?.formation ?? '')} />
          </Field>

          <Field id="history" label="اطلاعات تاریخی" error={error('history')}>
            <Textarea id="history" name="history" rows={5} defaultValue={value('history', initial?.history ?? '')} />
          </Field>

          <Field id="notes" label="توضیحات تکمیلی" error={error('notes')}>
            <Textarea id="notes" name="notes" rows={5} defaultValue={value('notes', initial?.notes ?? '')} />
          </Field>
        </div>
      </Section>

      {/* ── 3. Scientific record ────────────────────────────────────────── */}
      <Section
        number={3}
        title="مشخصات علمی"
        hint="هر فیلد خالی به معنای «ثبت نشده» است. موزه عدد پیش‌فرض نمی‌گذارد؛ اگر دو سر بازه را نمی‌دانید، هر دو را خالی بگذارید."
      >
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="chemicalFormula" label="فرمول شیمیایی" error={error('chemicalFormula')} hint="با ارقام لاتین و نماد عناصر">
            <Input
              id="chemicalFormula"
              name="chemicalFormula"
              dir="ltr"
              defaultValue={value('chemicalFormula', initial?.chemicalFormula ?? '')}
            />
          </Field>

          <Field id="crystalSystem" label="سیستم بلوری" error={error('crystalSystem')}>
            <Select
              id="crystalSystem"
              name="crystalSystem"
              defaultValue={value('crystalSystem', initial?.crystalSystem ?? '')}
            >
              <option value="">ثبت نشده</option>
              {CRYSTAL_SYSTEMS.map((system) => (
                <option key={system} value={system}>
                  {CRYSTAL_SYSTEM_LABELS[system].fa} ({CRYSTAL_SYSTEM_LABELS[system].en})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="mohsMin" label="سختی موس — کمینه" error={error('mohsMin')} hint="۰ تا ۱۰">
            <Input id="mohsMin" name="mohsMin" dir="ltr" inputMode="decimal" defaultValue={value('mohsMin', initial?.mohsMin ?? '')} />
          </Field>
          <Field id="mohsMax" label="سختی موس — بیشینه" error={error('mohsMax')}>
            <Input id="mohsMax" name="mohsMax" dir="ltr" inputMode="decimal" defaultValue={value('mohsMax', initial?.mohsMax ?? '')} />
          </Field>

          <Field id="densityMin" label="چگالی — کمینه (g/cm³)" error={error('densityMin')}>
            <Input id="densityMin" name="densityMin" dir="ltr" inputMode="decimal" defaultValue={value('densityMin', initial?.densityMin ?? '')} />
          </Field>
          <Field id="densityMax" label="چگالی — بیشینه (g/cm³)" error={error('densityMax')}>
            <Input id="densityMax" name="densityMax" dir="ltr" inputMode="decimal" defaultValue={value('densityMax', initial?.densityMax ?? '')} />
          </Field>

          <Field id="refractiveIndexMin" label="ضریب شکست — کمینه" error={error('refractiveIndexMin')}>
            <Input
              id="refractiveIndexMin"
              name="refractiveIndexMin"
              dir="ltr"
              inputMode="decimal"
              defaultValue={value('refractiveIndexMin', initial?.refractiveIndexMin ?? '')}
            />
          </Field>
          <Field id="refractiveIndexMax" label="ضریب شکست — بیشینه" error={error('refractiveIndexMax')}>
            <Input
              id="refractiveIndexMax"
              name="refractiveIndexMax"
              dir="ltr"
              inputMode="decimal"
              defaultValue={value('refractiveIndexMax', initial?.refractiveIndexMax ?? '')}
            />
          </Field>

          <Field id="colors" label="رنگ‌ها" error={error('colors')} hint="با ویرگول جدا کنید؛ مثلاً: سبز، آبی">
            <Input id="colors" name="colors" defaultValue={value('colors', (initial?.colors ?? []).join('، '))} />
          </Field>

          <Field id="transparency" label="شفافیت" error={error('transparency')} hint="با ویرگول جدا کنید">
            <Input
              id="transparency"
              name="transparency"
              defaultValue={value('transparency', (initial?.transparency ?? []).join('، '))}
            />
          </Field>

          <Field id="luster" label="جلا" error={error('luster')}>
            <Input id="luster" name="luster" defaultValue={value('luster', initial?.luster ?? '')} />
          </Field>

          <Field id="cleavage" label="رخ" error={error('cleavage')}>
            <Input id="cleavage" name="cleavage" defaultValue={value('cleavage', initial?.cleavage ?? '')} />
          </Field>

          <Field id="fracture" label="شکستگی" error={error('fracture')}>
            <Input id="fracture" name="fracture" defaultValue={value('fracture', initial?.fracture ?? '')} />
          </Field>
        </div>
      </Section>

      {/* ── 4. Classification ───────────────────────────────────────────── */}
      <Section
        number={4}
        title="طبقه‌بندی"
        hint="تالار، جایگاه نمایشی است؛ طبقه‌بندی علمی جداگانه و مستقل از آن ثبت می‌شود."
      >
        <div className="grid gap-x-6 sm:grid-cols-2">
          {(
            [
              ['mineral_family', 'mineralFamilyId'],
              ['scientific_group', 'scientificGroupId'],
              ['specimen_type', 'specimenTypeId'],
              ['origin_kind', 'originKindId'],
            ] as const
          ).map(([kind, name]) => (
            <Field
              key={name}
              id={name}
              label={TAXONOMY_LABELS[kind].fa}
              hint={TAXONOMY_LABELS[kind].hint}
              error={error(name)}
            >
              <Select id={name} name={name} defaultValue={value(name, (initial?.[name] as string | null) ?? '')}>
                <option value="">ثبت نشده</option>
                {options.taxonomy[kind].map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.label}
                    {term.latinName ? ` — ${term.latinName}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
        </div>

        <fieldset className="mt-2">
          <legend className="mb-2 block text-[12.5px] font-medium text-ivory-300">تالارهای نمایش</legend>
          <p className="mb-3 text-[11.5px] text-sage-600">
            یک نمونه می‌تواند در چند تالار نمایش داده شود؛ اطلاعات آن تکرار نمی‌شود.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {options.halls.map((hall) => {
              const checked = initial?.hallCodes.includes(hall.code) ?? false;
              return (
                <label
                  key={hall.code}
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] px-3 py-2 text-[12.5px] text-ivory-200 hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    name="halls"
                    value={hall.code}
                    defaultChecked={checked}
                    className="h-4 w-4 accent-[var(--color-gold-500)]"
                  />
                  {hall.title}
                </label>
              );
            })}
          </div>
        </fieldset>
      </Section>

      {/* ── 5. Geography ────────────────────────────────────────────────── */}
      <Section number={5} title="منشأ جغرافیایی" hint="هر جا اطلاعات معتبر ندارید، خالی بگذارید. مختصات برای نقشهٔ اطلس در آینده نگه داشته می‌شود.">
        {Array.from({ length: 4 }, (_, index) => {
          const place = initial?.provenances[index];
          return (
            <fieldset key={index} className="mb-5 border border-white/[0.07] p-4" style={{ borderRadius: 'var(--radius-vitrine)' }}>
              <legend className="px-2 text-[11.5px] text-sage-500">
                محل {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(index + 1)}
                {index === 0 && ' (اصلی)'}
              </legend>
              <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field id={`province-${index}`} label="کشور">
                  <Input
                    id={`province-${index}`}
                    name={`provenance.${index}.countryName`}
                    defaultValue={place?.countryName ?? ''}
                  />
                </Field>
                <Field id={`code-${index}`} label="کد کشور (ISO)">
                  <Input
                    id={`code-${index}`}
                    name={`provenance.${index}.countryCode`}
                    dir="ltr"
                    maxLength={2}
                    defaultValue={place?.countryCode ?? ''}
                  />
                </Field>
                <Field id={`region-${index}`} label="منطقه">
                  <Input id={`region-${index}`} name={`provenance.${index}.region`} defaultValue={place?.region ?? ''} />
                </Field>
                <Field id={`locality-${index}`} label="محل استخراج یا کشف">
                  <Input
                    id={`locality-${index}`}
                    name={`provenance.${index}.locality`}
                    defaultValue={place?.locality ?? ''}
                  />
                </Field>
              </div>
              <Field id={`note-${index}`} label="توضیح منشأ">
                <Input id={`note-${index}`} name={`provenance.${index}.note`} defaultValue={place?.note ?? ''} />
              </Field>
            </fieldset>
          );
        })}
      </Section>

      {/* ── 6. Media ────────────────────────────────────────────────────── */}
      <Section number={6} title="رسانه‌ها" hint="فایل‌ها پیش از ثبت در کتابخانهٔ رسانه در مسیر عمومی قرار می‌گیرند؛ این فرم به آن‌ها ارجاع می‌دهد.">
        {options.media.length === 0 ? (
          <p className="text-[12.5px] leading-6 text-sage-500">
            کتابخانهٔ رسانه خالی است. نخست یک تصویر را در بخش «کتابخانهٔ رسانه» ثبت کنید.
          </p>
        ) : (
          <>
            <Field id="primaryMediaId" label="تصویر اصلی" hint="همان تصویری که در کارت و در شبکه‌های اجتماعی دیده می‌شود.">
              <Select id="primaryMediaId" name="primaryMediaId" defaultValue={initial?.primaryMediaId ?? ''}>
                <option value="">بدون تصویر</option>
                {options.media.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.altText ?? media.storageKey}
                  </option>
                ))}
              </Select>
            </Field>

            <fieldset>
              <legend className="mb-2 block text-[12.5px] font-medium text-ivory-300">گالری</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.media.map((media) => (
                  <label
                    key={media.id}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] px-3 py-2 text-[12px] text-ivory-200 hover:border-white/20"
                  >
                    <input
                      type="checkbox"
                      name="galleryMediaIds"
                      value={media.id}
                      defaultChecked={initial?.galleryIds.includes(media.id) ?? false}
                      className="h-4 w-4 accent-[var(--color-gold-500)]"
                    />
                    <span dir="ltr" className="truncate">
                      {media.storageKey}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
      </Section>

      {/* ── 7. SEO ──────────────────────────────────────────────────────── */}
      <Section number={7} title="SEO" hint="اگر خالی بماند، از نام و معرفی کوتاه استفاده می‌شود.">
        <Field id="seoTitle" label="عنوان SEO" error={error('seoTitle')}>
          <Input id="seoTitle" name="seoTitle" defaultValue={value('seoTitle', initial?.seoTitle ?? '')} />
        </Field>
        <Field id="seoDescription" label="توضیح SEO" error={error('seoDescription')}>
          <Textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            defaultValue={value('seoDescription', initial?.seoDescription ?? '')}
          />
        </Field>
      </Section>

      {/* ── 8. Accession ────────────────────────────────────────────────── */}
      <Section number={8} title="ثبت فیزیکی و نمایش" hint="این مقادیر اندازه‌گیری‌شده‌اند؛ عددی که نمی‌دانید را خالی بگذارید.">
        <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="weightCt" label="وزن (ct)" error={error('weightCt')}>
            <Input id="weightCt" name="weightCt" dir="ltr" inputMode="decimal" defaultValue={value('weightCt', initial?.weightCt ?? '')} />
          </Field>
          <Field id="dimensionsMm" label="ابعاد (mm)" error={error('dimensionsMm')}>
            <Input id="dimensionsMm" name="dimensionsMm" dir="ltr" defaultValue={value('dimensionsMm', initial?.dimensionsMm ?? '')} />
          </Field>
          <Field id="pieces" label="تعداد قطعات" error={error('pieces')}>
            <Input
              id="pieces"
              name="pieces"
              dir="ltr"
              inputMode="numeric"
              defaultValue={value('pieces', String(initial?.pieces ?? 1))}
            />
          </Field>
          <Field id="acquiredAt" label="تاریخ ثبت" error={error('acquiredAt')}>
            <Input id="acquiredAt" name="acquiredAt" type="date" dir="ltr" defaultValue={value('acquiredAt', dateValue(initial?.acquiredAt))} />
          </Field>
          <Field id="certificateRef" label="شمارهٔ گواهی" error={error('certificateRef')}>
            <Input id="certificateRef" name="certificateRef" dir="ltr" defaultValue={value('certificateRef', initial?.certificateRef ?? '')} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-[12.5px] text-ivory-200">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={initial?.isFeatured ?? false}
              className="h-4 w-4 accent-[var(--color-gold-500)]"
            />
            نمایش در «نمونه‌های منتخب» صفحهٔ خانه
          </label>
          <label className="flex items-center gap-2.5 text-[12.5px] text-ivory-200">
            <input
              type="checkbox"
              name="isHighlight"
              defaultChecked={initial?.isHighlight ?? false}
              className="h-4 w-4 accent-[var(--color-gold-500)]"
            />
            نشانه‌گذاری به‌عنوان شیء شاخص
          </label>
        </div>

        <p className="mt-4 text-[11.5px] leading-6 text-sage-600">
          وضعیت انتشار از این فرم تغییر نمی‌کند. پیش‌نویس پس از ذخیره، با دکمهٔ «انتشار» در
          بالای صفحه منتشر می‌شود.
        </p>
      </Section>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t border-white/[0.08] bg-obsidian-950/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-vitrine bg-gold-500 px-7 text-small font-medium text-obsidian-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
        >
          {pending ? 'در حال ذخیره…' : mode === 'create' ? 'ثبت پیش‌نویس' : 'ذخیرهٔ تغییرات'}
        </button>

        <p className="text-[11.5px] text-sage-500" aria-live="polite">
          {pending ? 'در حال ارسال به سرور…' : 'همهٔ فیلدهای علمی اختیاری‌اند.'}
        </p>
      </div>
    </form>
  );
}
