import { kbCache } from "./kb-cache.js";

const BASE = "https://rest.kegg.jp";

// Resolve compound name → KEGG compound ID (e.g. "cpd:C00735")
async function findCompound(name) {
  const cacheKey = `kegg:cid:${name.toLowerCase()}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  const res = await fetch(`${BASE}/find/compound/${encodeURIComponent(name)}`);
  if (!res.ok) { kbCache.setCache(cacheKey, null, "kegg", 2592000); return null; }

  const text = await res.text();
  // Tab-delimited: "cpd:C00735\tcortisol, ..."
  const firstLine = text.trim().split("\n")[0];
  const id = firstLine?.split("\t")[0]?.trim() ?? null;

  kbCache.setCache(cacheKey, id, "kegg", 2592000); // 30d
  return id;
}

// Fetch pathway IDs linked to a compound
async function getPathways(compoundId) {
  const cacheKey = `kegg:pathways:${compoundId}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  const res = await fetch(`${BASE}/link/pathway/${compoundId}`);
  if (!res.ok) { kbCache.setCache(cacheKey, [], "kegg", 2592000); return []; }

  const text = await res.text();
  // "cpd:C00735\tpath:hsa04080"
  const pathways = text.trim().split("\n")
    .map(l => l.split("\t")[1]?.trim())
    .filter(Boolean);

  kbCache.setCache(cacheKey, pathways, "kegg", 2592000);
  return pathways;
}

// Human-readable pathway names
async function getPathwayNames(pathwayIds) {
  if (!pathwayIds.length) return [];
  const cacheKey = `kegg:pnames:${pathwayIds.slice(0, 5).join(",")}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  // Batch: at most 10
  const ids = pathwayIds.slice(0, 10).join("+");
  const res = await fetch(`${BASE}/list/${ids}`);
  if (!res.ok) return pathwayIds;

  const text = await res.text();
  const names = text.trim().split("\n").map(l => {
    const parts = l.split("\t");
    return parts[1]?.trim() ?? parts[0];
  }).filter(Boolean);

  kbCache.setCache(cacheKey, names, "kegg", 2592000);
  return names;
}

/**
 * Main entry: enrich a molecule with KEGG pathway data.
 * Returns: { kegg_id, pathways: [pathway names] } or null
 */
export async function enrichFromKEGG(name) {
  try {
    const id = await findCompound(name);
    if (!id) return null;

    const pathwayIds = await getPathways(id);
    const pathways = await getPathwayNames(pathwayIds);

    return {
      kegg_id: id,
      pathway_count: pathwayIds.length,
      pathways: pathways.slice(0, 8), // top 8 pathways
      source: "kegg",
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[kegg] Error enriching "${name}":`, err.message);
    return null;
  }
}
