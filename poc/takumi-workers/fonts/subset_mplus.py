#!/usr/bin/env python3
"""Build the documented M PLUS 1p 700 JIS level-one PoC subset."""

import argparse
import json
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

FONT_DIR = Path(__file__).resolve().parent
WORKER_DIR = FONT_DIR.parent


def jis_level_one_characters() -> str:
    characters = {chr(codepoint) for codepoint in range(0x20, 0x7F)} | {"□", "…"}
    for row in (*range(1, 9), *range(16, 48)):
        for cell in range(1, 95):
            try:
                characters.add(bytes((0xA0 + row, 0xA0 + cell)).decode("euc_jp"))
            except UnicodeDecodeError:
                continue
    return "".join(sorted(characters))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Google Fonts M PLUS1p-Bold.ttf")
    parser.add_argument(
        "--font-output", type=Path, default=FONT_DIR / "MPLUS1p-700-jis1.woff2"
    )
    parser.add_argument(
        "--coverage-output", type=Path, default=WORKER_DIR / "src/font-coverage.json"
    )
    args = parser.parse_args()

    characters = jis_level_one_characters()
    font = TTFont(args.source)
    font.recalcTimestamp = False
    subsetter = Subsetter(options=Options())
    subsetter.populate(text=characters)
    subsetter.subset(font)
    font.flavor = "woff2"
    args.font_output.parent.mkdir(parents=True, exist_ok=True)
    font.save(args.font_output)
    args.coverage_output.write_text(
        json.dumps({"characters": characters}, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"Subset: {len(characters)} Unicode characters")
    print(f"WOFF2: {args.font_output} ({args.font_output.stat().st_size:,} bytes)")
    print(f"Coverage: {args.coverage_output}")


if __name__ == "__main__":
    main()
