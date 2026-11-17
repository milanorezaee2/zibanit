'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDatabase } from '@/db/client';
import {
  createSpecimen,
  setSpecimenStatus,
  softDeleteSpecimen,
  updateSpecimen,
} from '@/db/mutations/specimens';
import { ForbiddenError, requirePermissionUser } from '@/lib/auth/session';
import { fieldErrorsOf, specimenFormSchema, type FormState } from '@/lib/validation/specimen';

/**
 * The specimen write actions.
 *
 * Every one of them starts with `requirePermissionUser(...)`. The guard is repeated
 * per action rather than inherited from the layout because a Server Action is an
 * HTTP endpoint: it can be POSTed directly without ever rendering the page that
 * hosts the form. Authorisation that lives only in a layout is a suggestion.
 *
 * The validation schema is the single source of truth for what may be written. A
 * hand-crafted POST cannot set a field the form never offered, and cannot set
 * `status` — publication is a separate, separately-permitted action.
 */
function readForm(formData: FormData): Record<string, unknown> {
  const text = (key: string) => String(formData.get(key) ?? '');

  const provenances = Array.from({ length: 4 }, (_, index) => ({
    countryName: text(`provenance.${index}.countryName`),
    countryCode: text(`provenance.${index}.countryCode`),
    region: text(`provenance.${index}.region`),
    locality: text(`provenance.${index}.locality`),
    note: text(`provenance.${index}.note`),
  }));

  return {
    inventoryNo: text('inventoryNo'),
    slug: text('slug'),
    title: text('title'),
    subtitle: text('subtitle'),
    scientificName: text('scientificName'),
    summary: text('summary'),
    story: text('story'),
    formation: text('formation'),
    history: text('history'),
    notes: text('notes'),
    chemicalFormula: text('chemicalFormula'),
    crystalSystem: text('crystalSystem'),
    mohsMin: text('mohsMin'),
    mohsMax: text('mohsMax'),
    densityMin: text('densityMin'),
    densityMax: text('densityMax'),
    refractiveIndexMin: text('refractiveIndexMin'),
    refractiveIndexMax: text('refractiveIndexMax'),
    colors: text('colors'),
    transparency: text('transparency'),
    luster: text('luster'),
    cleavage: text('cleavage'),
    fracture: text('fracture'),
    mineralFamilyId: text('mineralFamilyId'),
    scientificGroupId: text('scientificGroupId'),
    specimenTypeId: text('specimenTypeId'),
    originKindId: text('originKindId'),
    halls: formData.getAll('halls').map(String),
    provenances,
    primaryMediaId: text('primaryMediaId'),
    galleryMediaIds: formData.getAll('galleryMediaIds').map(String),
    seoTitle: text('seoTitle'),
    seoDescription: text('seoDescription'),
    weightCt: text('weightCt'),
    dimensionsMm: text('dimensionsMm'),
    pieces: text('pieces') || '1',
    acquiredAt: text('acquiredAt'),
    certificateRef: text('certificateRef'),
    isFeatured: formData.get('isFeatured') === 'on' || formData.get('isFeatured') === 'true',
    isHighlight: formData.get('isHighlight') === 'on' || formData.get('isHighlight') === 'true',
  };
}

/** Keeps the form filled in after a validation failure. */
function echoValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.includes('$ACTION')) values[key] = value;
  }
  return values;
}

export async function saveSpecimenAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let actor;
  try {
    actor = await requirePermissionUser('specimen.write');
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: 'error', message: 'شما اجازهٔ ویرایش نمونه‌ها را ندارید.' };
    }
    throw error;
  }

  const parsed = specimenFormSchema.safeParse(readForm(formData));
  const specimenId = String(formData.get('id') ?? '');

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'فرم کامل نیست. خطاهای مشخص‌شده را برطرف کنید.',
      fieldErrors: fieldErrorsOf(parsed.error),
      values: echoValues(formData),
    };
  }

  const { db } = await getDatabase();
  const result = specimenId
    ? await updateSpecimen(db, specimenId, parsed.data, actor.id)
    : await createSpecimen(db, parsed.data, actor.id);

  if (!result.ok) {
    const message =
      result.error === 'duplicate-inventory'
        ? 'این شمارهٔ اموال قبلاً ثبت شده است.'
        : result.error === 'duplicate-slug'
          ? 'این نشانی یکتا پیش‌تر برای نمونهٔ دیگری ثبت شده است.'
          : result.error === 'not-found'
            ? 'این نمونه یافت نشد.'
            : 'ذخیرهٔ نمونه انجام نشد.';

    return {
      status: 'error',
      message,
      fieldErrors:
        result.error === 'duplicate-inventory'
          ? { inventoryNo: message }
          : result.error === 'duplicate-slug'
            ? { slug: message }
            : undefined,
      values: echoValues(formData),
    };
  }

  // On create the mutation returns the new id; on update it returns the slug and
  // the id is the one that came in.
  const id = specimenId || ('id' in result.value ? result.value.id : '');

  revalidatePath('/admin/specimens');
  revalidatePath('/halls');
  revalidatePath('/search');
  revalidatePath('/');

  redirect(`/admin/specimens/${id}?saved=1`);
}

/** Publish, unpublish or archive. Publication has its own permission. */
export async function setSpecimenStatusAction(formData: FormData): Promise<void> {
  const actor = await requirePermissionUser('specimen.publish');
  const specimenId = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');

  if (!['draft', 'published', 'archived'].includes(status)) {
    throw new Error('Unknown status');
  }

  const { db } = await getDatabase();
  const result = await setSpecimenStatus(
    db,
    specimenId,
    status as 'draft' | 'published' | 'archived',
    actor.id,
  );

  if (!result.ok) throw new Error('Specimen not found');

  revalidatePath('/admin/specimens');
  revalidatePath(`/admin/specimens/${specimenId}`);
  revalidatePath('/halls');
  revalidatePath('/');
  revalidatePath('/search');
}

/**
 * Removes an object from public view.
 *
 * A soft delete: the record, its translations, its provenance and its audit trail
 * survive. The confirmation is a `confirm()` on the form's submit button and the
 * permission is checked here, not there.
 */
export async function deleteSpecimenAction(formData: FormData): Promise<void> {
  const actor = await requirePermissionUser('specimen.publish');
  const specimenId = String(formData.get('id') ?? '');

  const { db } = await getDatabase();
  const result = await softDeleteSpecimen(db, specimenId, actor.id);
  if (!result.ok) throw new Error('Specimen not found');

  revalidatePath('/admin/specimens');
  revalidatePath('/halls');
  revalidatePath('/');
  redirect('/admin/specimens');
}
