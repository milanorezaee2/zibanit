/**
 * GEMORIA — registering a media asset.
 *
 * Phase 1B does not implement an upload pipeline: no multipart handler, no image
 * processing, no bucket. What it implements is the *record* — the row that says
 * where a file lives, how big it is, what it is called and what a screen reader
 * should say — so that the gallery on a specimen page is real and the storage
 * driver can change without touching a component.
 *
 * A curator therefore places the file where the driver expects it (the `public/`
 * tree for the local driver) and registers its key here. The alternative — a
 * half-finished uploader that silently loses files on a redeploy — would be worse
 * than an explicit two-step with a documented boundary.
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import type { MuseumDatabase } from '../client';
import { mediaAssets, mediaTranslations } from '../schema/media';
import { DEFAULT_LOCALE } from '@/config/app';
import { isSafeStorageKey } from '@/lib/media/storage';
import { writeAudit } from './audit';

export type MediaKind = 'image' | 'video' | 'model' | 'panorama' | 'document';

export interface MediaRegistration {
  readonly storageKey: string;
  readonly kind: MediaKind;
  readonly mimeType: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly byteSize: number | null;
  readonly altText: string | null;
  readonly caption: string | null;
  readonly credit: string | null;
  readonly license: string | null;
  readonly dominantHex: string | null;
}

export type MediaMutationResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly error: 'unsafe-key' | 'duplicate-key' | 'invalid' };

export interface MediaRow {
  readonly id: string;
  readonly storageKey: string;
  readonly kind: MediaKind;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly createdAt: string;
}

export async function registerMedia(
  db: MuseumDatabase,
  input: MediaRegistration,
  actorId: string | null,
): Promise<MediaMutationResult> {
  if (!isSafeStorageKey(input.storageKey)) return { ok: false, error: 'unsafe-key' };
  if (input.kind !== 'image' && input.kind !== 'video' && input.kind !== 'model' && input.kind !== 'panorama' && input.kind !== 'document') {
    return { ok: false, error: 'invalid' };
  }

  const [existing] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.storageKey, input.storageKey), isNull(mediaAssets.deletedAt)))
    .limit(1);

  if (existing) return { ok: false, error: 'duplicate-key' };

  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(mediaAssets)
      .values({
        kind: input.kind,
        status: 'ready',
        storageDriver: 'local',
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        width: input.width,
        height: input.height,
        byteSize: input.byteSize,
        dominantHex: input.dominantHex,
        credit: input.credit,
        license: input.license,
        createdBy: actorId,
      })
      .returning({ id: mediaAssets.id });

    await tx.insert(mediaTranslations).values({
      mediaId: created!.id,
      locale: DEFAULT_LOCALE,
      altText: input.altText,
      caption: input.caption,
    });

    return created!.id;
  });

  await writeAudit(db, {
    actorId,
    action: 'media.register',
    entityType: 'media',
    entityId: id,
    after: { storageKey: input.storageKey, kind: input.kind },
  });

  return { ok: true, id };
}

/** Library rows for the specimen form's pickers. */
export async function listMediaOptions(db: MuseumDatabase): Promise<readonly MediaRow[]> {
  const rows = await db
    .select({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      kind: mediaAssets.kind,
      width: mediaAssets.width,
      height: mediaAssets.height,
      altText: mediaTranslations.altText,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(isNull(mediaAssets.deletedAt))
    .orderBy(asc(mediaAssets.createdAt))
    .limit(200);

  return rows.map((row) => ({
    id: row.id,
    storageKey: row.storageKey,
    kind: row.kind,
    width: row.width,
    height: row.height,
    altText: row.altText,
    createdAt: row.createdAt.toISOString(),
  }));
}
