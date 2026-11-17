/**
 * Minimal ambient types for `fontkit`, limited to what the typography tests use.
 *
 * The package ships no declarations and has no published @types. Rather than pull
 * an unmaintained community package into the dependency tree, the surface actually
 * exercised by `tests/fonts.test.ts` is declared here — and it is deliberately
 * narrow: glyph coverage and shaping output, nothing more.
 */
declare module 'fontkit' {
  export interface FontGlyph {
    id: number;
    name: string;
  }

  export interface FontLayout {
    glyphs: FontGlyph[];
    advanceWidth: number;
  }

  export interface Font {
    readonly numGlyphs: number;
    hasGlyphForCodePoint(codePoint: number): boolean;
    layout(text: string): FontLayout;
  }

  export function openSync(filePath: string): Font;
  export function open(filePath: string): Promise<Font>;
}
