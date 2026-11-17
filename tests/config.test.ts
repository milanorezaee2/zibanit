/**
 * Configuration invariants that would otherwise rot silently.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, DEFAULT_LOCALE, ENABLED_LOCALES, PLANNED_LOCALES } from '@/config/app';
import { adminNav } from '@/config/admin-navigation';
import { museumSections, publicNav, site } from '@/config/site';

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
});

describe('museum sections', () => {
  it('describes four sections with numerals and phases', () => {
    expect(museumSections).toHaveLength(4);
    expect(museumSections.map((section) => section.numeral)).toEqual(['۰۱', '۰۲', '۰۳', '۰۴']);
    for (const section of museumSections) {
      expect(section.phase).toMatch(/^فاز/);
      expect(section.description.length).toBeGreaterThan(40);
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
