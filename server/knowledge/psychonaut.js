import { kbCache } from "./kb-cache.js";

const API_URL = "https://api.psychonautwiki.org";

const GQL_QUERY = `
query SubstanceTiming($name: String!) {
  substances(query: $name) {
    name
    roas {
      name
      dose { units threshold light { min max } common { min max } strong { min max } }
      duration {
        onset     { min max units }
        comeup    { min max units }
        peak      { min max units }
        offset    { min max units }
        total     { min max units }
        afterglow { min max units }
      }
    }
  }
}`;

/**
 * Fetch onset/peak/total duration from Psychonaut Wiki.
 * Returns structured timing data or null if not found.
 */
export async function fetchPsychonautTiming(name) {
  const cacheKey = `psychonaut:timing:${name.toLowerCase()}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: GQL_QUERY, variables: { name } }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const substance = json?.data?.substances?.[0];
    if (!substance) {
      kbCache.setCache(cacheKey, null, "psychonaut", 604800);
      return null;
    }

    // Prefer oral ROA, fallback to first available
    const roas = substance.roas ?? [];
    const roa = roas.find(r => r.name?.toLowerCase() === "oral") ?? roas[0];

    const timing = roa?.duration
      ? {
          roa: roa.name,
          onset:     formatRange(roa.duration.onset),
          comeup:    formatRange(roa.duration.comeup),
          peak:      formatRange(roa.duration.peak),
          offset:    formatRange(roa.duration.offset),
          total:     formatRange(roa.duration.total),
          afterglow: formatRange(roa.duration.afterglow),
          dose:      roa.dose ?? null,
        }
      : null;

    kbCache.setCache(cacheKey, timing, "psychonaut", 604800); // 7d
    return timing;
  } catch (err) {
    console.error(`[psychonaut] Error fetching "${name}":`, err.message);
    return null;
  }
}

function formatRange(range) {
  if (!range) return null;
  const { min, max, units } = range;
  if (min == null && max == null) return null;
  return { min, max, units: units ?? "minutes" };
}
