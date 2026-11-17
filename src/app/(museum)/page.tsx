import type { Metadata } from 'next';
import { HeroSection } from '@/components/museum/hero';
import { EditorialSection } from '@/components/museum/editorial-section';
import { HallShowcase } from '@/components/museum/hall-showcase';
import { FeaturedCollection } from '@/components/museum/featured-collection';
import { AtlasPreview } from '@/components/museum/atlas-preview';
import { EncyclopediaPreview } from '@/components/museum/encyclopedia-preview';
import { DiscoveryPanel } from '@/components/museum/discovery-panel';
import { MuseumCTA } from '@/components/museum/museum-cta';
import { officialUrl, site } from '@/config/site';
import { getPublicEnv } from '@/lib/env';
import { getPublishedHalls } from '@/db/queries/halls';
import { connection } from 'next/server';

const publicEnv = getPublicEnv();
const canonical = officialUrl(publicEnv.appUrl);

/**
 * The museum's entrance page.
 *
 * Metadata is honest by construction: the canonical URL is emitted only when the
 * deployment actually knows its public origin (see `officialUrl`), and the Open
 * Graph image is the same photograph the visitor sees rather than a stock card.
 */
export const metadata: Metadata = {
  // `absolute` because the root layout appends «— گموریا» to every title.
  title: { absolute: 'گموریا — موزهٔ دیجیتال سنگ‌های قیمتی و کانی‌ها' },
  description:
    'موزهٔ دیجیتال سنگ‌های قیمتی، کریستال‌ها، کانی‌های کمیاب و نمونه‌های زمین‌شناسی؛ شش تالار برای دیدن و شناختن، نه برای خرید.',
  ...(canonical ? { alternates: { canonical: `${canonical}/` } } : {}),
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: site.nameLatin,
    title: 'گموریا — جهانی از شگفتی‌های پنهان در دل زمین',
    description:
      'موزهٔ دیجیتال سنگ‌های قیمتی، کریستال‌ها و کانی‌های کمیاب. شش تالار، یک دانشنامه، و هیچ چیز برای فروش.',
    images: [
      {
        url: '/images/hero.webp',
        width: 1584,
        height: 672,
        alt: 'خوشهٔ بلور زمرد طبیعی در نور ویترین موزه',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'گموریا — موزهٔ دیجیتال سنگ‌های قیمتی',
    description: 'شش تالار برای دیدن و شناختن سنگ‌ها و کانی‌ها؛ بدون هیچ قابلیت خرید.',
    images: ['/images/hero.webp'],
  },
};

export default async function MuseumHomePage() {
  // The halls are rows now, so the homepage reads them at request time. The same
  // `connection()` contract as the featured collection keeps `next build` free of a
  // database dependency while making the page honest about what is published today.
  await connection();
  const halls = await getPublishedHalls();
  const hallList = halls.state === 'ready' ? halls.items : [];

  return (
    <>
      {/*
        The order changed with the light pass, and it is worth naming: the rooms
        come first and the institution's story second.

        A visitor who arrives at a museum walks into a gallery before reading the
        wall text about the foundation. The previous order opened with an essay
        about the museum's standards, which is the right thing to say and the
        wrong thing to say first. `#about` still exists, so the hero's «آغاز
        بازدید» lands on it.
      */}
      <HeroSection
        hallCount={hallList.length}
        halls={hallList.map((hall) => ({ title: hall.title, latinName: hall.latinName }))}
      />
      <HallShowcase halls={hallList} />

      {/* Awaited rather than suspended: the collection is one indexed query, and a
          skeleton flashing above the fold costs more than the round trip saves. */}
      <FeaturedCollection />

      <EditorialSection hallCount={hallList.length} />
      <EncyclopediaPreview />
      <AtlasPreview />
      <DiscoveryPanel />
      <MuseumCTA />
    </>
  );
}
