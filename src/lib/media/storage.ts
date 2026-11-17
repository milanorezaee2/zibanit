/**
 * GEMORIA — media storage.
 *
 * The database stores *where* a file is, never the file. `media_assets.storage_key`
 * is resolved by a driver, so moving the catalogue to S3 or a CDN is a change to
 * this module and to one environment variable — not a migration and not a component.
 *
 * Two drivers exist today:
 *
 *   local  the key is a path inside `public/` (`images/hall-crystals.webp`).
 *          Used in development, preview and for the nine build-time photographs
 *          that ship with the application.
 *   s3     reserved. Not implemented, and deliberately not faked: until there is
 *          a bucket and a signed-URL story, an unconfigured driver that throws a
 *          clear error is more honest than one that pretends.
 *
 * Nothing in this module touches the filesystem, so it is safe to import from a
 * Server Component, a Route Handler or a test.
 */
import { media as buildManifest, type MediaEntry, type MediaKey } from '@/content/media.generated';

export type StorageDriverName = 'local' | 's3';

export interface ResolvedImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** `next/image` blur placeholder, when the asset carries one. */
  readonly blurDataURL?: string;
  /** Falls back to the vitrine background when the asset has no dominant colour. */
  readonly dominantHex?: string;
}

/** Rejects traversal and absolute URLs before a key ever reaches a browser. */
export function isSafeStorageKey(key: string): boolean {
  if (key.length === 0 || key.length > 512) return false;
  if (key.startsWith('/') || key.includes('\\')) return false;
  if (key.includes('..')) return false;
  if (/^[a-z]+:/i.test(key)) return false;
  return /^[\w./-]+$/.test(key);
}

/**
 * Public URL for a stored key.
 *
 * In production this becomes the CDN origin (`MEDIA_PUBLIC_BASE_URL`) with a path
 * prefix; the driver keeps the same contract so no caller changes.
 */
export function mediaUrl(storageKey: string, driver: StorageDriverName = 'local'): string {
  if (!isSafeStorageKey(storageKey)) {
    throw new Error(`Unsafe media storage key: ${JSON.stringify(storageKey.slice(0, 80))}`);
  }

  if (driver === 's3') {
    const base = process.env.MEDIA_PUBLIC_BASE_URL;
    if (!base) {
      throw new Error(
        'MEDIA_PUBLIC_BASE_URL is required by the s3 storage driver. ' +
          'Set it to the CDN origin, or use the local driver.',
      );
    }
    return `${base.replace(/\/+$/, '')}/${storageKey}`;
  }

  return `/${storageKey.replace(/^\/+/, '')}`;
}

/** A build-time photograph by manifest key. Returns null for an unknown key. */
export function buildAsset(key: string | null | undefined): MediaEntry | null {
  if (!key) return null;
  return (buildManifest as Record<string, MediaEntry>)[key] ?? null;
}

export function buildAssetImage(key: string | null | undefined): ResolvedImage | null {
  const entry = buildAsset(key);
  if (!entry) return null;
  return {
    src: entry.src,
    width: entry.width,
    height: entry.height,
    blurDataURL: entry.blurDataURL,
  };
}

/** The manifest key type, re-exported so callers do not import `content` twice. */
export type { MediaKey };
