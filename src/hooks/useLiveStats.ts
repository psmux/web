import { useEffect, useState } from "react";
import { stats as staticStats } from "../data";

type LiveStats = typeof staticStats & { lastUpdated?: string };

const CACHE_KEY = "psmux-live-stats";
const CACHE_TTL = 1000 * 60 * 15; // 15 min

function readCache(): { data: Partial<LiveStats>; ts: number } | null {
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

function writeCache(data: Partial<LiveStats>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function useLiveStats(): LiveStats {
  const [live, setLive] = useState<Partial<LiveStats>>({});

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setLive(cached.data);
      return;
    }

    const controller = new AbortController();
    const merged: Partial<LiveStats> = {};

    // 1. Fetch live repo stats from GitHub API (stars, forks)
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

    // 2. Fetch Actions-generated heavy data (companies, ecosystem, etc.)
    const actionsFetch = fetch("/live-stats.json", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (data.companiesRepresented) merged.companiesRepresented = data.companiesRepresented;
          if (data.ecosystemRepos) merged.ecosystemRepos = data.ecosystemRepos;
          if (data.contributors) merged.contributors = data.contributors;
          if (data.universities) merged.universities = data.universities;
          if (data.issues) merged.issues = data.issues;
          if (data.lastUpdated) merged.lastUpdated = data.lastUpdated;
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

  return { ...staticStats, ...live };
}
