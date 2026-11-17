'use client';

import { useActionState } from 'react';
import { saveHallAction } from '@/app/admin/(secured)/halls/actions';
import { Field, Input, Textarea } from '@/components/ui/field';
import type { FormState } from '@/lib/validation/specimen';

/**
 * The hall form.
 *
 * Four blocks: identity, copy, cover, discovery. The slug is editable but guarded by
 * the same uniqueness rule as a specimen's, and the immutable `code` is shown only as
 * text, because it is what every specimen link and every seed refers to.
 */
export interface AdminHallFields {
  id: string;
  code: string;
  latinName: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
  description: string | null;
  imageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  isFeatured: boolean;
  coverImageKey: string | null;
}

const INITIAL: FormState = { status: 'idle' };

export function HallForm({ initial }: { initial: AdminHallFields }) {
  const [state, formAction, pending] = useActionState(saveHallAction, INITIAL);
  const value = (name: string, fallback: string) => state.values?.[name] ?? fallback;
  const error = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="max-w-3xl" noValidate>
      <input type="hidden" name="id" value={initial.id} />

      {state.status === 'error' && state.message && (
        <p role="alert" className="mb-5 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-[12.5px] text-red-200">
          {state.message}
        </p>
      )}
      {state.status === 'saved' && state.message && (
        <p role="status" className="mb-5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-[12.5px] text-emerald-200">
          {state.message}
        </p>
      )}

      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field id="title" label="نام فارسی تالار" required error={error('title')}>
          <Input id="title" name="title" required defaultValue={value('title', initial.title ?? '')} />
        </Field>
        <Field id="latinName" label="نام لاتین" error={error('latinName')}>
          <Input id="latinName" name="latinName" dir="ltr" defaultValue={value('latinName', initial.latinName)} />
        </Field>
        <Field id="slug" label="نشانی یکتا" required error={error('slug')} hint="تغییر آن، نشانی عمومی تالار را عوض می‌کند.">
          <Input id="slug" name="slug" required defaultValue={value('slug', initial.slug ?? '')} />
        </Field>
        <Field id="sortOrder" label="ترتیب نمایش" error={error('sortOrder')} hint="۰ تا ۹۹">
          <Input id="sortOrder" name="sortOrder" dir="ltr" inputMode="numeric" defaultValue={value('sortOrder', String(initial.sortOrder))} />
        </Field>
      </div>

      <Field id="summary" label="معرفی کوتاه" required error={error('summary')} hint="در فهرست تالارها و در توضیح متا می‌آید.">
        <Textarea id="summary" name="summary" rows={3} defaultValue={value('summary', initial.summary ?? '')} />
      </Field>

      <Field id="description" label="متن کامل تالار" error={error('description')} hint="هر خط، یک پاراگراف.">
        <Textarea id="description" name="description" rows={10} defaultValue={value('description', initial.description ?? '')} />
      </Field>

      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field id="coverImageKey" label="کلید تصویر شاخص" error={error('coverImageKey')} hint="مسیر عمومی فایل، مثلاً /images/halls/gemstones.webp">
          <Input id="coverImageKey" name="coverImageKey" dir="ltr" defaultValue={value('coverImageKey', initial.coverImageKey ?? '')} />
        </Field>
        <Field id="imageAlt" label="متن جانشین تصویر" error={error('imageAlt')}>
          <Input id="imageAlt" name="imageAlt" defaultValue={value('imageAlt', initial.imageAlt ?? '')} />
        </Field>
        <Field id="seoTitle" label="عنوان SEO" error={error('seoTitle')}>
          <Input id="seoTitle" name="seoTitle" defaultValue={value('seoTitle', initial.seoTitle ?? '')} />
        </Field>
        <Field id="seoDescription" label="توضیح SEO" error={error('seoDescription')}>
          <Textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={value('seoDescription', initial.seoDescription ?? '')} />
        </Field>
      </div>

      <label className="mb-6 flex items-center gap-2.5 text-[12.5px] text-ivory-200">
        <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} className="h-4 w-4 accent-[var(--color-gold-500)]" />
        نمایش در بخش تالارهای برگزیدهٔ صفحهٔ خانه
      </label>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-vitrine bg-gold-500 px-7 text-small font-medium text-obsidian-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
        >
          {pending ? 'در حال ذخیره…' : 'ذخیرهٔ تغییرات'}
        </button>
        <p className="text-[11.5px] text-sage-500" aria-live="polite">
          {pending ? 'در حال ارسال…' : 'انتشار تالار از فهرست تالارها انجام می‌شود.'}
        </p>
      </div>
    </form>
  );
}
