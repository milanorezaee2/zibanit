/**
 * Persian normalisation — the rules that decide whether a visitor finds anything.
 *
 * Each case is a real difference a Persian keyboard and a Persian editor produce
 * for the same word. If one of these regresses, search silently stops working for
 * a subset of users, which is exactly the kind of failure a test should catch.
 */
import { describe, expect, it } from 'vitest';
import {
  buildSearchText,
  normalizePersian,
  normalizeQuery,
  persianSortKey,
} from '@/lib/search/normalize';

describe('Persian normalisation', () => {
  it('folds Arabic yeh and kaf onto the Persian letters', () => {
    expect(normalizePersian('ياقوت')).toBe('یاقوت');
    expect(normalizePersian('كوارتز')).toBe('کوارتز');
    expect(normalizePersian('مينا')).toBe('مینا');
  });

  it('removes the zero-width non-joiner so a half-space is optional', () => {
    expect(normalizePersian('نیمه\u200Cقیمتی')).toBe('نیمهقیمتی');
    expect(normalizePersian('نیمه‌قیمتی')).toBe('نیمهقیمتی');
    expect(normalizePersian('نیمه قیمتی')).toBe('نیمه قیمتی');
  });

  it('strips harakat and tatweel', () => {
    expect(normalizePersian('مُروارید')).toBe('مروارید');
    expect(normalizePersian('کـــوارتز')).toBe('کوارتز');
  });

  it('folds Persian and Arabic numerals to ASCII', () => {
    expect(normalizePersian('۱۴۰۴')).toBe('1404');
    expect(normalizePersian('٤٢')).toBe('42');
  });

  it('collapses whitespace and lower-cases Latin text', () => {
    expect(normalizePersian('  Emerald   Muzo  ')).toBe('emerald muzo');
  });

  it('turns a query into tokens with no operator characters', () => {
    expect(normalizeQuery('زمرد & یاقوت | !کوارتز')).toBe('زمرد یاقوت کوارتز');
    expect(normalizeQuery('  ')).toBe('');
    expect(normalizeQuery("'; drop table specimens; --")).toBe('drop table specimens');
  });

  it('builds an index document from every searchable field, without duplicates', () => {
    const document = buildSearchText({
      title: 'زمرد موزو',
      scientificName: 'Beryl',
      chemicalFormula: 'Be₃Al₂Si₆O₁₈',
      slug: 'emerald-muzo',
      summary: 'زمرد سبز',
      colors: ['سبز'],
      labels: ['بریل'],
      localities: ['کلمبیا', 'موگوک'],
    });

    for (const term of ['زمرد', 'موزو', 'beryl', 'emerald', 'کلمبیا', 'موگوک', 'بریل', 'سبز']) {
      expect(document, `«${term}» باید در سند جست‌وجو باشد`).toContain(term);
    }

    expect(document.split(' ').filter((word) => word === 'زمرد')).toHaveLength(1);
  });

  it('sorts in Persian alphabetical order, not in code-point order', () => {
    const words = ['یاقوت', 'آبان', 'بهرام', 'پروین', 'کوارتز', 'گچ'];
    const sorted = [...words].sort((a, b) => persianSortKey(a).localeCompare(persianSortKey(b)));

    // ک precedes گ in the Persian alphabet, and آ precedes ا.
    expect(sorted).toEqual(['آبان', 'بهرام', 'پروین', 'کوارتز', 'گچ', 'یاقوت']);

    // The pair that proves the point: «چ» and «پ» are Persian letters that Unicode
    // places *after* «ح» and «ب», so a naive code-point sort gets them wrong.
    const persianPair = ['حرف', 'چای'];
    const byKey = [...persianPair].sort((a, b) =>
      persianSortKey(a).localeCompare(persianSortKey(b)),
    );
    expect(byKey).toEqual(['چای', 'حرف']);
    expect([...persianPair].sort()).toEqual(['حرف', 'چای']);
  });

  it('sorts Latin designations after every Persian title', () => {
    const persian = persianSortKey('یاقوت');
    const latin = persianSortKey('Zircon');
    expect(latin > persian).toBe(true);
  });
});
