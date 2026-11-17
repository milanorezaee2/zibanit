/**
 * A projection of the halls for the search dialog.
 *
 * The client dialog needs four fields per hall and nothing else. Importing the
 * full hall records would pull nine blur placeholders and the image manifest into
 * the browser bundle for a search box; this keeps the client payload to text.
 */
import { halls } from './halls';

export interface HallIndexEntry {
  readonly slug: string;
  readonly titleFa: string;
  readonly titleEn: string;
  readonly summary: string;
}

export const hallIndex: readonly HallIndexEntry[] = halls.map((hall) => ({
  slug: hall.slug,
  titleFa: hall.titleFa,
  titleEn: hall.titleEn,
  summary: hall.summary,
}));
