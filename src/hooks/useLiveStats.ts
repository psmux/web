import { useEffect, useState } from "react";
import {
  stats as staticStats,
  companies as staticCompanies,
  notableUsers as staticNotableUsers,
  universities as staticUniversities,
  ecosystemProjects as staticEcosystem,
  crossRepoMentions as staticCrossRepo,
  dotfilesRepos as staticDotfiles,
} from "../data";

export type LiveCompany = { name: string; count: number; logo?: string };
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

export type LiveStats = typeof staticStats & {
  lastUpdated?: string;
  topCompanies: LiveCompany[];
  topUniversities: LiveUniversity[];
  notableUsers: LiveNotableUser[];
  ecosystemProjects: LiveEcosystemProject[];
  crossRepoMentions: LiveCrossRepoMention[];
  dotfilesRepos: LiveDotfilesRepo[];
};

const CACHE_KEY = "psmux-live-stats-v2";
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

const SEED: Pick<
  LiveStats,
  | "topCompanies"
  | "topUniversities"
  | "notableUsers"
  | "ecosystemProjects"
  | "crossRepoMentions"
  | "dotfilesRepos"
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
};

export function useLiveStats(): LiveStats {
  const [live, setLive] = useState<LivePayload>({});

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setLive(cached.data);
      return;
    }

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
        ] as const;
        for (const k of numKeys) {
          if (typeof data[k] === "number") {
            (merged as Record<string, unknown>)[k] = data[k];
          }
        }
        // Arrays
        if (Array.isArray(data.topCompanies) && data.topCompanies.length > 0) {
          merged.topCompanies = data.topCompanies;
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
          merged.ecosystemProjects = data.ecosystemProjects;
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
        if (typeof data.lastUpdated === "string") {
          merged.lastUpdated = data.lastUpdated;
        }
      })
      .catch(() => {});

    Promise.all([ghFetch, actionsFetch]).then(() => {
      if (Object.keys(merged).length > 0) {
        setLive(merged);
        writeCache(merged);
      }
    });

    return () => controller.abort();
  }, []);

  return { ...staticStats, ...SEED, ...live };
}
