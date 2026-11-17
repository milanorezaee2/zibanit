/**
 * GEMORIA — read model for the encyclopedia.
 *
 * Structure only. The museum ships no article of its own until a curator writes
 * one and cites a source; these functions therefore return an honest empty state
 * on a fresh database rather than a seeded lorem ipsum.
 *
 * The same visibility rules as the collection apply: `published`, not deleted, and
 * a Persian translation. An article that is still being written is invisible, not
 * merely hidden.
 */
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import type { MuseumDatabase } from '@/db/client';
import { resolveDb } from './executor';
import {
  articleSources,
  articleSpecimens,
  articleTranslations,
  articles,
} from '@/db/schema/articles';
import { mediaAssets, mediaTranslations } from '@/db/schema/media';
import {
  specimenTranslations,
  specimens,
} from '@/db/schema/specimens';
import { DEFAULT_LOCALE } from '@/config/app';
import { mediaUrl, type ResolvedImage, type StorageDriverName } from '@/lib/media/storage';

export interface ArticleImage extends ResolvedImage {
  readonly alt: string;
}

export interface ArticleSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly latinTitle: string | null;
  readonly excerpt: string | null;
  readonly publishedAt: string | null;
  readonly image: ArticleImage | null;
}

export interface ArticleDetail extends ArticleSummary {
  readonly body: string | null;
  readonly sources: readonly {
    id: string;
    title: string;
    publisher: string | null;
    url: string | null;
    year: number | null;
  }[];
  readonly specimens: readonly {
    slug: string;
    title: string;
    subtitle: string | null;
    image: ArticleImage | null;
  }[];
}

const publicArticle = and(
  eq(articles.status, 'published'),
  isNull(articles.deletedAt),
  eq(articleTranslations.locale, DEFAULT_LOCALE),
);

function imageFrom(row: {
  key: string | null;
  width: number | null;
  height: number | null;
  driver: string | null;
  alt: string | null;
  title: string;
}): ArticleImage | null {
  if (!row.key || !row.width || !row.height) return null;
  try {
    return {
      src: mediaUrl(row.key, (row.driver ?? 'local') as StorageDriverName),
      width: row.width,
      height: row.height,
      alt: row.alt ?? row.title,
    };
  } catch {
    return null;
  }
}

/** Every published article, newest first. */
export async function listArticles(
  limit = 24,
  db?: MuseumDatabase,
): Promise<readonly ArticleSummary[]> {
  const client = await resolveDb(db);

  const rows = await client
    .select({
      id: articles.id,
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      latinTitle: articleTranslations.latinTitle,
      excerpt: articleTranslations.excerpt,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
      key: mediaAssets.storageKey,
      width: mediaAssets.width,
      height: mediaAssets.height,
      driver: mediaAssets.storageDriver,
      alt: mediaTranslations.altText,
    })
    .from(articles)
    .innerJoin(articleTranslations, eq(articleTranslations.articleId, articles.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, articles.coverMediaId))
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(publicArticle)
    .orderBy(desc(articles.publishedAt), desc(articles.updatedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    latinTitle: row.latinTitle,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    image: imageFrom({ ...row, title: row.title }),
  }));
}

/** One article with its sources and the objects that illustrate it. */
export async function getArticleBySlug(
  slug: string,
  db?: MuseumDatabase,
): Promise<ArticleDetail | null> {
  const client = await resolveDb(db);

  const rows = await client
    .select({
      id: articles.id,
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      latinTitle: articleTranslations.latinTitle,
      excerpt: articleTranslations.excerpt,
      body: articleTranslations.body,
      publishedAt: articles.publishedAt,
      key: mediaAssets.storageKey,
      width: mediaAssets.width,
      height: mediaAssets.height,
      driver: mediaAssets.storageDriver,
      alt: mediaTranslations.altText,
    })
    .from(articles)
    .innerJoin(articleTranslations, eq(articleTranslations.articleId, articles.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, articles.coverMediaId))
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(and(eq(articleTranslations.slug, slug), publicArticle))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [sources, linkedSpecimens] = await Promise.all([
    client
      .select({
        id: articleSources.id,
        title: articleSources.title,
        publisher: articleSources.publisher,
        url: articleSources.url,
        year: articleSources.year,
      })
      .from(articleSources)
      .where(eq(articleSources.articleId, row.id))
      .orderBy(asc(articleSources.sortOrder)),
    client
      .select({
        slug: specimenTranslations.slug,
        title: specimenTranslations.title,
        subtitle: specimenTranslations.subtitle,
        key: mediaAssets.storageKey,
        width: mediaAssets.width,
        height: mediaAssets.height,
        driver: mediaAssets.storageDriver,
        alt: mediaTranslations.altText,
      })
      .from(articleSpecimens)
      .innerJoin(specimens, eq(specimens.id, articleSpecimens.specimenId))
      .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
      .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
      .leftJoin(
        mediaTranslations,
        and(
          eq(mediaTranslations.mediaId, mediaAssets.id),
          eq(mediaTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .where(
        and(
          eq(articleSpecimens.articleId, row.id),
          // The article itself was already proven public by the query above; what
          // must be re-checked here is each linked object, which may have been
          // archived after the article was written.
          eq(specimens.status, 'published'),
          isNull(specimens.deletedAt),
          eq(specimenTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .orderBy(asc(articleSpecimens.sortOrder)),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    latinTitle: row.latinTitle,
    excerpt: row.excerpt,
    body: row.body,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    image: imageFrom({ ...row, title: row.title }),
    sources,
    specimens: linkedSpecimens.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      subtitle: entry.subtitle,
      image: imageFrom({ ...entry, title: entry.title }),
    })),
  };
}

/** Published article slugs, for the sitemap. */
export async function listArticleSlugs(db?: MuseumDatabase): Promise<readonly string[]> {
  const client = await resolveDb(db);

  const rows = await client
    .select({ slug: articleTranslations.slug })
    .from(articles)
    .innerJoin(articleTranslations, eq(articleTranslations.articleId, articles.id))
    .where(publicArticle)
    .orderBy(desc(articles.publishedAt))
    .limit(5_000);

  return rows.map((row) => row.slug);
}
