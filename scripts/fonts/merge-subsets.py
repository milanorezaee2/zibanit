#!/usr/bin/env python3
"""
GEMORIA — rebuild the shipped webfont files from upstream subsets.

Why this script exists
----------------------
The `@fontsource/*` packages ship each family cut into per-script subsets
(`arabic`, `latin`, …). They cannot be used as-is:

  * the `arabic` subset of Vazirmatn has **no Latin letters**, so a Persian page
    would render every number and every `gemoria` in a fallback face;
  * the `arabic` subset of Noto Naskh Arabic is missing the punctuation Persian
    typography actually uses — `« » . ( ) — / %` and friends;
  * loading `arabic` + `latin` as two separate `@font-face` rules makes the
    browser choose per glyph, which breaks mixed-direction runs and ligatures.

So the subsets are merged into **one file per family per weight**, which is what
`src/fonts/` contains and what `src/app/fonts.ts` declares. Merging is a
re-packaging of the same glyph outlines — no drawing, no hinting changes, no
derivative work beyond format conversion, which the SIL Open Font License allows
(the fonts stay under the OFL; see `docs/FONTS.md`).

Usage
-----
    python3 -m venv .venv-fonts && .venv-fonts/bin/pip install fonttools brotli
    npm install --no-save @fontsource/vazirmatn @fontsource/noto-naskh-arabic \
                             @fontsource/cormorant-garamond
    .venv-fonts/bin/python scripts/fonts/merge-subsets.py

Output is written into `src/fonts/`. Committing the result is intentional: the
production build must never need Python or network access (see D-03).
"""

from __future__ import annotations

import pathlib
import sys

from fontTools.merge import Merger

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "node_modules" / "@fontsource"
OUT = ROOT / "src" / "fonts"

# (output file, [(package, subset, weight), ...]) — ordered so that the
# Arabic/Latin pair of the same weight is merged into a single file.
JOBS: list[tuple[str, list[tuple[str, str, int]]]] = [
    (
        "vazirmatn-arabic-latin-400.woff2",
        [("vazirmatn", "arabic", 400), ("vazirmatn", "latin", 400)],
    ),
    (
        "vazirmatn-arabic-latin-500.woff2",
        [("vazirmatn", "arabic", 500), ("vazirmatn", "latin", 500)],
    ),
    (
        "vazirmatn-arabic-latin-700.woff2",
        [("vazirmatn", "arabic", 700), ("vazirmatn", "latin", 700)],
    ),
    (
        "noto-naskh-arabic-400.woff2",
        [("noto-naskh-arabic", "arabic", 400), ("noto-naskh-arabic", "latin", 400)],
    ),
    (
        "noto-naskh-arabic-700.woff2",
        [("noto-naskh-arabic", "arabic", 700), ("noto-naskh-arabic", "latin", 700)],
    ),
    # Cormorant Garamond is deliberately Latin-only: it is the wordmark face.
    # `tests/fonts.test.ts` asserts it has no Arabic coverage, so nobody quietly
    # starts setting Persian prose in it.
    (
        "cormorant-garamond-600.woff2",
        [("cormorant-garamond", "latin", 600)],
    ),
]


def source_path(package: str, subset: str, weight: int) -> pathlib.Path:
    return SRC / package / "files" / f"{package}-{subset}-{weight}-normal.woff2"


def main() -> int:
    if not SRC.is_dir():
        print(f"✗ {SRC} not found — install the @fontsource packages first.", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)

    for filename, parts in JOBS:
        inputs = [source_path(pkg, subset, weight) for pkg, subset, weight in parts]
        missing = [str(path) for path in inputs if not path.is_file()]
        if missing:
            print("✗ missing source subset(s):", file=sys.stderr)
            for path in missing:
                print(f"    {path}", file=sys.stderr)
            return 1

        merged = Merger().merge([str(path) for path in inputs])
        merged.flavor = "woff2"
        target = OUT / filename
        merged.save(str(target))
        print(f"✓ {filename}  ({target.stat().st_size / 1024:.1f} KB)  ← "
              + " + ".join(pkg + "/" + subset for pkg, subset, _ in parts))

    print(f"\nDone. {len(JOBS)} files written to {OUT.relative_to(ROOT)}.")
    print("Next: `npx vitest run tests/fonts.test.ts` — glyph coverage is asserted there.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
