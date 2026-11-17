/**
 * Typography verification — against the actual binary files, not the intention.
 *
 * A Persian museum site fails quietly if a typeface cannot render «», ۷ or a
 * zero-width non-joiner: the browser silently substitutes a system font and the
 * brand falls apart one glyph at a time. These assertions make that failure loud.
 *
 * This is why the shipped files are *merged* subsets: the upstream "arabic"
 * subset contains no Latin punctuation, so every «» in a Persian sentence would
 * have fallen back. See scripts/fonts/README.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as fontkit from 'fontkit';
import { describe, expect, it } from 'vitest';
import {
  FONTS,
  FONT_ROLE_LIST,
  REQUIRED_GLYPH_SETS,
  SHAPING_SAMPLES,
  SHIPPED_FONT_FILES,
} from '@/config/fonts';

const FONT_DIR = path.join(process.cwd(), 'src', 'fonts');
const APP_FONTS_SOURCE = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'fonts.ts'), 'utf8');

interface LoadedFont {
  file: string;
  font: fontkit.Font;
}

function loadShippedFonts(): LoadedFont[] {
  return SHIPPED_FONT_FILES.map((file) => ({
    file,
    font: fontkit.openSync(path.join(FONT_DIR, file)) as fontkit.Font,
  }));
}

function missingGlyphs(font: fontkit.Font, text: string): string[] {
  return [...new Set([...text])].filter(
    (char) => char.trim() !== '' && !font.hasGlyphForCodePoint(char.codePointAt(0)!),
  );
}

describe('shipped font files', () => {
  it('ships every declared file, and nothing else', () => {
    const onDisk = fs.readdirSync(FONT_DIR).filter((file) => file.endsWith('.woff2')).sort();
    expect(onDisk).toEqual([...SHIPPED_FONT_FILES].sort());
  });

  it('all files are valid WOFF2 with the correct signature', () => {
    for (const file of SHIPPED_FONT_FILES) {
      const buffer = fs.readFileSync(path.join(FONT_DIR, file));
      expect(buffer.subarray(0, 4).toString('ascii'), `${file} signature`).toBe('wOF2');
      expect(buffer.byteLength, `${file} size`).toBeGreaterThan(10_000);
    }
  });

  it('keeps the total font payload within the performance budget (300 KB)', () => {
    const total = SHIPPED_FONT_FILES.reduce(
      (sum, file) => sum + fs.statSync(path.join(FONT_DIR, file)).size,
      0,
    );
    expect(total).toBeLessThan(300 * 1024);
  });
});

describe('Persian body face (Vazirmatn)', () => {
  const body = FONTS.body;
  const files = loadShippedFonts().filter((entry) =>
    body.sources.some((source) => source.file === entry.file),
  );

  it('covers Persian letters, Arabic-only letters and both numeral systems', () => {
    for (const { file, font } of files) {
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.persianLetters), `${file} persian`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.arabicOnlyLetters), `${file} arabic`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.persianNumerals), `${file} ۰-۹`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.arabicIndicNumerals), `${file} ٠-٩`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.arabicPunctuation), `${file} عربی`).toEqual([]);
    }
  });

  it('covers Latin punctuation and the Latin wordmark — the reason the subsets were merged', () => {
    for (const { file, font } of files) {
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.latinPunctuation), `${file} latin punct`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.latinLetters), `${file} latin letters`).toEqual([]);
    }
  });
});

describe('Persian display face (Noto Naskh Arabic)', () => {
  const display = FONTS.display;
  const files = loadShippedFonts().filter((entry) =>
    display.sources.some((source) => source.file === entry.file),
  );

  it('covers Persian, Arabic, numerals and punctuation', () => {
    for (const { file, font } of files) {
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.persianLetters), `${file} persian`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.persianNumerals), `${file} numerals`).toEqual([]);
      expect(missingGlyphs(font, REQUIRED_GLYPH_SETS.latinPunctuation), `${file} punctuation`).toEqual([]);
    }
  });

  it('ships both the 400 and 700 weights the headings rely on', () => {
    expect(display.sources.map((source) => source.weight)).toEqual(['400', '700']);
  });
});

describe('Latin wordmark (Cormorant Garamond)', () => {
  it('renders GEMORIA without falling back', () => {
    const latin = FONTS.latin;
    const loaded = loadShippedFonts().filter((entry) =>
      latin.sources.some((source) => source.file === entry.file),
    );
    expect(loaded).toHaveLength(1);
    expect(missingGlyphs(loaded[0]!.font, REQUIRED_GLYPH_SETS.latinLetters)).toEqual([]);
  });
});

describe('shaping integrity', () => {
  const loaded = loadShippedFonts();

  /** The two faces that must render Persian: display and body. */
  const persianFaces = loaded.filter(({ file }) =>
    FONTS.display.sources.some((source) => source.file === file) ||
    FONTS.body.sources.some((source) => source.file === file),
  );

  it('produces no .notdef glyph for any Persian shaping sample', () => {
    expect(persianFaces.length).toBeGreaterThanOrEqual(4);

    for (const { file, font } of persianFaces) {
      for (const sample of [
        SHAPING_SAMPLES.persianWord,
        SHAPING_SAMPLES.withoutZwnj,
        SHAPING_SAMPLES.numerals,
        SHAPING_SAMPLES.punctuation,
      ]) {
        const glyphIds = font.layout(sample).glyphs.map((glyph) => glyph.id);
        expect(glyphIds, `${file} ← ${sample}`).not.toContain(0);
      }
    }
  });

  it('treats the zero-width non-joiner as a break in joining, not as a glyph', () => {
    const body = loaded.find((entry) => entry.file === FONTS.body.sources[0]!.file)!;
    const withZwnj = body.font.layout(SHAPING_SAMPLES.withZwnj).glyphs;
    const withoutZwnj = body.font.layout(SHAPING_SAMPLES.withoutZwnj).glyphs;

    // «می‌سازد» and «میسازد» must not shape identically: the joining decisions differ.
    expect(withZwnj.length).not.toBe(withoutZwnj.length);
    expect(withZwnj.map((glyph) => glyph.id)).not.toEqual(withoutZwnj.map((glyph) => glyph.id));
  });

  it('shapes mixed Persian/Latin/numerals in a single run in the body face', () => {
    // This is the whole reason the arabic and latin subsets were merged into one
    // file: one run, three scripts, no substitution required.
    const body = loaded.find((entry) => entry.file === FONTS.body.sources[0]!.file)!;
    const glyphs = body.font.layout(SHAPING_SAMPLES.mixedDirection).glyphs;

    expect(glyphs.length).toBeGreaterThan(0);
    expect(glyphs.map((glyph) => glyph.id)).not.toContain(0);
  });

  it('keeps the Latin wordmark face Latin-only by design', () => {
    // A deliberate negative test: Cormorant Garamond is the wordmark face and must
    // never be used for Persian text. If this ever stops being true, the role split
    // has silently drifted.
    const latin = loaded.find((entry) => entry.file === FONTS.latin.sources[0]!.file)!;
    expect(missingGlyphs(latin.font, SHAPING_SAMPLES.persianWord)).not.toEqual([]);
    expect(APP_FONTS_SOURCE).toContain(FONTS.latin.cssVariable);
  });
});

describe('font configuration contract', () => {
  it('declares three roles with distinct CSS variables and utilities', () => {
    expect(FONT_ROLE_LIST).toHaveLength(3);
    expect(new Set(FONT_ROLE_LIST.map((role) => role.cssVariable)).size).toBe(3);
    expect(new Set(FONT_ROLE_LIST.map((role) => role.utilityClass)).size).toBe(3);
  });

  it('agrees with the literal paths in src/app/fonts.ts (no drift)', () => {
    for (const file of SHIPPED_FONT_FILES) {
      expect(APP_FONTS_SOURCE, `${file} must be loaded by next/font`).toContain(file);
    }
    for (const role of FONT_ROLE_LIST) {
      expect(APP_FONTS_SOURCE, `${role.cssVariable} must be declared`).toContain(role.cssVariable);
    }
  });

  it('every role states a licence and an allowed usage', () => {
    for (const role of FONT_ROLE_LIST) {
      expect(role.license).toMatch(/OFL|license/i);
      expect(role.allowedUsage.length).toBeGreaterThan(20);
    }
  });
});
