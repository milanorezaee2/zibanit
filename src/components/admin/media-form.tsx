'use client';

import { useActionState } from 'react';
import { registerMediaAction } from '@/app/admin/(secured)/media/actions';
import { Field, Input, Select } from '@/components/ui/field';
import type { FormState } from '@/lib/validation/specimen';

const INITIAL: FormState = { status: 'idle' };

/** Reference registration for an existing file. No upload, by design. */
export function MediaForm() {
  const [state, formAction, pending] = useActionState(registerMediaAction, INITIAL);
  const error = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} noValidate>
      {state.status === 'error' && state.message && (
        <p role="alert" className="mb-4 rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-[12px] text-red-200">
          {state.message}
        </p>
      )}
      {state.status === 'saved' && state.message && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-2.5 text-[12px] text-emerald-200">
          {state.message}
        </p>
      )}

      <Field id="storageKey" label="مسیر فایل" required error={error('storageKey')} hint="مثلاً /images/specimens/emerald-01.webp">
        <Input
          id="storageKey"
          name="storageKey"
          dir="ltr"
          required
          defaultValue={state.values?.storageKey ?? ''}
        />
      </Field>

      <Field id="kind" label="نوع" error={error('kind')}>
        <Select id="kind" name="kind" defaultValue={state.values?.kind ?? 'image'}>
          <option value="image">تصویر</option>
          <option value="video">ویدئو</option>
          <option value="model">مدل سه‌بعدی</option>
          <option value="panorama">نمای ۳۶۰ درجه</option>
          <option value="document">سند</option>
        </Select>
      </Field>

      <Field id="mimeType" label="نوع MIME" required error={error('mimeType')} hint="image/webp یا image/avif">
        <Input id="mimeType" name="mimeType" dir="ltr" required defaultValue={state.values?.mimeType ?? 'image/webp'} />
      </Field>

      <div className="grid grid-cols-2 gap-x-4">
        <Field id="width" label="عرض (px)" error={error('width')}>
          <Input id="width" name="width" dir="ltr" inputMode="numeric" defaultValue={state.values?.width ?? ''} />
        </Field>
        <Field id="height" label="ارتفاع (px)" error={error('height')}>
          <Input id="height" name="height" dir="ltr" inputMode="numeric" defaultValue={state.values?.height ?? ''} />
        </Field>
      </div>

      <Field id="altText" label="متن جانشین" required error={error('altText')} hint="برای خوانندهٔ صفحه‌خوان و وقتی تصویر بارگذاری نمی‌شود.">
        <Input id="altText" name="altText" defaultValue={state.values?.altText ?? ''} />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-10 items-center justify-center rounded-vitrine bg-gold-500 px-5 text-[12.5px] font-medium text-obsidian-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
      >
        {pending ? 'در حال ثبت…' : 'ثبت رسانه'}
      </button>
    </form>
  );
}
