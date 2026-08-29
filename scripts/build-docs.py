#!/usr/bin/env python3
"""Bundle the psmux/psmux docs folder into site assets.

Reads docs/**/*.md from a psmux source checkout (the docs/README.md index is
skipped, the site has its own) and generates:
  public/docs.json      one JSON bundle the /docs page renders from
  public/sitemap.xml    homepage plus every doc URL
  public/llms.txt       llmstxt.org index with a generated docs section
  public/llms-full.txt  full documentation inlined for AI consumption

Best effort: if the docs folder is missing (source checkout failed), the
script exits 0 without touching any existing files so the site keeps
serving the previously committed bundle.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

SITE = "https://psmux.pages.dev"
REPO_DOCS = "https://github.com/psmux/psmux/blob/master/docs"

# Sidebar grouping; docs not listed here land in "More Guides". A slug is the
# path under docs/ without the .md suffix, so a page in a subfolder is
# "tutorials/getting-started-windows" and its URL is /docs/tutorials/... .
GROUPS = [
    ("Getting Started", ["tutorials/getting-started-windows", "faq", "features", "use-cases"]),
    ("Tutorials", [
        "tutorials/cross-platform-tmux-scripts",
        "tutorials/terminal-agents-and-tuis",
        "tutorials/dev-environment-layouts",
    ]),
    ("Configuration", ["configuration", "keybindings", "plugins", "pane-titles"]),
    ("Compatibility", ["compatibility", "tmux_args_reference", "multi-shell", "mouse-ssh"]),
    ("How It Works", ["architecture", "performance", "warm-sessions"]),
    ("Advanced", ["scripting", "control-mode", "iterm2-control-mode", "preview", "diagnostics"]),
    ("Integrations", ["claude-code", "integration"]),
]

# Files under docs/ that are not pages: the repo's own index duplicates the
# sidebar and its links point at GitHub paths.
SKIP = {"README.md"}

def group_for(slug: str) -> str:
    for title, slugs in GROUPS:
        if slug in slugs:
            return title
    return "More Guides"

# Hand written summaries for pages whose opening is not prose (a list, a
# table, a Q and A). Used only when the intro window below yields nothing.
DESCRIPTIONS = {
    "faq": "Answers to the questions people ask most about psmux, the native tmux for Windows: platforms, Windows Terminal, .tmux.conf, mouse and wheel behaviour, keys, colours and paths.",
    "features": "The complete psmux feature list: sessions that outlive the window, panes and windows, mouse, vim style copy mode, themes and plugins, 90+ tmux compatible commands and 140+ format variables.",
    "keybindings": "Every default psmux key binding, the copy mode key table, key tables and how to rebind keys with bind-key in your config.",
    "configuration": "Where psmux reads its config, every option it accepts, and the PSMUX environment variables that change how the server and client behave.",
    "scripting": "Driving psmux from scripts: commands, targets, hooks, paste buffers, pipe-pane, wait-for and the format variables.",
}

def _clean(block: str) -> str:
    text = block.strip()
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[*_]{1,2}([^*_]+)[*_]{1,2}", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()

def _is_prose(text: str, raw: str) -> bool:
    if not text or len(text) < 60:
        return False
    if raw.lstrip().startswith(("#", "|", "```", ">", "<", "-", "*", "+", "!")):
        return False
    if re.match(r"^\d+\.\s", raw.lstrip()):
        return False
    # A line that introduces a list or a code block is not a summary.
    if text.endswith(":"):
        return False
    return True

def _trim(text: str) -> str:
    return text[:157].rstrip() + "..." if len(text) > 160 else text

def first_paragraph(md: str, slug: str = "") -> str:
    """The page summary: the first real paragraph between the H1 and the first
    H2 or H3. A page that opens with a list or a Q and A has no such paragraph;
    then DESCRIPTIONS decides, and only as a last resort does the whole page get
    scanned, which is how the FAQ once got summarised by an answer from its
    middle."""
    intro = re.split(r"\n#{2,3}\s", md, maxsplit=1)[0]
    intro = re.sub(r"^#\s.*$", "", intro, count=1, flags=re.M)
    blocks = [b for b in re.split(r"\n\s*\n", intro) if b.strip()]
    for block in blocks:
        # Skip fenced code entirely, whatever it contains.
        if block.lstrip().startswith("```"):
            continue
        text = _clean(block)
        if _is_prose(text, block):
            return _trim(text)
    if slug in DESCRIPTIONS:
        return DESCRIPTIONS[slug]
    for block in re.split(r"\n\s*\n", md):
        text = _clean(block)
        if _is_prose(text, block):
            return _trim(text)
    return ""

def extract_headings(md: str) -> list[dict]:
    headings = []
    in_code = False
    for line in md.splitlines():
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = re.match(r"^(#{2,3})\s+(.+?)\s*#*\s*$", line)
        if m:
            headings.append({"depth": len(m.group(1)), "text": m.group(2).strip()})
    return headings

def doc_title(md: str, slug: str) -> str:
    m = re.search(r"^#\s+(.+?)\s*$", md, re.M)
    return m.group(1).strip() if m else slug.replace("-", " ").replace("_", " ").title()

def build_llms_txt(docs: list[dict]) -> str:
    lines = [
        "# psmux",
        "",
        "> psmux is a native terminal multiplexer for Windows 10 and 11, built in Rust. It is a tmux alternative with full command, keybinding, and .tmux.conf compatibility that requires no WSL, Cygwin, or MSYS2. It works with Windows Terminal, PowerShell, and cmd.exe.",
        "",
        "Key facts:",
        "",
        "* Single native Windows binary with zero dependencies",
        "* 90+ tmux compatible commands and 140+ format variables (run `psmux list-commands` for the live list)",
        "* Vim style copy mode with 53 keybindings, full mouse support",
        "* Reads your existing .tmux.conf so tmux muscle memory carries over",
        "* Installable via winget, Scoop, Chocolatey, Cargo, or a PowerShell one liner",
        "* Used by engineers at Microsoft, Google, IBM, Tencent, Sony, and 500+ companies",
        "* Recommended multiplexer for Claude Code Agent Teams on Windows",
        "* MIT licensed, open source",
        "",
        "## Install",
        "",
        "* winget: `winget install psmux`",
        "* Scoop: `scoop install psmux`",
        "* Chocolatey: `choco install psmux`",
        "* Cargo: `cargo install psmux`",
        "* PowerShell: `irm https://raw.githubusercontent.com/psmux/psmux/master/scripts/install.ps1 | iex`",
        "",
        "## Documentation",
        "",
    ]
    current_group = None
    for d in docs:
        if d["group"] != current_group:
            current_group = d["group"]
            lines += ([] if lines[-1] == "" else [""]) + [f"### {current_group}", ""]
        desc = d["description"] or f"psmux {d['title']} guide"
        lines.append(f"* [{d['title']}]({SITE}/docs/{d['slug']}): {desc}")
    lines += [
        "",
        f"* [Full documentation in one file]({SITE}/llms-full.txt): every guide inlined as markdown",
        "",
        "## Resources",
        "",
        "* [GitHub repository](https://github.com/psmux/psmux): source code, releases, issues",
        f"* [Live adoption stats]({SITE}/live-stats.json): machine readable JSON with stars, contributors, companies, and ecosystem data, refreshed twice weekly",
        "* [crates.io package](https://crates.io/crates/psmux): Rust crate",
        "* [Chocolatey package](https://community.chocolatey.org/packages/psmux): Windows package manager listing",
        "",
        "## Usage",
        "",
        "* Start a session: `psmux new-session -s work`",
        "* List sessions: `psmux ls`",
        "* Attach: `psmux attach -t work`",
        "* Default prefix is Ctrl+b, identical to tmux",
        "* The binaries psmux, pmux, and tmux are aliases of the same executable",
        "",
    ]
    return "\n".join(lines)

def build_sitemap(docs: list[dict], lastmod: str) -> str:
    urls = [f"{SITE}/", f"{SITE}/docs"] + [f"{SITE}/docs/{d['slug']}" for d in docs]
    body = "\n".join(
        f"  <url>\n    <loc>{u}</loc>\n    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>weekly</changefreq>\n    <priority>{'1.0' if u.endswith('.dev/') else '0.8'}</priority>\n  </url>"
        for u in urls
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{body}\n</urlset>\n"
    )

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--docs", required=True, help="path to psmux/psmux docs folder")
    p.add_argument("--public", default="public", help="site public folder")
    args = p.parse_args()

    docs_dir = Path(args.docs)
    public = Path(args.public)
    if not docs_dir.is_dir():
        print(f"docs folder {docs_dir} not found; keeping existing bundle")
        return 0

    md_files = sorted(
        f for f in docs_dir.rglob("*.md")
        if f.name not in SKIP and not any(part.startswith(".") for part in f.relative_to(docs_dir).parts)
    )
    if not md_files:
        print("no markdown files found; keeping existing bundle")
        return 0

    docs = []
    for f in md_files:
        md = f.read_text(encoding="utf-8", errors="replace")
        rel = f.relative_to(docs_dir).as_posix()
        slug = rel[:-3]
        docs.append({
            "slug": slug,
            "title": doc_title(md, slug.rsplit("/", 1)[-1]),
            "description": first_paragraph(md, slug),
            "group": group_for(slug),
            "headings": extract_headings(md),
            "markdown": md,
            "sourceUrl": f"{REPO_DOCS}/{rel}",
        })

    # Keep sidebar order stable: grouped docs in GROUPS order, then the rest.
    order = {s: (gi, si) for gi, (_, slugs) in enumerate(GROUPS) for si, s in enumerate(slugs)}
    docs.sort(key=lambda d: order.get(d["slug"], (len(GROUPS), d["slug"])))

    now = datetime.now(timezone.utc)
    bundle = {
        "generated": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "https://github.com/psmux/psmux/tree/master/docs",
        "docs": docs,
    }
    public.mkdir(parents=True, exist_ok=True)
    (public / "docs.json").write_text(
        json.dumps(bundle, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    lastmod = now.strftime("%Y-%m-%d")
    (public / "sitemap.xml").write_text(build_sitemap(docs, lastmod), encoding="utf-8")
    (public / "llms.txt").write_text(build_llms_txt(docs), encoding="utf-8")

    full = ["# psmux documentation", "", f"Generated {lastmod} from {bundle['source']}", ""]
    for d in docs:
        full += [f"<!-- {d['slug']} -->", d["markdown"].strip(), "", "---", ""]
    (public / "llms-full.txt").write_text("\n".join(full), encoding="utf-8")

    print(f"docs.json: {len(docs)} docs, {sum(len(d['markdown']) for d in docs)} chars")
    print(f"sitemap.xml: {2 + len(docs)} urls")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
