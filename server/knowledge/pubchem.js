import { kbCache } from "./kb-cache.js";

const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

// Resolve name → CID
async function getCID(name) {
  const cacheKey = `pubchem:cid:${name.toLowerCase()}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  const url = `${BASE}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
  const res = await fetch(url);
  if (!res.ok) { kbCache.setCache(cacheKey, null); return null; }
  const json = await res.json();
  const cid = json?.IdentifierList?.CID?.[0] ?? null;
  kbCache.setCache(cacheKey, cid, "pubchem", 2592000); // 30d
  return cid;
}

// Fetch properties for a CID
async function getProperties(cid) {
  const cacheKey = `pubchem:props:${cid}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  const props = "MolecularFormula,MolecularWeight,IUPACName,IsomericSMILES,XLogP,HBondDonorCount,HBondAcceptorCount";
  const url = `${BASE}/compound/cid/${cid}/property/${props}/JSON`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const data = json?.PropertyTable?.Properties?.[0] ?? null;
  kbCache.setCache(cacheKey, data, "pubchem", 2592000);
  return data;
}

// Fetch pharmacology text (description) for a CID
async function getPharmacology(cid) {
  const cacheKey = `pubchem:pharma:${cid}`;
  const cached = kbCache.getCached(cacheKey);
  if (cached !== null) return cached;

  const url = `${BASE}/compound/cid/${cid}/description/JSON`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const sections = json?.InformationList?.Information ?? [];
  // Pick longest description that's not just the title
  const desc = sections
    .flatMap(s => s.Description ? [s.Description] : [])
    .sort((a, b) => b.length - a.length)[0] ?? null;
  kbCache.setCache(cacheKey, desc, "pubchem", 2592000);
  return desc;
}

/**
 * Main entry: enrich a molecule by common name.
 * Returns: { cid, formula, molecular_weight, smiles, iupac, xlogp, pharmacology }
 */
export async function enrichFromPubChem(name) {
  try {
    const cid = await getCID(name);
    if (!cid) return null;

    const [props, pharmacology] = await Promise.all([
      getProperties(cid),
      getPharmacology(cid),
    ]);

    return {
      cid,
      formula: props?.MolecularFormula ?? null,
      molecular_weight: props?.MolecularWeight ?? null,
      smiles: props?.IsomericSMILES ?? null,
      iupac: props?.IUPACName ?? null,
      xlogp: props?.XLogP ?? null,
      pharmacology: pharmacology ?? null,
      source: "pubchem",
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[pubchem] Error enriching "${name}":`, err.message);
    return null;
  }
}
