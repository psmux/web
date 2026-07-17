import { useEffect, useState } from "react";
import {
  stats as staticStats,
  latestVersion as staticLatestVersion,
  companies as staticCompanies,
  notableUsers as staticNotableUsers,
  universities as staticUniversities,
  ecosystemProjects as staticEcosystem,
  crossRepoMentions as staticCrossRepo,
  dotfilesRepos as staticDotfiles,
  mapPoints as staticMapPoints,
  contributors as staticContributors,
  type MapPoint,
} from "../data";

export type LiveCompany = { name: string; count: number; logo?: string; logoUrl?: string };
export type LiveUniversity = { name: string; domain?: string };
export type LiveNotableUser = {
  login: string;
  name: string;
  followers: number;
  title: string;
  company: string;
  highlight: boolean;
  quote?: string;
};
export type LiveEcosystemProject = {
  name: string;
  author: string;
  stars: number;
  description: string;
  category: string;
};
export type LiveCrossRepoMention = {
  repo: string;
  issues: string[];
  context: string;
};
export type LiveDotfilesRepo = { repo: string; detail: string };
export type LiveContributor = {
  login: string;
  avatarUrl: string;
  url: string;
  contributions: number;
};

export type LiveStats = typeof staticStats & {
  lastUpdated?: string;
  latestVersion: string;
  cities?: number;
  countries?: number;
  continents?: number;
  topCompanies: LiveCompany[];
  topUniversities: LiveUniversity[];
  notableUsers: LiveNotableUser[];
  ecosystemProjects: LiveEcosystemProject[];
  crossRepoMentions: LiveCrossRepoMention[];
  dotfilesRepos: LiveDotfilesRepo[];
  mapPoints: MapPoint[];
  topContributors: LiveContributor[];
};

const CACHE_KEY = "psmux-live-stats-v3";
const CACHE_TTL = 1000 * 60 * 15; // 15 min

type LivePayload = Partial<Omit<LiveStats, keyof typeof staticStats>> &
  Partial<typeof staticStats>;

function readCache(): { data: LivePayload; ts: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: LivePayload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* noop */
  }
}

// Keep in sync with LEGAL_SUFFIXES in scripts/build-live-stats.py.
const LEGAL_SUFFIXES = new Set([
  "inc", "incorporated", "corp", "corporation", "co", "company",
  "ltd", "limited", "llc", "llp", "plc", "gmbh", "ag", "sa", "srl",
  "bv", "ab", "oy", "kk", "group", "holdings", "international", "intl",
]);

export function canonicalCompanyKey(name: string): string {
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
    while (tokens.length > 1 && tokens[tokens.length - 1] === "and") {
      tokens.pop();
    }
  }
  return tokens.join(" ");
}

// Merge variants of the same company name ("Microsoft" / "microsoft" /
// "Microsoft Corporation") so a noisy live payload never renders duplicates.
function dedupeCompanies(list: LiveCompany[]): LiveCompany[] {
  const byKey = new Map<string, LiveCompany>();
  for (const c of list) {
    if (!c || typeof c.name !== "string") continue;
    const key = canonicalCompanyKey(c.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += c.count || 0;
      if (!existing.logoUrl && c.logoUrl) {
        existing.logo = c.logo;
        existing.logoUrl = c.logoUrl;
      }
      const trimmed = c.name.trim();
      const better =
        (existing.name === existing.name.toLowerCase() &&
          trimmed !== trimmed.toLowerCase()) ||
        (trimmed !== trimmed.toLowerCase() &&
          trimmed.length < existing.name.length);
      if (better) existing.name = trimmed;
    } else {
      byKey.set(key, { ...c, name: c.name.trim() });
    }
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count);
}

const SEED: Pick<
  LiveStats,
  | "topCompanies"
  | "topUniversities"
  | "notableUsers"
  | "ecosystemProjects"
  | "crossRepoMentions"
  | "dotfilesRepos"
  | "mapPoints"
  | "topContributors"
> = {
  topCompanies: staticCompanies.map((c) => ({
    name: c.name,
    count: c.count,
    logo: c.logo,
  })),
  topUniversities: staticUniversities.map((u) => ({
    name: u.name,
    domain: u.domain,
  })),
  notableUsers: staticNotableUsers.map((u) => ({
    login: u.login,
    name: u.name,
    followers: u.followers,
    title: u.title,
    company: u.company,
    highlight: u.highlight,
    quote: u.quote,
  })),
  ecosystemProjects: staticEcosystem.map((e) => ({
    name: e.name,
    author: e.author,
    stars: e.stars,
    description: e.description,
    category: e.category,
  })),
  crossRepoMentions: staticCrossRepo.map((m) => ({
    repo: m.repo,
    issues: [...m.issues],
    context: m.context,
  })),
  dotfilesRepos: staticDotfiles.map((d) => ({ repo: d.repo, detail: d.detail })),
  mapPoints: staticMapPoints.map((p) => ({ ...p })),
  topContributors: staticContributors.map((c) => ({ ...c })),
};

export function useLiveStats(): LiveStats {
  const [live, setLive] = useState<LivePayload>(() => readCache()?.data ?? {});

  useEffect(() => {
    if (readCache()) return;

    const controller = new AbortController();
    const merged: LivePayload = {};

    // 1. Live repo stats from the GitHub API (stars / forks change minute-by-minute).
    const ghFetch = fetch("https://api.github.com/repos/psmux/psmux", {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((repo) => {
        if (repo) {
          merged.stars = repo.stargazers_count;
          merged.forks = repo.forks_count;
        }
      })
      .catch(() => {});

    // 1b. Latest release version (drives the hero pill and install cards).
    const releaseFetch = fetch(
      "https://api.github.com/repos/psmux/psmux/releases/latest",
      {
        signal: controller.signal,
        headers: { Accept: "application/vnd.github.v3+json" },
      }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((rel) => {
        const tag =
          typeof rel?.tag_name === "string"
            ? rel.tag_name.replace(/^v/i, "")
            : "";
        if (/^\d+\.\d+/.test(tag)) {
          merged.latestVersion = tag;
        }
      })
      .catch(() => {});

    // 2. Heavy data assembled by the GitHub Action.
    const actionsFetch = fetch("/live-stats.json", {
      signal: controller.signal,
      cache: "no-cache",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // Numeric counters
        const numKeys = [
          "stars",
          "forks",
          "contributors",
          "issues",
          "companiesRepresented",
          "universities",
          "ecosystemRepos",
          "commands",
          "formatVariables",
          "vimKeys",
          "packageManagers",
          "cities",
          "countries",
          "continents",
        ] as const;
        for (const k of numKeys) {
          if (typeof data[k] === "number") {
            (merged as Record<string, unknown>)[k] = data[k];
          }
        }
        if (
          typeof data.latestVersion === "string" &&
          /^\d+\.\d+/.test(data.latestVersion) &&
          !merged.latestVersion
        ) {
          merged.latestVersion = data.latestVersion;
        }
        // Arrays
        if (Array.isArray(data.topCompanies) && data.topCompanies.length > 0) {
          // Universities/institutes are shown separately in topUniversities;
          // the live payload sometimes lists them in topCompanies too, so
          // filter them out here defensively. Keep in sync with EDU_PATTERN
          // in scripts/build-live-stats.py.
          const eduPattern =
            /\.edu(\b|\/)|\.ac\.[a-z]{2}|university|universit[ae]|institut|college|polytechnic|kaist|\bETH\b|\bMIT\b/i;
          const nonEdu = (data.topCompanies as LiveCompany[]).filter(
            (c) => !eduPattern.test(c?.name ?? "")
          );
          merged.topCompanies = dedupeCompanies(nonEdu);
        }
        if (
          Array.isArray(data.topUniversities) &&
          data.topUniversities.length > 0
        ) {
          merged.topUniversities = data.topUniversities;
        }
        if (Array.isArray(data.notableUsers) && data.notableUsers.length > 0) {
          merged.notableUsers = data.notableUsers;
        }
        if (
          Array.isArray(data.ecosystemProjects) &&
          data.ecosystemProjects.length > 0
        ) {
          // Ecosystem showcases community projects; psmux's own repos stay
          // out, as do video muxers that merely contain "psmux" in the
          // MPEG program stream sense. Keep in sync with UNRELATED_REPO in
          // scripts/build-live-stats.py.
          const unrelated = /gb\s?28181|mpeg|\brtp\b|rtsp|h\.?26[45]|\bts\s?mux/i;
          const community = (
            data.ecosystemProjects as LiveEcosystemProject[]
          ).filter(
            (p) =>
              p.author?.toLowerCase() !== "psmux" &&
              !unrelated.test(`${p.name} ${p.description ?? ""}`)
          );
          if (community.length > 0) {
            merged.ecosystemProjects = community;
            merged.ecosystemRepos = community.length;
          }
        }
        if (
          Array.isArray(data.crossRepoMentions) &&
          data.crossRepoMentions.length > 0
        ) {
          merged.crossRepoMentions = data.crossRepoMentions;
        }
        if (
          Array.isArray(data.dotfilesRepos) &&
          data.dotfilesRepos.length > 0
        ) {
          merged.dotfilesRepos = data.dotfilesRepos;
        }
        if (Array.isArray(data.mapPoints) && data.mapPoints.length > 0) {
          merged.mapPoints = data.mapPoints;
        }
        if (
          Array.isArray(data.topContributors) &&
          data.topContributors.length > 0
        ) {
          merged.topContributors = data.topContributors;
        }
        if (typeof data.lastUpdated === "string") {
          merged.lastUpdated = data.lastUpdated;
        }
      })
      .catch(() => {});

    Promise.all([ghFetch, releaseFetch, actionsFetch]).then(() => {
      if (Object.keys(merged).length > 0) {
        setLive(merged);
        writeCache(merged);
      }
    });

    return () => controller.abort();
  }, []);

  return { ...staticStats, latestVersion: staticLatestVersion, ...SEED, ...live };
}
