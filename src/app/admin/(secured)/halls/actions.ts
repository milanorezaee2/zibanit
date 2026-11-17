'use server';

import { revalidatePath } from 'next/cache';
import { getDatabase } from '@/db/client';
import { renumberHalls, setHallStatus, updateHall } from '@/db/mutations/halls';
import { ForbiddenError, requirePermissionUser } from '@/lib/auth/session';
import { fieldErrorsOf, type FormState } from '@/lib/validation/specimen';
import { hallFormSchema } from '@/lib/validation/hall';

function echo(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.includes('$ACTION')) values[key] = value;
  }
  return values;
}

/**
 * Save a hall.
 *
 * `code` and the specimen links are not editable here: the code is the stable key
 * used by seed data and by the specimen form, and membership is edited from the
 * specimen side, where the curator can see what the object is.
 */
export async function saveHallAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let actor;
  try {
    actor = await requirePermissionUser('hall.write');
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 'error', message: 'شما اجازهٔ ویرایش تالارها را ندارید.' };
    }
    throw error;
  }

  const parsed = hallFormSchema.safeParse({
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    latinName: String(formData.get('latinName') ?? ''),
    summary: String(formData.get('summary') ?? ''),
    description: String(formData.get('description') ?? ''),
    imageAlt: String(formData.get('imageAlt') ?? ''),
    seoTitle: String(formData.get('seoTitle') ?? ''),
    seoDescription: String(formData.get('seoDescription') ?? ''),
    coverImageKey: String(formData.get('coverImageKey') ?? ''),
    sortOrder: String(formData.get('sortOrder') ?? ''),
    isFeatured: formData.get('isFeatured') === 'on' ? 'on' : 'false',
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'فرم کامل نیست. خطاهای مشخص‌شده را برطرف کنید.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values: echo(formData),
    };
  }

  const hallId = String(formData.get('id') ?? '');
  const { db } = await getDatabase();
  const result = await updateHall(
    db,
    hallId,
    {
      ...parsed.data,
      description: parsed.data.description || null,
      imageAlt: parsed.data.imageAlt || null,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      coverImageKey: parsed.data.coverImageKey || null,
    },
    actor.id,
  );

  if (!result.ok) {
    const message =
      result.error === 'duplicate-slug'
        ? 'این نشانی پیش‌تر برای تالار دیگری ثبت شده است.'
        : result.error === 'not-found'
          ? 'تالار یافت نشد.'
          : 'ذخیرهٔ تالار انجام نشد.';

    return {
      status: 'error',
      message,
      fieldErrors: result.error === 'duplicate-slug' ? { slug: message } : undefined,
      values: echo(formData),
    };
  }

  revalidatePath('/halls');
  revalidatePath(`/halls/${parsed.data.slug}`);
  revalidatePath('/admin/halls');
  revalidatePath('/');

  return { status: 'saved', message: 'تغییرات تالار ذخیره شد.' };
}

/** Publish or unpublish a hall. Draft halls are invisible to visitors. */
export async function setHallStatusAction(formData: FormData): Promise<void> {
  const actor = await requirePermissionUser('hall.write');
  const hallId = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');

  if (!['draft', 'published', 'archived'].includes(status)) {
    throw new Error('Unknown status');
  }

  const { db } = await getDatabase();
  const result = await setHallStatus(db, hallId, status as 'draft' | 'published' | 'archived', actor.id);
  if (!result.ok) throw new Error('Hall not found');

  revalidatePath('/halls');
  revalidatePath('/admin/halls');
  revalidatePath('/');
}

/** Move a hall up or down the public order. */
export async function moveHallAction(formData: FormData): Promise<void> {
  const actor = await requirePermissionUser('hall.write');
  const hallId = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? '');

  if (direction !== 'up' && direction !== 'down') throw new Error('Unknown direction');

  const { db } = await getDatabase();
  const result = await renumberHalls(db, hallId, direction, actor.id);
  if (!result.ok) throw new Error('Hall not found');

  revalidatePath('/halls');
  revalidatePath('/admin/halls');
  revalidatePath('/');
}
