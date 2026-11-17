'use server';

import { revalidatePath } from 'next/cache';
import { getDatabase } from '@/db/client';
import { registerMedia, type MediaKind } from '@/db/mutations/media';
import { ForbiddenError, requirePermissionUser } from '@/lib/auth/session';
import { fieldErrorsOf, type FormState } from '@/lib/validation/specimen';
import { mediaRegistrationSchema } from '@/lib/validation/media';

/**
 * Register a file that is already in the public media path.
 *
 * Phase 1B has no upload pipeline, and this is a deliberate boundary rather than an
 * omission: a browser upload would need storage credentials, content sniffing and
 * size limits. The action therefore records a *reference* to a file an operator has
 * placed in `public/`, and refuses anything that looks like a path escape — the
 * check lives in the mutation, so it holds for every caller.
 */
export async function registerMediaAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let actor;
  try {
    actor = await requirePermissionUser('media.write');
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 'error', message: 'شما اجازهٔ ثبت رسانه را ندارید.' };
    }
    throw error;
  }

  const parsed = mediaRegistrationSchema.safeParse({
    storageKey: String(formData.get('storageKey') ?? ''),
    kind: String(formData.get('kind') ?? 'image'),
    mimeType: String(formData.get('mimeType') ?? ''),
    width: String(formData.get('width') ?? ''),
    height: String(formData.get('height') ?? ''),
    altText: String(formData.get('altText') ?? ''),
  });

  if (!parsed.success) {
    const values: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string' && !key.includes('$ACTION')) values[key] = value;
    }
    return {
      status: 'error',
      message: 'فرم کامل نیست. خطاهای مشخص‌شده را برطرف کنید.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values,
    };
  }

  const { db } = await getDatabase();
  const result = await registerMedia(
    db,
    {
      storageKey: parsed.data.storageKey,
      kind: parsed.data.kind as MediaKind,
      mimeType: parsed.data.mimeType,
      width: parsed.data.width,
      height: parsed.data.height,
      byteSize: null,
      altText: parsed.data.altText || null,
      caption: null,
      credit: null,
      license: null,
      dominantHex: null,
    },
    actor.id,
  );

  if (!result.ok) {
    const message =
      result.error === 'duplicate-key'
        ? 'این مسیر پیش‌تر ثبت شده است.'
        : result.error === 'unsafe-key'
          ? 'مسیر فایل باید با / آغاز شود، در public باشد و «..» نداشته باشد.'
          : 'ثبت رسانه انجام نشد.';

    return { status: 'error', message, values: { storageKey: parsed.data.storageKey } };
  }

  revalidatePath('/admin/media');
  return { status: 'saved', message: 'رسانه ثبت شد.' };
}
