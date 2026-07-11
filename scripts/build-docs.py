#!/usr/bin/env python3
"""Bundle the psmux/psmux docs folder into site assets.

Reads docs/*.md from a psmux source checkout and generates:
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

# Sidebar grouping; docs not listed here land in "More Guides".
GROUPS = [
    ("Getting Started", ["faq", "features", "use-cases"]),
    ("Configuration", ["configuration", "keybindings", "plugins", "pane-titles"]),
    ("Compatibility", ["compatibility", "tmux_args_reference", "multi-shell", "mouse-ssh"]),
    ("Advanced", ["scripting", "control-mode", "iterm2-control-mode", "preview", "warm-sessions", "performance"]),
    ("Integrations", ["claude-code", "integration"]),
]

def group_for(slug: str) -> str:
    for title, slugs in GROUPS:
        if slug in slugs:
            return title
    return "More Guides"

def first_paragraph(md: str) -> str:
    for block in re.split(r"\n\s*\n", md):
        text = block.strip()
        if not text or text.startswith(("#", "|", "```", ">", "<", "-", "*")):
            continue
        text = re.sub(r"`([^`]*)`", r"\1", text)
        text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
        text = re.sub(r"[*_]{1,2}([^*_]+)[*_]{1,2}", r"\1", text)
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) > 40:
            return text[:157] + "..." if len(text) > 160 else text
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
        "* 76 tmux compatible commands and 126+ format variables",
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
    for d in docs:
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

    md_files = sorted(docs_dir.glob("*.md"))
    if not md_files:
        print("no markdown files found; keeping existing bundle")
        return 0

    docs = []
    for f in md_files:
        md = f.read_text(encoding="utf-8", errors="replace")
        slug = f.stem
        docs.append({
            "slug": slug,
            "title": doc_title(md, slug),
            "description": first_paragraph(md),
            "group": group_for(slug),
            "headings": extract_headings(md),
            "markdown": md,
            "sourceUrl": f"{REPO_DOCS}/{f.name}",
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
