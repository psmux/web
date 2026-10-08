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
import urllib.request
from collections import Counter
from pathlib import Path
from datetime import datetime, timezone

EDU_PATTERN = re.compile(
    r"\.edu(\b|/)|\.ac\.[a-z]{2}|university|universit[ae]|institut|college|polytechnic|kaist|\bETH\b|\bMIT\b",
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
    (re.compile(r"malone university", re.I), ("Malone University", "malone.edu")),
    (re.compile(r"kapodistrian|university of athens", re.I), ("National and Kapodistrian University of Athens", "uoa.gr")),
    (re.compile(r"universitas indonesia", re.I), ("Universitas Indonesia", "ui.ac.id")),
    (re.compile(r"xi.?an\s+university of technology|\bxaut\b", re.I), ("Xi'an University of Technology", "xaut.edu.cn")),
    (re.compile(r"soongsil", re.I), ("Soongsil University", "soongsil.ac.kr")),
    (re.compile(r"st\.?\s*petersburg college", re.I), ("St. Petersburg College", "spcollege.edu")),
    (re.compile(r"sanno university", re.I), ("Sanno University", "sanno.ac.jp")),
    (re.compile(r"beijing normal|\bbnu\b", re.I), ("Beijing Normal University", "bnu.edu.cn")),
    (re.compile(r"central south university", re.I), ("Central South University", "csu.edu.cn")),
    (re.compile(r"nanchang hangkong|\bnchu\b", re.I), ("Nanchang Hangkong University", "nchu.edu.cn")),
    (re.compile(r"wuhan polytechnic|\bwpu\b", re.I), ("Wuhan Polytechnic University", "wpu.edu.cn")),
    (re.compile(r"huazhong university|\bhust\b", re.I), ("Huazhong University of Science and Technology", "hust.edu.cn")),
    (re.compile(r"western university", re.I), ("Western University", "uwo.ca")),
    (re.compile(r"kangwon", re.I), ("Kangwon National University", "kangwon.ac.kr")),
    (re.compile(r"university of toronto", re.I), ("University of Toronto", "utoronto.ca")),
    (re.compile(r"beihang|\bbuaa\b", re.I), ("Beihang University", "buaa.edu.cn")),
    (re.compile(r"changwon", re.I), ("Changwon National University", "changwon.ac.kr")),
    (re.compile(r"hudson county community college", re.I), ("Hudson County Community College", "hccc.edu")),
    (re.compile(r"xi.?an\s+jiaotong|xian\s+jiaotong|\bxjtu\b", re.I), ("Xi'an Jiaotong University", "xjtu.edu.cn")),
    (re.compile(r"hanyang", re.I), ("Hanyang University", "hanyang.ac.kr")),
    (re.compile(r"university of science and technology of china|\bustc\b", re.I), ("University of Science and Technology of China", "ustc.edu.cn")),
    (re.compile(r"rwth aachen|\brwth\b", re.I), ("RWTH Aachen University", "rwth-aachen.de")),
    (re.compile(r"shanghai jiao\s?tong|\bsjtu\b", re.I), ("Shanghai Jiao Tong University", "sjtu.edu.cn")),
    (re.compile(r"george mason university|\bgmu\b", re.I), ("George Mason University", "gmu.edu")),
    (re.compile(r"regent university", re.I), ("Regent University", "regent.edu")),
    (re.compile(r"jiangsu university|\bujs\b", re.I), ("Jiangsu University", "ujs.edu.cn")),
    (re.compile(r"university of washington", re.I), ("University of Washington", "washington.edu")),
    (re.compile(r"university of illinois", re.I), ("University of Illinois Urbana-Champaign", "illinois.edu")),
    (re.compile(r"northwestern polytechnical|\bnwpu\b", re.I), ("Northwestern Polytechnical University", "nwpu.edu.cn")),
    (re.compile(r"inha university", re.I), ("Inha University", "inha.ac.kr")),
    (re.compile(r"korea aerospace research institute|\bkari\b", re.I), ("Korea Aerospace Research Institute", "kari.re.kr")),
    (re.compile(r"sejong university", re.I), ("Sejong University", "sejong.ac.kr")),
    (re.compile(r"anhui university|\bahu\b", re.I), ("Anhui University", "ahu.edu.cn")),
    (re.compile(r"sungkyunkwan", re.I), ("Sungkyunkwan University", "skku.edu")),
    (re.compile(r"university of information technology.*vnu", re.I), ("University of Information Technology VNU-HCM", "uit.edu.vn")),
    (re.compile(r"university of texas at arlington", re.I), ("University of Texas at Arlington", "uta.edu")),
    (re.compile(r"university of science and technology beijing|\bustb\b", re.I), ("University of Science and Technology Beijing", "ustb.edu.cn")),
    (re.compile(r"harbin institute of technology", re.I), ("Harbin Institute of Technology", "hit.edu.cn")),
    (re.compile(r"jagiellonian", re.I), ("Jagiellonian University", "uj.edu.pl")),
    (re.compile(r"national university of singapore|\bnus\b", re.I), ("National University of Singapore", "nus.edu.sg")),
    (re.compile(r"east china jiaotong|\becjtu\b", re.I), ("East China Jiaotong University", "ecjtu.edu.cn")),
    (re.compile(r"georgia tech research institute|\bgtri\b", re.I), ("Georgia Tech Research Institute", "gtri.gatech.edu")),
    (re.compile(r"saxion", re.I), ("Saxion University of Applied Sciences", "saxion.nl")),
    (re.compile(r"china university of geosciences|\bcug\b", re.I), ("China University of Geosciences", "cug.edu.cn")),
    (re.compile(r"cheng shiu university", re.I), ("Cheng Shiu University", "csu.edu.tw")),
    (re.compile(r"stellenbosch", re.I), ("Stellenbosch University", "sun.ac.za")),
    (re.compile(r"university of warsaw", re.I), ("University of Warsaw", "uw.edu.pl")),
    (re.compile(r"south china university of technology|\bscut\b", re.I), ("South China University of Technology", "scut.edu.cn")),
    (re.compile(r"eastern kentucky university|\beku\b", re.I), ("Eastern Kentucky University", "eku.edu")),
    (re.compile(r"washington university.*louis|\bwustl\b", re.I), ("Washington University in St. Louis", "wustl.edu")),
    (re.compile(r"national taiwan university of science and technology|\bntust\b", re.I), ("National Taiwan University of Science and Technology", "ntust.edu.tw")),
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

# Freeform profile location strings mapped to (city label, lat, lng, country, continent).
# City patterns first, then country level fallbacks.
GAZETTEER = [
    (re.compile(r"seattle|redmond|bellevue", re.I), ("Seattle", 47.6, -122.3, "United States", "North America")),
    (re.compile(r"san francisco|bay area|mountain view|palo alto|sunnyvale|cupertino|san jose", re.I), ("San Francisco Bay Area", 37.4, -122.1, "United States", "North America")),
    (re.compile(r"los angeles|\bla\b.*california|santa monica", re.I), ("Los Angeles", 34.0, -118.2, "United States", "North America")),
    (re.compile(r"new york|nyc|brooklyn", re.I), ("New York", 40.7, -74.0, "United States", "North America")),
    (re.compile(r"denver|boulder", re.I), ("Denver", 39.7, -105.0, "United States", "North America")),
    (re.compile(r"austin|dallas|houston|texas", re.I), ("Texas", 30.6, -96.3, "United States", "North America")),
    (re.compile(r"columbus|ohio", re.I), ("Ohio", 40.0, -83.0, "United States", "North America")),
    (re.compile(r"chicago", re.I), ("Chicago", 41.9, -87.6, "United States", "North America")),
    (re.compile(r"boston|cambridge, ?ma", re.I), ("Boston", 42.4, -71.1, "United States", "North America")),
    (re.compile(r"toronto|ontario", re.I), ("Toronto", 43.7, -79.4, "Canada", "North America")),
    (re.compile(r"vancouver", re.I), ("Vancouver", 49.3, -123.1, "Canada", "North America")),
    (re.compile(r"canada", re.I), ("Canada", 56.1, -106.3, "Canada", "North America")),
    (re.compile(r"usa|united states|\bus\b", re.I), ("United States", 39.8, -98.6, "United States", "North America")),
    (re.compile(r"s[aã]o paulo", re.I), ("Sao Paulo", -23.5, -46.6, "Brazil", "South America")),
    (re.compile(r"rio de janeiro", re.I), ("Rio de Janeiro", -22.9, -43.2, "Brazil", "South America")),
    (re.compile(r"brazil|brasil", re.I), ("Brazil", -14.2, -51.9, "Brazil", "South America")),
    (re.compile(r"argentina|buenos aires", re.I), ("Argentina", -34.6, -58.4, "Argentina", "South America")),
    (re.compile(r"chile|santiago", re.I), ("Chile", -33.4, -70.7, "Chile", "South America")),
    (re.compile(r"colombia|bogot", re.I), ("Colombia", 4.7, -74.1, "Colombia", "South America")),
    (re.compile(r"mexico", re.I), ("Mexico", 19.4, -99.1, "Mexico", "North America")),
    (re.compile(r"london", re.I), ("London", 51.5, -0.1, "United Kingdom", "Europe")),
    (re.compile(r"united kingdom|\buk\b|england|scotland", re.I), ("United Kingdom", 52.4, -1.5, "United Kingdom", "Europe")),
    (re.compile(r"paris", re.I), ("Paris", 48.9, 2.3, "France", "Europe")),
    (re.compile(r"france", re.I), ("France", 46.6, 2.2, "France", "Europe")),
    (re.compile(r"berlin", re.I), ("Berlin", 52.5, 13.4, "Germany", "Europe")),
    (re.compile(r"munich|m[uü]nchen|bavaria|regensburg", re.I), ("Munich area", 48.8, 11.0, "Germany", "Europe")),
    (re.compile(r"hamburg", re.I), ("Hamburg", 53.6, 10.0, "Germany", "Europe")),
    (re.compile(r"germany|deutschland", re.I), ("Germany", 51.2, 10.4, "Germany", "Europe")),
    (re.compile(r"amsterdam|netherlands|holland", re.I), ("Netherlands", 52.4, 4.9, "Netherlands", "Europe")),
    (re.compile(r"copenhagen|denmark", re.I), ("Copenhagen", 55.7, 12.6, "Denmark", "Europe")),
    (re.compile(r"stockholm|sweden", re.I), ("Stockholm", 59.3, 18.1, "Sweden", "Europe")),
    (re.compile(r"oslo|norway", re.I), ("Oslo", 59.9, 10.8, "Norway", "Europe")),
    (re.compile(r"helsinki|finland", re.I), ("Helsinki", 60.2, 24.9, "Finland", "Europe")),
    (re.compile(r"barcelona", re.I), ("Barcelona", 41.4, 2.2, "Spain", "Europe")),
    (re.compile(r"madrid|spain", re.I), ("Madrid", 40.4, -3.7, "Spain", "Europe")),
    (re.compile(r"dublin|ireland", re.I), ("Ireland", 53.3, -6.3, "Ireland", "Europe")),
    (re.compile(r"graz|vienna|austria", re.I), ("Austria", 47.1, 15.4, "Austria", "Europe")),
    (re.compile(r"warsaw|warszawa|poland|krak[oó]w", re.I), ("Warsaw", 52.2, 21.0, "Poland", "Europe")),
    (re.compile(r"athens|greece", re.I), ("Athens", 37.9, 23.7, "Greece", "Europe")),
    (re.compile(r"z[uü]rich|switzerland", re.I), ("Zurich", 47.4, 8.5, "Switzerland", "Europe")),
    (re.compile(r"milan|rome|italy", re.I), ("Italy", 41.9, 12.5, "Italy", "Europe")),
    (re.compile(r"lisbon|portugal", re.I), ("Lisbon", 38.7, -9.1, "Portugal", "Europe")),
    (re.compile(r"prague|czech", re.I), ("Prague", 50.1, 14.4, "Czechia", "Europe")),
    (re.compile(r"kyiv|kiev|ukraine", re.I), ("Kyiv", 50.5, 30.5, "Ukraine", "Europe")),
    (re.compile(r"moscow|russia", re.I), ("Moscow", 55.8, 37.6, "Russia", "Europe")),
    (re.compile(r"istanbul|turkey|t[uü]rkiye", re.I), ("Istanbul", 41.0, 29.0, "Turkey", "Europe")),
    (re.compile(r"cairo|egypt", re.I), ("Cairo", 30.0, 31.2, "Egypt", "Africa")),
    (re.compile(r"lagos|nigeria", re.I), ("Lagos", 6.5, 3.4, "Nigeria", "Africa")),
    (re.compile(r"nairobi|kenya", re.I), ("Nairobi", -1.3, 36.8, "Kenya", "Africa")),
    (re.compile(r"cape town|johannesburg|south africa", re.I), ("South Africa", -26.2, 28.0, "South Africa", "Africa")),
    (re.compile(r"tel aviv|israel", re.I), ("Tel Aviv", 32.1, 34.8, "Israel", "Asia")),
    (re.compile(r"dubai|uae|united arab emirates", re.I), ("Dubai", 25.2, 55.3, "UAE", "Asia")),
    (re.compile(r"bangalore|bengaluru", re.I), ("Bangalore", 13.0, 77.6, "India", "Asia")),
    (re.compile(r"mumbai|delhi|hyderabad|chennai|pune|india", re.I), ("India", 20.6, 79.0, "India", "Asia")),
    (re.compile(r"shanghai", re.I), ("Shanghai", 31.2, 121.5, "China", "Asia")),
    (re.compile(r"beijing", re.I), ("Beijing", 39.9, 116.4, "China", "Asia")),
    (re.compile(r"hangzhou", re.I), ("Hangzhou", 30.3, 120.2, "China", "Asia")),
    (re.compile(r"shenzhen", re.I), ("Shenzhen", 22.5, 114.1, "China", "Asia")),
    (re.compile(r"guangzhou", re.I), ("Guangzhou", 23.1, 113.3, "China", "Asia")),
    (re.compile(r"wuhan", re.I), ("Wuhan", 30.6, 114.3, "China", "Asia")),
    (re.compile(r"chengdu", re.I), ("Chengdu", 30.7, 104.1, "China", "Asia")),
    (re.compile(r"harbin", re.I), ("Harbin", 45.8, 126.5, "China", "Asia")),
    (re.compile(r"china|\bcn\b|\bprc\b", re.I), ("China", 35.9, 104.2, "China", "Asia")),
    (re.compile(r"hong ?kong", re.I), ("Hong Kong", 22.3, 114.2, "Hong Kong", "Asia")),
    (re.compile(r"taipei|taiwan", re.I), ("Taipei", 25.0, 121.6, "Taiwan", "Asia")),
    (re.compile(r"seoul|korea", re.I), ("South Korea", 36.4, 127.0, "South Korea", "Asia")),
    (re.compile(r"tokyo|japan|osaka|kyoto", re.I), ("Tokyo", 35.7, 139.7, "Japan", "Asia")),
    (re.compile(r"singapore", re.I), ("Singapore", 1.4, 103.8, "Singapore", "Asia")),
    (re.compile(r"jakarta|indonesia|surabaya", re.I), ("Indonesia", -6.2, 106.8, "Indonesia", "Asia")),
    (re.compile(r"bangkok|thailand", re.I), ("Bangkok", 13.8, 100.5, "Thailand", "Asia")),
    (re.compile(r"hanoi|ho chi minh|vietnam", re.I), ("Vietnam", 21.0, 105.9, "Vietnam", "Asia")),
    (re.compile(r"manila|philippines", re.I), ("Manila", 14.6, 121.0, "Philippines", "Asia")),
    (re.compile(r"kuala lumpur|malaysia", re.I), ("Kuala Lumpur", 3.1, 101.7, "Malaysia", "Asia")),
    (re.compile(r"sydney|melbourne|australia", re.I), ("Australia", -33.9, 151.2, "Australia", "Oceania")),
    (re.compile(r"auckland|wellington|new zealand", re.I), ("New Zealand", -36.8, 174.8, "New Zealand", "Oceania")),
]

BIG_TECH = {
    "microsoft", "google", "meta", "amazon", "apple", "ibm", "netflix",
    "nvidia", "intel", "amd", "oracle", "samsung", "sony", "tencent",
    "alibaba", "bytedance", "baidu", "adobe", "salesforce",
}

def locate(location: str):
    if not location:
        return None
    for pattern, entry in GAZETTEER:
        if pattern.search(location):
            return entry
    return None

def slugify_company(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "", name.lower())
    return s

# Trailing legal or corporate suffixes stripped when merging name variants,
# e.g. "Microsoft Corporation", "JPMorgan Chase & Co." and "Visa Inc." fold
# into the same canonical key as "Microsoft", "JPMorgan Chase" and "Visa".
# Keep in sync with LEGAL_SUFFIXES in src/hooks/useLiveStats.ts.
LEGAL_SUFFIXES = {
    "inc", "incorporated", "corp", "corporation", "co", "company",
    "ltd", "limited", "llc", "llp", "plc", "gmbh", "ag", "sa", "srl",
    "bv", "ab", "oy", "kk", "group", "holdings", "international", "intl",
}

# Profile "company" strings that are not real organizations (placeholders,
# job titles, self references). Keys are canonical_company_key() output.
# They are excluded from topCompanies/companiesRepresented entirely.
# Keep in sync with GENERIC_COMPANY_KEYS in src/hooks/useLiveStats.ts.
GENERIC_COMPANIES = {
    "freelance", "freelancer", "freelancing", "self", "self employed",
    "selfemployed", "personal", "home", "student", "independent", "indie",
    "none", "n a", "private", "remote", "earth", "internet", "world",
    "open source", "opensource", "github", "unemployed", "retired",
    "psmux", "personal account", "personal use", "my", "my company", "x company",
    "acme", "software engineer", "software developer", "senior software architect",
    "developer", "engineer", "test", "example", "no company", "nope",
}

def canonical_company_key(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
    tokens = s.split()
    while len(tokens) > 1 and tokens[-1] in LEGAL_SUFFIXES:
        tokens.pop()
        while len(tokens) > 1 and tokens[-1] == "and":
            tokens.pop()
    return " ".join(tokens)

_logo_cache: dict[str, tuple[str | None, str | None]] = {}
_default_favicon: bytes | None = None

def _fetch(url: str) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "psmux-website-stats"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                return resp.read()
    except Exception:
        return None
    return None

def resolve_logo(key: str, display: str = "") -> tuple[str | None, str | None]:
    """Best-effort (slug, logoUrl) for a canonical company key.

    Prefers Simple Icons (white tint matches the dark theme). Falls back to
    the Google favicon service for <slug>.com, verified against the default
    globe placeholder so unknown domains do not render a generic icon.
    Every URL is checked at build time; entries without a real logo get none
    and the frontend shows a placeholder icon instead.
    """
    global _default_favicon
    if key in _logo_cache:
        return _logo_cache[key]
    slug = slugify_company(key)
    result: tuple[str | None, str | None] = (None, None)
    if slug and key not in GENERIC_COMPANIES:
        simple_url = f"https://cdn.simpleicons.org/{slug}/ffffff"
        if slug in COMPANY_LOGO_SLUGS or _fetch(simple_url):
            result = (slug, simple_url)
        else:
            # Universities have known domains; everyone else gets a
            # <slug>.com guess verified below. The display name keeps
            # hyphens ("Sun Yat-sen") that the canonical key strips.
            uni = extract_university(display or key)
            domain = uni[1] if uni and uni[1] else f"{slug}.com"
            favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
            if _default_favicon is None:
                _default_favicon = _fetch(
                    "https://www.google.com/s2/favicons?domain=nonexistent-psmux-probe-domain.com&sz=128"
                ) or b""
            data = _fetch(favicon_url)
            if data and len(data) > 200 and data != _default_favicon:
                result = (None, favicon_url)
    _logo_cache[key] = result
    return result

def normalize_company(raw: str) -> str:
    s = raw.strip()
    if s.startswith("@"):
        s = s[1:].strip()
    # Curly quotes and common mojibake renderings of an apostrophe (e.g.
    # "Xi’an" vs "Xi'an", or a UTF-8 apostrophe mis-decoded as Latin-1
    # "â€™") collapse to a plain apostrophe so name variants
    # merge into a single entry instead of appearing as separate duplicates.
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("â€™", "'")
    s = re.sub(r"(?<=[A-Za-z])�(?=[A-Za-z])", "'", s)
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

# Repos that merely contain "psmux" in a video/streaming sense (PS mux =
# MPEG program stream muxer) are not part of this ecosystem.
UNRELATED_REPO = re.compile(r"gb\s?28181|mpeg|\brtp\b|rtsp|h\.?26[45]|\bts\s?mux", re.I)

# Impersonators are never listed anywhere on the site: explicit blocklist
# plus a structural rule (a community repo named exactly "psmux" is a clone
# posing as this project, not an ecosystem project). Keep in sync with the
# ecosystem filter in src/hooks/useLiveStats.ts.
BLOCKED_OWNERS = {"nileshfating"}
BLOCKED_REPOS = {"nileshfating/psmux"}

# Accounts that are never shown anywhere on the site (contributors, notable
# users, ecosystem, mentions, dotfiles). Keep in sync with HIDDEN_USERS in
# src/hooks/useLiveStats.ts.
HIDDEN_USERS = {"altrosyn"}

# Personal dotfiles and config repos belong in the dotfiles section, never in
# the ecosystem project list. Keep in sync with DOTFILE_REPO in
# src/hooks/useLiveStats.ts.
DOTFILE_REPO = re.compile(
    r"^\.|dotfile|\.conf$|(^|[-_.])(config|configs|configuration|settings|setup)([-_.]|$)",
    re.I,
)

def categorize_repo(name: str, owner: str, description: str) -> str:
    text = f"{name} {description or ''}".lower()
    if "claude" in text or "agent" in text:
        return "claude-code"
    return "tool"

def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--repo-json", required=True)
    p.add_argument("--contributors", required=True)
    p.add_argument("--stargazers", required=True)
    p.add_argument("--star-times", default="")
    p.add_argument("--ecosystem", required=True)
    p.add_argument("--issue-mentions", required=True)
    p.add_argument("--code-mentions", required=True)
    p.add_argument("--psmux-src", default="")
    p.add_argument("--fork-count", default="")
    p.add_argument("--release-json", default="")
    p.add_argument("--out", required=True)
    args = p.parse_args()

    repo = json.loads(Path(args.repo_json).read_text())
    contributors = json.loads(Path(args.contributors).read_text())
    stargazers = json.loads(Path(args.stargazers).read_text())
    stargazers = [s for s in stargazers if (s.get("login") or "").lower() not in HIDDEN_USERS]
    ecosystem = json.loads(Path(args.ecosystem).read_text())
    issues_raw = json.loads(Path(args.issue_mentions).read_text())
    code_raw = json.loads(Path(args.code_mentions).read_text())

    out: dict = {}

    out["stars"] = repo.get("stargazers_count", 0)
    out["forks"] = int(args.fork_count) if args.fork_count else repo.get("forks_count", 0)
    out["contributors"] = len(contributors)

    # ---- Top contributors (bots excluded) ----
    top_contribs = []
    for c in contributors:
        login = c.get("login") or ""
        if not login or login.endswith("[bot]") or c.get("type") == "Bot":
            continue
        if login.lower() in HIDDEN_USERS:
            continue
        top_contribs.append({
            "login": login,
            "avatarUrl": c.get("avatar_url") or "",
            "url": c.get("html_url") or f"https://github.com/{login}",
            "contributions": c.get("contributions", 0),
        })
    top_contribs.sort(key=lambda c: -c["contributions"])
    out["topContributors"] = top_contribs[:12]
    out["issues"] = repo.get("open_issues_count", 0)

    # ---- Companies ----
    company_strings: list[str] = []
    for sg in stargazers:
        c = normalize_company(sg.get("company") or "")
        if c:
            company_strings.append(c)

    # Merge name variants ("Microsoft", "microsoft", "Microsoft Corporation")
    # before ranking; the display name is the most frequent raw spelling,
    # preferring capitalized then shorter forms.
    variant_votes: dict[str, Counter] = {}
    for c in company_strings:
        key = canonical_company_key(c)
        if key:
            variant_votes.setdefault(key, Counter())[c] += 1
    merged_counts: Counter = Counter()
    display_names: dict[str, str] = {}
    for key, votes in variant_votes.items():
        merged_counts[key] = sum(votes.values())
        best = max(
            votes.items(),
            key=lambda kv: (kv[1], kv[0] != kv[0].lower(), -len(kv[0])),
        )
        display_names[key] = best[0]

    # Universities/institutes are surfaced separately via topUniversities;
    # keep them out of the companies list and count so the two sections
    # don't duplicate the same entries. Placeholder strings that are not
    # real organizations (GENERIC_COMPANIES) are dropped for the same reason.
    non_edu_counts = Counter({
        key: count for key, count in merged_counts.items()
        if not EDU_PATTERN.search(display_names[key])
        and key not in GENERIC_COMPANIES
    })
    out["companiesRepresented"] = len(non_edu_counts)

    # Top companies by frequency; every entry gets a verified logo when one
    # exists so new companies (Fortune 500 included) show up branded.
    top_companies = []
    for key, count in non_edu_counts.most_common(100):
        entry = {"name": display_names[key], "count": count}
        logo_slug, logo_url = resolve_logo(key, display_names[key])
        if logo_slug:
            entry["logo"] = logo_slug
        if logo_url:
            entry["logoUrl"] = logo_url
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

    # ---- Star history (monthly cumulative totals) ----
    # Timestamps come from the REST star+json dump (--star-times); the GraphQL
    # starredAt field is not readable by the Actions GITHUB_TOKEN ("Resource
    # not accessible by integration"), so it must never be on the critical
    # fetch path. Entries in --stargazers with a starredAt field still count
    # (local/back-compat dumps). Gap months with zero new stars carry the
    # previous total forward so the series has no holes. Capped to the 48
    # most recent months. If no timestamps are available at all, the previous
    # starHistory in the existing output file is preserved so the chart on
    # the stats card never disappears.
    month_counts: Counter = Counter()
    star_time_sources: list = []
    if args.star_times and Path(args.star_times).exists():
        try:
            star_time_sources = json.loads(Path(args.star_times).read_text())
        except Exception:
            star_time_sources = []
    # Exclusive sources: a stargazers dump that also carries starredAt would
    # otherwise double-count every month.
    for sg in (star_time_sources if star_time_sources else stargazers):
        starred_at = sg.get("starredAt") if isinstance(sg, dict) else None
        if not starred_at:
            continue
        month = str(starred_at)[:7]
        if re.match(r"^\d{4}-\d{2}$", month):
            month_counts[month] += 1

    if not month_counts and Path(args.out).exists():
        try:
            prev = json.loads(Path(args.out).read_text(encoding="utf-8"))
            if isinstance(prev.get("starHistory"), list) and prev["starHistory"]:
                out["starHistory"] = prev["starHistory"]
        except Exception:
            pass

    if month_counts:
        months_sorted = sorted(month_counts)
        cur = datetime.strptime(months_sorted[0], "%Y-%m")
        end = datetime.strptime(months_sorted[-1], "%Y-%m")
        all_months = []
        while cur <= end:
            all_months.append(cur.strftime("%Y-%m"))
            cur = datetime(cur.year + 1, 1, 1) if cur.month == 12 else datetime(cur.year, cur.month + 1, 1)
        star_history = []
        running = 0
        for m in all_months:
            running += month_counts.get(m, 0)
            star_history.append({"month": m, "total": running})
        out["starHistory"] = star_history[-48:]

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
    dotfile_eco: list[dict] = []
    for r in ecosystem:
        full = r.get("fullName") or r.get("nameWithOwner") or ""
        if "/" not in full:
            continue
        owner, name = full.split("/", 1)
        if owner.lower() == "psmux":
            continue  # ecosystem means community projects, not psmux's own
        if (
            owner.lower() in BLOCKED_OWNERS
            or full.lower() in BLOCKED_REPOS
            or name.lower() == "psmux"
            or owner.lower() in HIDDEN_USERS
        ):
            continue  # impersonators never get listed
        if DOTFILE_REPO.search(name):
            dotfile_eco.append({"repo": full, "detail": "psmux config"})
            continue  # personal configs go to the dotfiles section
        text = name.lower() + " " + (r.get("description") or "").lower()
        if "psmux" not in text:
            continue
        if UNRELATED_REPO.search(text):
            continue
        eco.append({
            "name": name,
            "author": owner,
            "stars": r.get("stargazersCount", r.get("stargazers_count", 0)),
            "description": (r.get("description") or "").strip() or "psmux-related project",
            "category": categorize_repo(name, owner, r.get("description") or ""),
        })
    eco.sort(key=lambda e: (-e["stars"], e["name"].lower()))
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
        # Filter: repo must not be psmux's own, nor a blocked impersonator
        if repo_full.lower().startswith("psmux/"):
            continue
        if repo_full.lower().split("/")[0] in BLOCKED_OWNERS | HIDDEN_USERS or repo_full.lower() in BLOCKED_REPOS:
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
        if repo_full.lower().split("/")[0] in BLOCKED_OWNERS | HIDDEN_USERS:
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
    for d in dotfile_eco:
        df_seen.setdefault(d["repo"], d)
    dotfiles = list(df_seen.values())[:24]
    out["dotfilesRepos"] = dotfiles
    out["dotfilesReferences"] = len(dotfiles)

    # ---- World map points from stargazer profile locations ----
    city_agg: dict[str, dict] = {}
    for sg in stargazers:
        entry = locate(sg.get("location") or "")
        if not entry:
            continue
        city, lat, lng, country, continent = entry
        agg = city_agg.setdefault(city, {
            "label": city, "lat": lat, "lng": lng,
            "country": country, "continent": continent,
            "count": 0, "orgs": Counter(),
        })
        agg["count"] += 1
        comp = normalize_company(sg.get("company") or "")
        if comp:
            agg["orgs"][display_names.get(canonical_company_key(comp), comp)] += 1

    map_points = []
    for agg in sorted(city_agg.values(), key=lambda a: -a["count"]):
        top_orgs = [name for name, _ in agg["orgs"].most_common(3)]
        n = agg["count"]
        detail = f"{n} developer" + ("s" if n != 1 else "")
        if top_orgs:
            detail += " · " + ", ".join(top_orgs)
        size = "lg" if n >= 10 else "md" if n >= 4 else "sm"
        color = None
        if any(slugify_company(o) in BIG_TECH for o in top_orgs):
            color = "#60a5fa"
        elif any(EDU_PATTERN.search(o) for o in top_orgs):
            color = "#fbbf24"
        point = {
            "lat": agg["lat"], "lng": agg["lng"],
            "label": agg["label"], "detail": detail, "size": size,
            "country": agg["country"], "continent": agg["continent"],
        }
        if color:
            point["color"] = color
        map_points.append(point)
    if map_points:
        out["mapPoints"] = map_points[:48]
        out["cities"] = len(city_agg)
        out["countries"] = len({a["country"] for a in city_agg.values()})
        out["continents"] = len({a["continent"] for a in city_agg.values()})

    # ---- Latest release version ----
    if args.release_json:
        try:
            release = json.loads(Path(args.release_json).read_text())
            tag = (release.get("tag_name") or "").lstrip("vV")
            if re.match(r"^\d+\.\d+", tag):
                out["latestVersion"] = tag
        except Exception:
            pass

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

    # ---- Fail-soft: preserve stargazer-derived data when the fetch failed ----
    # Since 2026-07 the Actions GITHUB_TOKEN can no longer run the stargazers
    # GraphQL query ("Resource not accessible by integration"). When the
    # workflow falls back to an empty stargazers dump, carry the previously
    # published values forward so the site never loses adoption data.
    if not stargazers and Path(args.out).exists():
        try:
            prev = json.loads(Path(args.out).read_text(encoding="utf-8"))
        except Exception:
            prev = {}
        for k in (
            "companiesRepresented", "topCompanies", "universities",
            "topUniversities", "notableUsers", "mapPoints", "cities",
            "countries", "continents",
        ):
            v = prev.get(k)
            if v and not out.get(k):
                out[k] = v

    out["lastUpdated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    Path(args.out).write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Wrote {args.out}")
    print(f"  stars={out['stars']} forks={out['forks']} contribs={out['contributors']}")
    print(f"  companies={out['companiesRepresented']} top={len(top_companies)}")
    print(f"  universities={out['universities']} listed={len(seen_unis)}")
    print(f"  notableUsers={len(notable)}")
    print(f"  ecosystem={len(eco)} mentions={len(mentions)} dotfiles={len(dotfiles)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
