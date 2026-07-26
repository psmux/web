#!/usr/bin/env python3
"""Build public/stats-card.svg from public/live-stats.json.

Renders a dark, self-contained SVG "stats card" for the psmux README with
four clearly separated regions:

  1. Header      - terminal glyph, "psmux" wordmark, tagline, version pill.
  2. Companies   - "USED BY ENGINEERS AT" chips, picked from live-stats
                   topCompanies via a known-brand preference list, plus a
                   muted "N+ more companies" chip.
  3. Star chart  - "STARS OVER TIME" cumulative area chart built from
                   live-stats starHistory (omitted gracefully, and the card
                   height shrinks, if starHistory is missing or too short).
  4. Tiles       - a compact row of always-positive stat tiles, followed by
                   the pink heart footer line.

Everything needed to render is inlined (no external font/script/image
references) so the SVG works through GitHub's camo image proxy.

Usage:
  python scripts/build-stats-card.py [--stats public/live-stats.json] [--out public/stats-card.svg]

Pure standard library - no third-party dependencies.
"""
from __future__ import annotations

import argparse
import json
import math
import re
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
RADIUS = 16

PAD_X = 40

# Companies known well enough to show by name; order is the display
# preference order used when multiple brands are present in the data.
KNOWN_BRANDS = [
    "Microsoft", "Google", "Samsung", "Huawei", "Alibaba", "Tencent",
    "Broadcom", "IBM", "NVIDIA", "Amazon", "Intel", "Oracle", "SAP",
]
MAX_BRAND_CHIPS = 7

MONTH_ABBR = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


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


def round_down_remaining(n: int) -> int:
    """Floor a "more companies" count to a tidy round number for the chip."""
    n = max(0, int(n))
    if n < 20:
        return n
    if n < 200:
        return (n // 10) * 10
    return (n // 50) * 50


def month_label(yyyy_mm: str) -> str:
    """"2026-07" -> "Jul '26". Falls back to the raw string if unparsable."""
    m = re.match(r"^(\d{4})-(\d{1,2})$", str(yyyy_mm or "").strip())
    if not m:
        return str(yyyy_mm or "")
    year, month = int(m.group(1)), int(m.group(2))
    if not 1 <= month <= 12:
        return str(yyyy_mm)
    return f"{MONTH_ABBR[month - 1]} '{year % 100:02d}"


def text_width(s: str, font_size: float, bold: bool = True) -> float:
    """Rough proportional-font width estimate - no metrics available at
    build time, so this heuristic is used purely for SVG layout math."""
    factor = 0.60 if bold else 0.54
    return len(s) * font_size * factor


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


def section_label(x: float, y: float, text: str) -> str:
    return (
        f'<text x="{x:.2f}" y="{y:.2f}" font-family="{FONT_SANS}" font-size="11" '
        f'font-weight="700" letter-spacing="2.2" fill="{TEXT_MUTED}">{xml_escape(text.upper())}</text>'
    )


# ---------------------------------------------------------------------------
# Section: "USED BY ENGINEERS AT" company chips
# ---------------------------------------------------------------------------
def pick_known_companies(top_companies: list[dict], limit: int = MAX_BRAND_CHIPS) -> list[str]:
    """Match KNOWN_BRANDS against live topCompanies names, in brand
    preference order. Skips domain-like "names" (e.g. profile company
    fields that are actually a URL) so we never mislabel a stray link as
    a real company. Never hardcoded - entirely data-driven."""
    domain_like = re.compile(r"https?://|\.[a-z]{2,4}(?:[/\s]|$)", re.IGNORECASE)
    chosen: list[str] = []
    used_names: set[str] = set()
    for brand in KNOWN_BRANDS:
        if len(chosen) >= limit:
            break
        pattern = re.compile(r"\b" + re.escape(brand) + r"\b", re.IGNORECASE)
        for company in top_companies:
            name = str(company.get("name") or "").strip()
            if not name or name in used_names:
                continue
            if domain_like.search(name):
                continue
            if pattern.search(name):
                chosen.append(brand)
                used_names.add(name)
                break
    return chosen


def build_companies_section(x: float, y: float, w: float, stats: dict) -> tuple[list[str], float]:
    """Returns (svg_parts, height_used). Renders nothing (height 0) if there
    is no usable company data at all."""
    top_companies = stats.get("topCompanies") or []
    companies_total = int(stats.get("companiesRepresented") or 0)
    brand_names = pick_known_companies(top_companies)
    remaining = round_down_remaining(companies_total - len(brand_names))

    chips: list[tuple[str, str]] = [(name, "brand") for name in brand_names]
    if remaining > 0:
        chips.append((f"{remaining}+ more companies", "more"))

    if not chips:
        return [], 0.0

    parts: list[str] = []
    label_baseline = y + 11
    parts.append(section_label(x, label_baseline, "Used by engineers at"))

    chip_h = 30.0
    gap = 10.0
    row_gap = 10.0
    pad_x = 15.0

    def chip_dims(label: str) -> float:
        return text_width(label, 12.5) + 2 * pad_x

    rows: list[list[tuple[str, str, float]]] = [[]]
    row_w = 0.0
    for label, kind in chips:
        cw = chip_dims(label)
        add = cw if not rows[-1] else cw + gap
        if rows[-1] and row_w + add > w:
            rows.append([])
            row_w = 0.0
            add = cw
        rows[-1].append((label, kind, cw))
        row_w += add

    row_top = label_baseline + 20
    for row in rows:
        row_total_w = sum(c[2] for c in row) + gap * (len(row) - 1)
        cx = x + (w - row_total_w) / 2.0
        for label, kind, cw in row:
            muted = kind == "more"
            fill = "rgba(255,255,255,0.03)" if muted else "rgba(129,140,248,0.08)"
            stroke = "rgba(255,255,255,0.10)" if muted else "rgba(129,140,248,0.24)"
            text_fill = TEXT_MUTED if muted else ACCENT_SOFT
            dash = ' stroke-dasharray="3,3"' if muted else ""
            parts.append(
                f'<rect x="{cx:.2f}" y="{row_top:.2f}" width="{cw:.2f}" height="{chip_h:.2f}" '
                f'rx="15" ry="15" fill="{fill}" stroke="{stroke}" stroke-width="1"{dash}/>'
            )
            if not muted:
                dot_cx = cx + pad_x - 8
                parts.append(f'<circle cx="{dot_cx:.2f}" cy="{row_top + chip_h / 2:.2f}" r="2.4" fill="{ACCENT_BRIGHT}"/>')
                text_x = cx + pad_x + 2
            else:
                text_x = cx + cw / 2
            anchor = "start" if not muted else "middle"
            parts.append(
                f'<text x="{text_x:.2f}" y="{row_top + chip_h / 2 + 4.2:.2f}" text-anchor="{anchor}" '
                f'font-family="{FONT_SANS}" font-size="12.5" font-weight="600" '
                f'fill="{text_fill}">{xml_escape(label)}</text>'
            )
            cx += cw + gap
        row_top += chip_h + row_gap

    height_used = (row_top - row_gap) - y
    return parts, height_used


# ---------------------------------------------------------------------------
# Section: "STARS OVER TIME" cumulative area chart
# ---------------------------------------------------------------------------
def smooth_path(xs: list[float], ys: list[float]) -> str:
    """Cubic-bezier smoothing with per-segment clamping so the curve never
    dips below (or rises above) the two data points bounding each segment -
    safe for a monotone, always-increasing series."""
    n = len(xs)
    d = [f"M{xs[0]:.2f},{ys[0]:.2f}"]
    if n == 2:
        d.append(f"L{xs[1]:.2f},{ys[1]:.2f}")
        return " ".join(d)
    for i in range(n - 1):
        x0, y0 = xs[i], ys[i]
        x1, y1 = xs[i + 1], ys[i + 1]
        y_prev = ys[i - 1] if i > 0 else y0
        y_next = ys[i + 2] if i < n - 2 else y1
        dx = x1 - x0
        cx0 = x0 + dx / 3
        cx1 = x1 - dx / 3
        cy0 = y0 + (y1 - y_prev) / 6
        cy1 = y1 - (y_next - y0) / 6
        lo, hi = min(y0, y1), max(y0, y1)
        cy0 = min(max(cy0, lo), hi)
        cy1 = min(max(cy1, lo), hi)
        d.append(f"C{cx0:.2f},{cy0:.2f} {cx1:.2f},{cy1:.2f} {x1:.2f},{y1:.2f}")
    return " ".join(d)


def build_chart_section(x: float, y: float, w: float, star_history: list[dict], grad_id: str) -> tuple[list[str], list[str], float]:
    """Returns (defs_parts, body_parts, height_used). Body parts are empty
    and height_used is 0 if there is not enough history to draw a chart.
    The endpoint marker/label always reflect the series' own last point, so
    they never visually contradict where the line actually ends - even if
    the separately-refreshed live "stars" count has since drifted a little."""
    points = [
        (str(p.get("month") or ""), int(p.get("total") or 0))
        for p in (star_history or [])
        if isinstance(p, dict)
    ]
    if len(points) < 2:
        return [], [], 0.0

    label_baseline = y + 11
    chart_top = label_baseline + 20
    chart_h = 148.0
    pad_top, pad_bottom = 22.0, 20.0
    plot_top = chart_top + pad_top
    plot_h = chart_h - pad_top - pad_bottom
    plot_left = x + 4
    plot_w = w - 8

    months = [p[0] for p in points]
    values = [p[1] for p in points]
    current_total = values[-1]
    vmax = max(max(values), 1) * 1.14
    n = len(points)

    xs = [plot_left + (i / (n - 1)) * plot_w for i in range(n)]
    ys = [plot_top + (1 - values[i] / vmax) * plot_h for i in range(n)]
    baseline_y = plot_top + plot_h

    defs: list[str] = [
        f'<linearGradient id="{grad_id}" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0%" stop-color="{ACCENT}" stop-opacity="0.32"/>'
        f'<stop offset="100%" stop-color="{ACCENT}" stop-opacity="0"/>'
        "</linearGradient>"
    ]

    body: list[str] = [section_label(x, label_baseline, "Stars over time")]

    # minimal gridlines: baseline + midline, no axis labels
    mid_y = plot_top + plot_h / 2
    for gy in (plot_top, mid_y, baseline_y):
        body.append(
            f'<line x1="{plot_left:.2f}" y1="{gy:.2f}" x2="{plot_left + plot_w:.2f}" y2="{gy:.2f}" '
            f'stroke="rgba(255,255,255,0.06)" stroke-width="1"/>'
        )

    line_d = smooth_path(xs, ys)
    area_d = f"{line_d} L{xs[-1]:.2f},{baseline_y:.2f} L{xs[0]:.2f},{baseline_y:.2f} Z"

    body.append(f'<path d="{area_d}" fill="url(#{grad_id})" stroke="none"/>')
    body.append(f'<path d="{line_d}" fill="none" stroke="{ACCENT_BRIGHT}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>')

    # gold star marker + current total at the endpoint
    ex, ey = xs[-1], ys[-1]
    body.append(f'<circle cx="{ex:.2f}" cy="{ey:.2f}" r="9" fill="{AMBER}" opacity="0.14"/>')
    pts = star_polygon(ex, ey, outer_r=6, inner_r=2.6)
    body.append(f'<polygon points="{pts}" fill="{AMBER}"/>')

    total_label = format_number(current_total)
    label_y = max(ey - 14, chart_top + 8)
    body.append(
        f'<text x="{ex:.2f}" y="{label_y:.2f}" text-anchor="end" font-family="{FONT_SANS}" '
        f'font-size="13" font-weight="700" fill="{TEXT_PRIMARY}">{xml_escape(total_label)} stars</text>'
    )

    # tiny first/last month labels under the plot
    tick_y = baseline_y + 15
    body.append(
        f'<text x="{xs[0]:.2f}" y="{tick_y:.2f}" text-anchor="start" font-family="{FONT_SANS}" '
        f'font-size="10" font-weight="500" fill="{TEXT_MUTED}">{xml_escape(month_label(months[0]))}</text>'
    )
    body.append(
        f'<text x="{xs[-1]:.2f}" y="{tick_y:.2f}" text-anchor="end" font-family="{FONT_SANS}" '
        f'font-size="10" font-weight="500" fill="{TEXT_MUTED}">{xml_escape(month_label(months[-1]))}</text>'
    )

    height_used = (tick_y + 4) - y
    return defs, body, height_used


def build_svg(stats: dict) -> str:
    stars = int(stats.get("stars") or 0)
    forks = stats.get("forks", 0) or 0
    contributors = stats.get("contributors", 0) or 0
    companies = stats.get("companiesRepresented", 0) or 0
    universities = stats.get("universities", 0) or 0
    countries = stats.get("countries", 0) or 0
    version = str(stats.get("latestVersion") or "").strip()
    star_history = stats.get("starHistory") or []

    tiles = [
        ("STARS", format_number(stars), True),
        ("FORKS", format_number(forks), False),
        ("CONTRIBUTORS", format_number(contributors), False),
        ("COMPANIES+", format_number(companies), False),
        ("UNIVERSITIES+", format_number(universities), False),
        ("COUNTRIES+", format_number(countries), False),
    ]

    content_w = CARD_W - 2 * PAD_X

    # --- vertical rhythm, computed top to bottom -------------------------
    cursor = 28.0

    # header
    icon_x, icon_y, icon_s = PAD_X, cursor, 32.0
    title_x = icon_x + icon_s + 14
    title_baseline = icon_y + 25
    tagline_baseline = title_baseline + 18
    cursor = icon_y + icon_s + 26  # gap after header before next section

    # companies section (measured against a scratch cursor first so we know
    # the height before emitting, since chip wrapping depends on content)
    companies_parts, companies_h = build_companies_section(PAD_X, cursor, content_w, stats)
    if companies_h > 0:
        cursor += companies_h + 30

    # star chart section
    chart_defs, chart_parts, chart_h = build_chart_section(PAD_X, cursor, content_w, star_history, "starAreaGrad")
    if chart_h > 0:
        cursor += chart_h + 30

    # compact tiles row (single row, lighter weight than the old 2x3 grid)
    tiles_top = cursor
    cols = len(tiles)
    tile_gap = 12.0
    tile_w = (content_w - (cols - 1) * tile_gap) / cols
    tile_h = 82.0
    cursor = tiles_top + tile_h + 30

    # footer
    divider_y = cursor
    footer_y = divider_y + 30
    cursor = footer_y + 20

    card_h = math.ceil(cursor)

    # --- emit --------------------------------------------------------------
    parts: list[str] = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{CARD_W}" height="{card_h}" '
        f'viewBox="0 0 {CARD_W} {card_h}" role="img" aria-label="psmux project statistics">'
    )
    parts.append("<title>psmux stats</title>")

    parts.append("<defs>")
    parts.append(
        f'<clipPath id="cardClip"><rect x="0" y="0" width="{CARD_W}" height="{card_h}" '
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
    parts.extend(chart_defs)
    parts.append("</defs>")

    parts.append('<g clip-path="url(#cardClip)">')
    parts.append(f'<rect x="0" y="0" width="{CARD_W}" height="{card_h}" fill="url(#bgGrad)"/>')
    parts.append(f'<rect x="0" y="0" width="{CARD_W}" height="{card_h}" fill="url(#glowGrad)"/>')

    # --- header: icon mark + wordmark + tagline ----------------------------
    parts.append(
        f'<rect x="{icon_x}" y="{icon_y}" width="{icon_s}" height="{icon_s}" rx="8" ry="8" '
        f'fill="rgba(129,140,248,0.10)" stroke="rgba(129,140,248,0.35)" stroke-width="1"/>'
    )
    parts.append(
        f'<text x="{icon_x + icon_s / 2}" y="{icon_y + icon_s / 2 + 5}" text-anchor="middle" '
        f'font-family="{FONT_MONO}" font-size="14" font-weight="700" fill="{ACCENT_BRIGHT}">&gt;_</text>'
    )
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

    # --- companies section ---------------------------------------------------
    parts.extend(companies_parts)

    # --- star chart section ---------------------------------------------------
    parts.extend(chart_parts)

    # --- compact stat tiles ----------------------------------------------------
    for idx, (label, value, show_star) in enumerate(tiles):
        tx = PAD_X + idx * (tile_w + tile_gap)
        ty = tiles_top
        cx = tx + tile_w / 2

        parts.append(
            f'<rect x="{tx:.2f}" y="{ty:.2f}" width="{tile_w:.2f}" height="{tile_h:.2f}" rx="12" ry="12" '
            f'fill="{TILE_FILL}" stroke="{TILE_BORDER}" stroke-width="1"/>'
        )

        if show_star:
            star_cx = tx + tile_w - 14
            star_cy = ty + 14
            pts = star_polygon(star_cx, star_cy, outer_r=5.5, inner_r=2.3)
            parts.append(f'<polygon points="{pts}" fill="{AMBER}" opacity="0.5"/>')

        value_esc = xml_escape(value)
        parts.append(
            f'<text x="{cx:.2f}" y="{ty + 38:.2f}" text-anchor="middle" font-family="{FONT_SANS}" '
            f'font-size="24" font-weight="700" letter-spacing="-0.4" '
            f'font-variant-numeric="tabular-nums" fill="url(#numGrad)">{value_esc}</text>'
        )

        label_esc = xml_escape(label)
        parts.append(
            f'<text x="{cx:.2f}" y="{ty + 60:.2f}" text-anchor="middle" font-family="{FONT_SANS}" '
            f'font-size="9.5" font-weight="600" letter-spacing="0.9" fill="{TEXT_SECONDARY}">{label_esc}</text>'
        )

    # --- footer: divider + heart accent + muted note ------------------------
    parts.append(
        f'<line x1="{PAD_X}" y1="{divider_y:.2f}" x2="{CARD_W - PAD_X}" y2="{divider_y:.2f}" '
        f'stroke="rgba(129,140,248,0.15)" stroke-width="1"/>'
    )

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
        f'<rect x="0.5" y="0.5" width="{CARD_W - 1}" height="{card_h - 1}" rx="{RADIUS - 0.5}" '
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
