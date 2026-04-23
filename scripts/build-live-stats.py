#!/usr/bin/env python3
"""Build psmux-dash/public/live-stats.json from raw GitHub data dumps.

Inputs (env or args - all paths relative to repo root):
  --repo-json        repos/psmux/psmux JSON
  --contributors     contributors paginated JSON array
  --stargazers       full stargazer dump (login, company, name, bio, followers, avatarUrl)
  --ecosystem        gh search repos --json output (psmux ecosystem)
  --issue-mentions   gh search issues --json output (cross-repo issue mentions)
  --code-mentions    gh search code --json output (dotfiles & similar)
  --psmux-src        path to checked out psmux/psmux source tree (optional)
  --out              output path

All extractions are best-effort. If a section is empty/fails, it's omitted so
the frontend falls back to the seeded data.ts values.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from datetime import datetime, timezone

EDU_PATTERN = re.compile(
    r"\.edu(\b|/)|\.ac\.[a-z]{2}|university|universit[ae]|institut|college|polytechnic|kaist|ETH(\b|\s|$)|MIT(\b|\s|$)",
    re.IGNORECASE,
)

# Map common company-field strings to canonical (name, domain) for university logos.
UNI_DOMAIN_HINTS = [
    (re.compile(r"peking|\bpku\b", re.I), ("Peking University", "pku.edu.cn")),
    (re.compile(r"zhejiang|\bzju\b", re.I), ("Zhejiang University", "zju.edu.cn")),
    (re.compile(r"kaist", re.I), ("KAIST", "kaist.ac.kr")),
    (re.compile(r"yonsei", re.I), ("Yonsei University", "yonsei.ac.kr")),
    (re.compile(r"tu\s*graz|graz.+technolog", re.I), ("TU Graz", "tugraz.at")),
    (re.compile(r"ohio state|osu\b", re.I), ("Ohio State University", "osu.edu")),
    (re.compile(r"texas a&?m|tamu", re.I), ("Texas A&M", "tamu.edu")),
    (re.compile(r"sun yat-?sen|sysu", re.I), ("Sun Yat-sen University", "sysu.edu.cn")),
    (re.compile(r"tongji", re.I), ("Tongji University", "tongji.edu.cn")),
    (re.compile(r"warsaw.+technolog|politechnika warszawska", re.I), ("Warsaw University of Technology", "pw.edu.pl")),
    (re.compile(r"hong kong polytechnic|polyu", re.I), ("Hong Kong Polytechnic", "polyu.edu.hk")),
    (re.compile(r"chinese academy of sciences|\bcas\b", re.I), ("Chinese Academy of Sciences", "cas.cn")),
    (re.compile(r"kyung hee", re.I), ("Kyung Hee University", "khu.ac.kr")),
    (re.compile(r"beijing jiaotong|bjtu", re.I), ("Beijing Jiaotong University", "bjtu.edu.cn")),
    (re.compile(r"wuhan university|whu", re.I), ("Wuhan University", "whu.edu.cn")),
    (re.compile(r"sichuan university|scu", re.I), ("Sichuan University", "scu.edu.cn")),
    (re.compile(r"harbin engineering|hrbeu", re.I), ("Harbin Engineering University", "hrbeu.edu.cn")),
    (re.compile(r"tsinghua", re.I), ("Tsinghua University", "tsinghua.edu.cn")),
    (re.compile(r"\bmit\b|massachusetts institute", re.I), ("MIT", "mit.edu")),
    (re.compile(r"\beth\b|eth z", re.I), ("ETH Zurich", "ethz.ch")),
    (re.compile(r"stanford", re.I), ("Stanford University", "stanford.edu")),
    (re.compile(r"berkeley|ucb\b", re.I), ("UC Berkeley", "berkeley.edu")),
    (re.compile(r"carnegie mellon|cmu", re.I), ("Carnegie Mellon", "cmu.edu")),
    (re.compile(r"oxford", re.I), ("University of Oxford", "ox.ac.uk")),
    (re.compile(r"cambridge", re.I), ("University of Cambridge", "cam.ac.uk")),
]

# Logo hints for common companies (used as visual size weight, optional)
COMPANY_LOGO_SLUGS = {
    "microsoft", "google", "ibm", "meta", "alibaba", "tencent", "sony",
    "broadcom", "siemens", "visa", "unity", "foxconn", "bilibili",
    "worldline", "fraunhofer", "nttdata", "nexon", "nhn", "agoda",
    "seegene", "accelleron", "experian", "cricut", "bsh", "cit", "fiverr",
    "amazon", "apple", "netflix", "uber", "airbnb", "stripe", "github",
    "gitlab", "atlassian", "vmware", "redhat", "oracle", "samsung",
    "huawei", "xiaomi", "bytedance", "didi", "jd", "baidu", "kakao",
    "naver", "line", "rakuten", "softbank", "fujitsu", "nec", "hitachi",
    "toyota", "honda", "intel", "amd", "nvidia", "qualcomm", "cisco",
    "dell", "hp", "lenovo", "asus", "salesforce", "adobe", "sap",
    "spotify", "twitch", "reddit", "discord", "shopify", "square",
    "paypal", "ebay", "etsy", "twitter", "linkedin",
}

def slugify_company(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "", name.lower())
    return s

def normalize_company(raw: str) -> str:
    s = raw.strip()
    if s.startswith("@"):
        s = s[1:].strip()
    # Drop obvious junk
    if not s or s.lower() in {"none", "n/a", "null", "-", "--"}:
        return ""
    return s

def extract_university(company: str) -> tuple[str, str] | None:
    if not EDU_PATTERN.search(company):
        return None
    for pattern, mapping in UNI_DOMAIN_HINTS:
        if pattern.search(company):
            return mapping
    # Try to infer domain from URL-like substring
    m = re.search(r"([a-z0-9-]+\.(?:edu|ac\.[a-z]{2}|edu\.[a-z]{2}))", company, re.I)
    if m:
        domain = m.group(1).lower()
        # Build a name from the domain root
        root = domain.split(".")[0]
        name = root.upper() if len(root) <= 4 else root.title()
        return (name, domain)
    # Last resort: keep the whole string as the name, no logo domain
    return (company.strip(), "")

def categorize_repo(name: str, owner: str, description: str) -> str:
    if owner.lower() == "psmux":
        return "official"
    text = f"{name} {description or ''}".lower()
    if "claude" in text or "agent" in text:
        return "claude-code"
    return "tool"

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--repo-json", required=True)
    p.add_argument("--contributors", required=True)
    p.add_argument("--stargazers", required=True)
    p.add_argument("--ecosystem", required=True)
    p.add_argument("--issue-mentions", required=True)
    p.add_argument("--code-mentions", required=True)
    p.add_argument("--psmux-src", default="")
    p.add_argument("--fork-count", default="")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    repo = json.loads(Path(args.repo_json).read_text())
    contributors = json.loads(Path(args.contributors).read_text())
    stargazers = json.loads(Path(args.stargazers).read_text())
    ecosystem = json.loads(Path(args.ecosystem).read_text())
    issues_raw = json.loads(Path(args.issue_mentions).read_text())
    code_raw = json.loads(Path(args.code_mentions).read_text())

    out: dict = {}

    out["stars"] = repo.get("stargazers_count", 0)
    out["forks"] = int(args.fork_count) if args.fork_count else repo.get("forks_count", 0)
    out["contributors"] = len(contributors)
    out["issues"] = repo.get("open_issues_count", 0)

    # ---- Companies ----
    company_strings: list[str] = []
    for sg in stargazers:
        c = normalize_company(sg.get("company") or "")
        if c:
            company_strings.append(c)

    out["companiesRepresented"] = len({c.lower() for c in company_strings})

    # Top companies by frequency, with optional logo slug
    counts = Counter(company_strings).most_common(60)
    top_companies = []
    for name, count in counts:
        slug = slugify_company(name)
        entry = {"name": name, "count": count}
        if slug in COMPANY_LOGO_SLUGS:
            entry["logo"] = slug
            # Simple Icons CDN: https://simpleicons.org/ — white-tinted SVG matches dark theme.
            entry["logoUrl"] = f"https://cdn.simpleicons.org/{slug}/ffffff"
        top_companies.append(entry)
    out["topCompanies"] = top_companies

    # ---- Universities ----
    seen_unis: dict[str, dict] = {}
    for c in company_strings:
        uni = extract_university(c)
        if not uni:
            continue
        name, domain = uni
        key = (domain or name).lower()
        if key not in seen_unis:
            entry = {"name": name}
            if domain:
                entry["domain"] = domain
            seen_unis[key] = entry
    out["universities"] = len(seen_unis)
    out["topUniversities"] = list(seen_unis.values())

    # ---- Notable users (top stargazers by followers) ----
    notable_pool = [
        sg for sg in stargazers
        if sg.get("followers", 0) >= 200 and sg.get("login")
    ]
    notable_pool.sort(key=lambda s: s.get("followers", 0), reverse=True)
    notable = []
    for sg in notable_pool[:18]:
        followers = sg.get("followers", 0)
        notable.append({
            "login": sg.get("login"),
            "name": sg.get("name") or sg.get("login"),
            "followers": followers,
            "title": (sg.get("bio") or "").strip().split("\n")[0][:120] or "GitHub Developer",
            "company": normalize_company(sg.get("company") or ""),
            "highlight": False,
        })
    # Mark top 2 highlighted
    for i in range(min(2, len(notable))):
        notable[i]["highlight"] = True
    out["notableUsers"] = notable

    # ---- Ecosystem repos ----
    eco = []
    for r in ecosystem:
        full = r.get("fullName") or r.get("nameWithOwner") or ""
        if "/" not in full:
            continue
        owner, name = full.split("/", 1)
        if owner.lower() == "psmux" and name.lower() == "psmux":
            continue  # exclude main repo
        if "psmux" not in (name.lower() + " " + (r.get("description") or "").lower()):
            continue
        eco.append({
            "name": name,
            "author": owner,
            "stars": r.get("stargazersCount", r.get("stargazers_count", 0)),
            "description": (r.get("description") or "").strip() or "psmux-related project",
            "category": categorize_repo(name, owner, r.get("description") or ""),
        })
    eco.sort(key=lambda e: (-(e["category"] == "official"), -e["stars"], e["name"].lower()))
    out["ecosystemRepos"] = len(eco)
    out["ecosystemProjects"] = eco[:30]

    # ---- Cross-repo issue mentions ----
    by_repo: dict[str, dict] = {}
    for it in issues_raw:
        repo_full = ""
        if isinstance(it.get("repository"), dict):
            repo_full = it["repository"].get("nameWithOwner") or it["repository"].get("fullName") or ""
        elif it.get("repositoryUrl"):
            repo_full = it["repositoryUrl"].replace("https://api.github.com/repos/", "")
        repo_full = repo_full or it.get("html_url", "")
        if not repo_full or "/" not in repo_full:
            continue
        # Filter: repo must not be psmux's own
        if repo_full.lower().startswith("psmux/"):
            continue
        number = it.get("number")
        if not number:
            continue
        title = it.get("title", "")
        entry = by_repo.setdefault(repo_full, {"repo": repo_full, "issues": [], "context": title})
        tag = f"#{number}"
        if tag not in entry["issues"]:
            entry["issues"].append(tag)
        # Prefer the title that mentions psmux explicitly
        if "psmux" in title.lower() and "psmux" not in entry["context"].lower():
            entry["context"] = title
    mentions = list(by_repo.values())
    mentions.sort(key=lambda m: -len(m["issues"]))
    # Keep repos with at least one issue, cap at 12 for UI
    out["crossRepoMentions"] = mentions[:12]

    # ---- Dotfiles repos (from code search) ----
    df_seen: dict[str, dict] = {}
    for hit in code_raw:
        repo_full = ""
        if isinstance(hit.get("repository"), dict):
            repo_full = hit["repository"].get("nameWithOwner") or hit["repository"].get("fullName") or ""
        if not repo_full or "/" not in repo_full:
            continue
        if repo_full.lower().startswith("psmux/"):
            continue
        path = hit.get("path", "")
        # Heuristic: looks like a dotfiles/setup file
        lower = path.lower()
        if not any(k in lower for k in ("dotfile", ".tmux.conf", "psmux.conf", "install", "setup", "scoop", "winget", ".ps1", "profile", "agents.md", "claude.md")):
            # Still consider if repo name screams dotfiles
            if "dotfile" not in repo_full.lower() and "config" not in repo_full.lower():
                continue
        if repo_full not in df_seen:
            df_seen[repo_full] = {"repo": repo_full, "detail": path.split("/")[-1] or path}
    dotfiles = list(df_seen.values())[:24]
    out["dotfilesRepos"] = dotfiles
    out["dotfilesReferences"] = len(dotfiles)

    # ---- Source-derived counts (best effort) ----
    if args.psmux_src:
        src_root = Path(args.psmux_src)
        if src_root.exists():
            try:
                # Count cmd-*.rs files as a proxy for commands
                cmd_files = list(src_root.glob("src/cmd-*.rs")) + list(src_root.glob("src/cmd/*.rs"))
                if cmd_files:
                    out["commands"] = len(cmd_files)
            except Exception:
                pass
            try:
                fmt_text = ""
                for p_ in src_root.glob("src/format*.rs"):
                    fmt_text += p_.read_text(errors="ignore")
                if fmt_text:
                    fmt_count = len(re.findall(r'"#\{[a-z_]+\}"|"\{[a-z_]+\}"', fmt_text))
                    if fmt_count > 20:
                        out["formatVariables"] = fmt_count
            except Exception:
                pass

    out["lastUpdated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    Path(args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"Wrote {args.out}")
    print(f"  stars={out['stars']} forks={out['forks']} contribs={out['contributors']}")
    print(f"  companies={out['companiesRepresented']} top={len(top_companies)}")
    print(f"  universities={out['universities']} listed={len(seen_unis)}")
    print(f"  notableUsers={len(notable)}")
    print(f"  ecosystem={len(eco)} mentions={len(mentions)} dotfiles={len(dotfiles)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
