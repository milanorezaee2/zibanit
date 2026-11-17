/**
 * Configuration invariants that would otherwise rot silently.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, DEFAULT_LOCALE, ENABLED_LOCALES, PLANNED_LOCALES } from '@/config/app';
import { adminNav } from '@/config/admin-navigation';
import { footerNav, publicNav, site } from '@/config/site';
import { halls } from '@/content/halls';

describe('build version', () => {
  it('matches package.json', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    ) as { version: string };
    expect(APP_VERSION).toBe(pkg.version);
  });
});

describe('locale configuration', () => {
  it('enables Persian only in Phase 0', () => {
    expect(ENABLED_LOCALES).toEqual(['fa']);
    expect(DEFAULT_LOCALE).toBe('fa');
  });

  it('already describes the languages the architecture must accommodate', () => {
    expect(PLANNED_LOCALES.map((locale) => locale.code)).toEqual(['fa', 'en', 'ar']);
    expect(PLANNED_LOCALES.find((locale) => locale.code === 'en')?.direction).toBe('ltr');
    expect(PLANNED_LOCALES.find((locale) => locale.code === 'ar')?.direction).toBe('rtl');
  });
});

describe('public navigation', () => {
  it('never presents an unavailable section as a link', () => {
    for (const item of publicNav) {
      if (!item.available) {
        expect(item.phase, `${item.label} must state its phase`).toBeTruthy();
      }
    }
  });

  it('keeps the home route available', () => {
    expect(publicNav[0]).toMatchObject({ href: '/', available: true });
  });

  it('points every primary entry at something that exists', () => {
    // Phase 1A makes the whole primary navigation real. Anything shipped as a
    // link must resolve to a page or an in-page section.
    for (const item of publicNav) {
      expect(item.available, `${item.label} is still inert`).toBe(true);
      expect(item.href).toMatch(/^(\/(halls)?|\/#[a-z]+)$/);
    }
  });

  it('links the footer to the same real destinations', () => {
    for (const item of footerNav) {
      expect(item.available).toBe(true);
      expect(item.href).toMatch(/^\/(halls|#[a-z]+)?$/);
    }
  });
});

describe('museum halls', () => {
  it('declares the six halls of the museum', () => {
    expect(halls).toHaveLength(6);
  });

  it('gives every hall a Persian title, a Latin title, a summary and an image', () => {
    for (const hall of halls) {
      expect(hall.titleFa.length).toBeGreaterThan(3);
      expect(hall.titleEn).toMatch(/^[A-Z][A-Za-z-]+( [A-Za-z-]+)*$/);
      expect(hall.summary.length).toBeGreaterThan(40);
      expect(hall.imageKey).toBeTruthy();
      expect(hall.imageAlt.length).toBeGreaterThan(20);
    }
  });

  it('keeps hall slugs unique and URL-safe', () => {
    const slugs = halls.map((hall) => hall.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z][a-z-]*$/);
  });

  it('never presents a specimen record in the hall configuration', () => {
    // Halls are architecture; objects come from the database. A hall entry that
    // carried a specimen's name would be hard-coded museum content.
    for (const hall of halls) {
      expect(Object.keys(hall).sort()).toEqual(
        ['emphasis', 'imageAlt', 'imageKey', 'slug', 'summary', 'titleEn', 'titleFa'].sort(),
      );
    }
  });
});

describe('administration navigation', () => {
  it('declares a permission for every entry', () => {
    for (const group of adminNav) {
      for (const item of group.items) {
        expect(item.permission).toMatch(/^[a-z_]+\.[a-z_]+$/);
        expect(item.href.startsWith('/admin')).toBe(true);
      }
    }
  });

  it('exposes exactly one implemented destination in Phase 0', () => {
    const available = adminNav.flatMap((group) => group.items).filter((item) => item.available);
    expect(available).toHaveLength(1);
    expect(available[0]?.href).toBe('/admin');
  });
});

describe('brand', () => {
  it('states that the museum is not a shop', () => {
    expect(site.descriptionFa).toMatch(/نه برای خرید|فروشگاه/);
  });
});
