#!/usr/bin/env python3
"""Build public/stats-card.svg from public/live-stats.json.

Renders a dark, self-contained SVG "stats card" for the psmux README:
a 720px-wide panel with the psmux wordmark, tagline, and six cumulative,
always-positive stat tiles (stars, forks, contributors, companies,
universities, countries). No trend lines, no time series, no external
font/script/image references - everything needed to render is inlined
in the SVG so it works through GitHub's camo image proxy.

Usage:
  python scripts/build-stats-card.py [--stats public/live-stats.json] [--out public/stats-card.svg]

Pure standard library - no third-party dependencies.
"""
from __future__ import annotations

import argparse
import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

# ---------------------------------------------------------------------------
# Palette - matches src/index.css custom properties used across the site.
# ---------------------------------------------------------------------------
BG_FROM = "#0a0a12"
BG_TO = "#12121a"
BORDER = "rgba(129, 140, 248, 0.25)"
TILE_BORDER = "rgba(129, 140, 248, 0.14)"
TILE_FILL = "rgba(255, 255, 255, 0.025)"
TEXT_PRIMARY = "#f0f0f5"
TEXT_SECONDARY = "#a0a0b8"
TEXT_MUTED = "#6b6b80"
ACCENT = "#818cf8"
ACCENT_BRIGHT = "#a5b4fc"
ACCENT_SOFT = "#c7d2fe"
PINK = "#f472b6"
AMBER = "#fbbf24"

FONT_SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
FONT_MONO = "'Cascadia Code', 'Consolas', 'SFMono-Regular', Menlo, monospace"

CARD_W = 720
CARD_H = 412
RADIUS = 16

PAD_X = 40


def format_number(n: int) -> str:
    """Elegant, always-positive number formatting: commas under 10k, k/M above."""
    n = max(0, int(n))
    if n >= 1_000_000:
        v = n / 1_000_000
        s = f"{v:.1f}".rstrip("0").rstrip(".")
        return f"{s}M"
    if n >= 10_000:
        v = n / 1000
        s = f"{v:.1f}".rstrip("0").rstrip(".")
        return f"{s}k"
    return f"{n:,}"


def star_polygon(cx: float, cy: float, outer_r: float, inner_r: float, points: int = 5) -> str:
    """Return an SVG <polygon> points string for a filled n-point star."""
    coords = []
    for i in range(points * 2):
        angle = math.radians(-90 + i * (180.0 / points))
        r = outer_r if i % 2 == 0 else inner_r
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        coords.append(f"{x:.2f},{y:.2f}")
    return " ".join(coords)


# A well-known simple filled-heart glyph in a 24x24 box, used via <g transform>
# so it can be sized/positioned without depending on any font's glyph coverage.
HEART_PATH_D = (
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3 "
    "c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5 "
    "c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
)


def load_stats(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_svg(stats: dict) -> str:
    stars = stats.get("stars", 0) or 0
    forks = stats.get("forks", 0) or 0
    contributors = stats.get("contributors", 0) or 0
    companies = stats.get("companiesRepresented", 0) or 0
    universities = stats.get("universities", 0) or 0
    countries = stats.get("countries", 0) or 0
    version = str(stats.get("latestVersion") or "").strip()

    tiles = [
        ("STARS", format_number(stars), True),
        ("FORKS", format_number(forks), False),
        ("CONTRIBUTORS", format_number(contributors), False),
        ("COMPANIES+", format_number(companies), False),
        ("UNIVERSITIES+", format_number(universities), False),
        ("COUNTRIES+", format_number(countries), False),
    ]

    # --- grid geometry -----------------------------------------------------
    cols, rows = 3, 2
    gap = 14
    grid_top = 108
    tile_w = (CARD_W - 2 * PAD_X - (cols - 1) * gap) / cols
    tile_h = 108.0

    def col_x(i: int) -> float:
        return PAD_X + i * (tile_w + gap)

    def row_y(j: int) -> float:
        return grid_top + j * (tile_h + gap)

    grid_bottom = row_y(rows - 1) + tile_h

    parts: list[str] = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CARD_W}" height="{CARD_H}" '
        f'viewBox="0 0 {CARD_W} {CARD_H}" role="img" aria-label="psmux project statistics">'
    )
    parts.append(f"<title>psmux stats</title>")

    # defs: gradients + clip path, all inline, no external references.
    parts.append("<defs>")
    parts.append(
        f'<clipPath id="cardClip"><rect x="0" y="0" width="{CARD_W}" height="{CARD_H}" '
        f'rx="{RADIUS}" ry="{RADIUS}"/></clipPath>'
    )
    parts.append(
        '<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">'
        f'<stop offset="0%" stop-color="{BG_FROM}"/>'
        f'<stop offset="100%" stop-color="{BG_TO}"/>'
        "</linearGradient>"
    )
    parts.append(
        '<radialGradient id="glowGrad" cx="20%" cy="0%" r="75%">'
        f'<stop offset="0%" stop-color="{ACCENT}" stop-opacity="0.20"/>'
        f'<stop offset="55%" stop-color="{ACCENT}" stop-opacity="0.05"/>'
        f'<stop offset="100%" stop-color="{ACCENT}" stop-opacity="0"/>'
        "</radialGradient>"
    )
    parts.append(
        '<linearGradient id="numGrad" x1="0%" y1="0%" x2="0%" y2="100%">'
        f'<stop offset="0%" stop-color="{ACCENT_SOFT}"/>'
        f'<stop offset="100%" stop-color="{ACCENT}"/>'
        "</linearGradient>"
    )
    parts.append("</defs>")

    # clipped background + glow + all content
    parts.append('<g clip-path="url(#cardClip)">')
    parts.append(f'<rect x="0" y="0" width="{CARD_W}" height="{CARD_H}" fill="url(#bgGrad)"/>')
    parts.append(f'<rect x="0" y="0" width="{CARD_W}" height="{CARD_H}" fill="url(#glowGrad)"/>')

    # --- header: icon mark + wordmark + tagline ----------------------------
    icon_x, icon_y, icon_s = PAD_X, 32, 32
    parts.append(
        f'<rect x="{icon_x}" y="{icon_y}" width="{icon_s}" height="{icon_s}" rx="8" ry="8" '
        f'fill="rgba(129,140,248,0.10)" stroke="rgba(129,140,248,0.35)" stroke-width="1"/>'
    )
    parts.append(
        f'<text x="{icon_x + icon_s / 2}" y="{icon_y + icon_s / 2 + 5}" text-anchor="middle" '
        f'font-family="{FONT_MONO}" font-size="14" font-weight="700" fill="{ACCENT_BRIGHT}">&gt;_</text>'
    )

    # Title baseline is set so the cap-height of "psmux" is vertically
    # centered on the icon badge; the tagline flows just below the icon.
    title_x = icon_x + icon_s + 14
    title_baseline = icon_y + 25
    tagline_baseline = title_baseline + 18
    parts.append(
        f'<text x="{title_x}" y="{title_baseline}" font-family="{FONT_SANS}" font-size="26" '
        f'font-weight="700" letter-spacing="-0.4" fill="{TEXT_PRIMARY}">psmux</text>'
    )
    parts.append(
        f'<text x="{title_x}" y="{tagline_baseline}" font-family="{FONT_SANS}" font-size="13" '
        f'font-weight="500" fill="{TEXT_SECONDARY}">The native tmux for Windows</text>'
    )

    if version:
        label = xml_escape(f"v{version}")
        pill_w = 58
        pill_h = 22
        pill_x = CARD_W - PAD_X - pill_w
        pill_y = icon_y + (icon_s - pill_h) / 2
        parts.append(
            f'<rect x="{pill_x}" y="{pill_y}" width="{pill_w}" height="22" rx="11" ry="11" '
            f'fill="rgba(129,140,248,0.10)" stroke="rgba(129,140,248,0.30)" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{pill_x + pill_w / 2}" y="{pill_y + 15}" text-anchor="middle" '
            f'font-family="{FONT_MONO}" font-size="11" font-weight="600" fill="{ACCENT_BRIGHT}">{label}</text>'
        )

    # --- stat tiles ----------------------------------------------------------
    for idx, (label, value, show_star) in enumerate(tiles):
        i = idx % cols
        j = idx // cols
        tx = col_x(i)
        ty = row_y(j)
        cx = tx + tile_w / 2

        parts.append(
            f'<rect x="{tx:.2f}" y="{ty:.2f}" width="{tile_w:.2f}" height="{tile_h:.2f}" rx="12" ry="12" '
            f'fill="{TILE_FILL}" stroke="{TILE_BORDER}" stroke-width="1"/>'
        )

        if show_star:
            star_cx = tx + tile_w - 18
            star_cy = ty + 18
            pts = star_polygon(star_cx, star_cy, outer_r=7, inner_r=3)
            parts.append(f'<polygon points="{pts}" fill="{AMBER}" opacity="0.55"/>')

        value_esc = xml_escape(value)
        parts.append(
            f'<text x="{cx:.2f}" y="{ty + 52:.2f}" text-anchor="middle" font-family="{FONT_SANS}" '
            f'font-size="34" font-weight="700" letter-spacing="-0.5" '
            f'font-variant-numeric="tabular-nums" fill="url(#numGrad)">{value_esc}</text>'
        )

        label_esc = xml_escape(label)
        parts.append(
            f'<text x="{cx:.2f}" y="{ty + 82:.2f}" text-anchor="middle" font-family="{FONT_SANS}" '
            f'font-size="11" font-weight="600" letter-spacing="1.1" fill="{TEXT_SECONDARY}">{label_esc}</text>'
        )

    # --- footer: divider + heart accent + muted note ------------------------
    divider_y = grid_bottom + 24
    parts.append(
        f'<line x1="{PAD_X}" y1="{divider_y:.2f}" x2="{CARD_W - PAD_X}" y2="{divider_y:.2f}" '
        f'stroke="rgba(129,140,248,0.15)" stroke-width="1"/>'
    )

    footer_y = divider_y + 30
    heart_size = 13
    heart_x = PAD_X
    heart_y = footer_y - heart_size + 2
    scale = heart_size / 24
    parts.append(
        f'<g transform="translate({heart_x},{heart_y:.2f}) scale({scale:.4f})">'
        f'<path d="{HEART_PATH_D}" fill="{PINK}" opacity="0.85"/></g>'
    )
    parts.append(
        f'<text x="{heart_x + heart_size + 10}" y="{footer_y:.2f}" font-family="{FONT_SANS}" '
        f'font-size="12" font-weight="500" fill="{TEXT_MUTED}">Live data from GitHub, refreshed twice a week</text>'
    )

    parts.append("</g>")  # close clipped content group

    # border stroke drawn last, on top, unclipped so corners stay crisp
    parts.append(
        f'<rect x="0.5" y="0.5" width="{CARD_W - 1}" height="{CARD_H - 1}" rx="{RADIUS - 0.5}" '
        f'ry="{RADIUS - 0.5}" fill="none" stroke="{BORDER}" stroke-width="1"/>'
    )

    parts.append("</svg>")
    return "".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--stats",
        type=Path,
        default=Path("public/live-stats.json"),
        help="Path to live-stats.json (default: public/live-stats.json)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("public/stats-card.svg"),
        help="Output SVG path (default: public/stats-card.svg)",
    )
    args = parser.parse_args()

    stats = load_stats(args.stats)
    svg = build_svg(stats)

    # Fail loudly if the generated markup isn't well-formed XML - this card
    # ships straight into the README, it must never be broken.
    ET.fromstring(svg)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(svg, encoding="utf-8", newline="\n")
    print(f"Wrote {args.out} ({len(svg)} bytes)")


if __name__ == "__main__":
    main()
