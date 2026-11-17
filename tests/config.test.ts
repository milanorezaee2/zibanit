/**
 * Configuration invariants that would otherwise rot silently.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, DEFAULT_LOCALE, ENABLED_LOCALES, PLANNED_LOCALES } from '@/config/app';
import { adminNav } from '@/config/admin-navigation';
import { footerNav, publicNav, site } from '@/config/site';
import { CRYSTAL_SYSTEMS, CRYSTAL_SYSTEM_LABELS, TAXONOMY_KINDS } from '@/content/mineral';

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
    // Everything shipped as a link must resolve to a real route or an in-page
    // section. Phase 1B added `/search` and `/encyclopedia` as real pages, so the
    // pattern grew with the museum rather than the assertions being loosened.
    for (const item of publicNav) {
      expect(item.available, `${item.label} is still inert`).toBe(true);
      expect(item.href).toMatch(/^(\/(halls|search|encyclopedia)?|\/#[a-z]+)$/);
    }
  });

  it('links the footer to the same real destinations', () => {
    for (const item of footerNav) {
      expect(item.available).toBe(true);
      expect(item.href).toMatch(/^\/(halls|search|encyclopedia|#[a-z]+)?$/);
    }
  });
});

describe('closed scientific vocabularies', () => {
  it('declares the seven crystal systems', () => {
    // Crystallography has had exactly seven classes since the 19th century; the
    // enum in the database and this list must not drift apart.
    expect(CRYSTAL_SYSTEMS).toHaveLength(7);
    for (const system of CRYSTAL_SYSTEMS) {
      expect(CRYSTAL_SYSTEM_LABELS[system].fa.length).toBeGreaterThan(2);
      expect(CRYSTAL_SYSTEM_LABELS[system].en).toMatch(/^[A-Z][a-z]+$/);
    }
  });

  it('declares the four independent classification axes', () => {
    // Display classification (halls) is deliberately not one of them.
    expect(TAXONOMY_KINDS).toEqual([
      'mineral_family',
      'scientific_group',
      'specimen_type',
      'origin_kind',
    ]);
    expect(TAXONOMY_KINDS as readonly string[]).not.toContain('hall');
  });
});
