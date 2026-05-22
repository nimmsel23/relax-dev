/**
 * KB Enrichment Pipeline
 *
 * Unterschied zu ai-enricher-v2.js:
 *   Alt: Gemini generiert blind ohne reale Daten
 *   Neu: PubChem + KEGG + Psychonaut → Gemini synthetisiert → KB-konformes YAML
 *
 * Endpoint: POST /api/knowledge/enrich
 *   { query: "withanolide_a", mode: "dry_run" | "commit" }
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import YAML from "yaml";
import dotenv from "dotenv";
import os from "os";
import path from "path";
import { enrichFromPubChem } from "./pubchem.js";
import { fetchPsychonautTiming } from "./psychonaut.js";
import { enrichFromKEGG } from "./kegg.js";
import { kbCache } from "./kb-cache.js";

dotenv.config({ path: path.join(os.homedir(), ".env/relax.env") });

const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const client = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ── Step 1: Gather ─────────────────────────────────────────────────────────

async function gather(name) {
  const [pubchem, psychonaut, kegg] = await Promise.allSettled([
    enrichFromPubChem(name),
    fetchPsychonautTiming(name),
    enrichFromKEGG(name),
  ]);

  return {
    pubchem:    pubchem.status    === "fulfilled" ? pubchem.value    : null,
    psychonaut: psychonaut.status === "fulfilled" ? psychonaut.value : null,
    kegg:       kegg.status       === "fulfilled" ? kegg.value       : null,
  };
}

// ── Step 2: Build Gemini prompt ────────────────────────────────────────────

function buildPrompt(query, gathered, relatedContext) {
  const { pubchem, psychonaut, kegg } = gathered;

  const pubchemSection = pubchem ? `
PubChem:
  Formel: ${pubchem.formula ?? "unbekannt"}
  Molekulargewicht: ${pubchem.molecular_weight ?? "?"} g/mol
  SMILES: ${pubchem.smiles ?? "–"}
  XLogP (Fettlöslichkeit): ${pubchem.xlogp ?? "?"}
  IUPAC-Name: ${pubchem.iupac ?? "–"}
  Pharmakologie: ${pubchem.pharmacology ? pubchem.pharmacology.slice(0, 600) : "keine Daten"}` : "PubChem: keine Daten gefunden";

  const psychonautSection = psychonaut ? `
Psychonaut Wiki (ROA: ${psychonaut.roa ?? "oral"}):
  Onset: ${fmtRange(psychonaut.onset)}
  Peak: ${fmtRange(psychonaut.peak)}
  Total: ${fmtRange(psychonaut.total)}
  Afterglow: ${fmtRange(psychonaut.afterglow)}` : "Psychonaut Wiki: keine Timing-Daten";

  const keggSection = kegg ? `
KEGG Pathways (${kegg.pathway_count} gesamt, Top 8):
${kegg.pathways.map(p => `  - ${p}`).join("\n")}` : "KEGG: keine Pathway-Daten";

  return `Du bist ein Psychoneuroimmunologie-Experte (PNI). Erstelle einen Knowledge-Base-Eintrag für das Molekül/die Substanz: "${query}"

ECHTE API-DATEN (verwende diese als Grundlage, nicht als Spekulation):
${pubchemSection}
${psychonautSection}
${keggSection}

VERWANDTE KB-EINTRÄGE (für Konsistenz):
${relatedContext || "(keine gefunden)"}

AUFGABE:
Erstelle einen vollständigen, evidence-basierten KB-Eintrag im exakten YAML-Format unten.
- Verwende die API-Daten als Fakten-Grundlage
- Fülle Lücken mit gesichertem biochemischen Wissen
- Fokus: Stress, Relaxation, Schlaf, Stimmung, Entzündung, Neurotransmitter
- de_name = deutsche Bezeichnung
- relaxation_relevance: high_positive | moderate_positive | neutral | moderate_negative | high_negative
- NUR valides YAML ausgeben, KEINE Markdown-Code-Blöcke, beginne mit "name:"

name: "Englischer Name"
de_name: "Deutscher Name"
category: "neurotransmitter|hormone|amino_acid|mineral|alkaloid|alkaloid_steroidal|flavonoid|terpene|polyphenol|cytokine|neuropeptide|nucleoside|supplement"
formula: "Formel oder null"
found_in:
  - "Quelle1"
functions:
  - "Hauptfunktion"
primary_effects:
  zielmoekuel_key:
    direction: "increase|decrease|potentiate|modulate|variable"
    magnitude: "Zahl in % oder beschreibend"
    onset_minutes: 30
    peak_minutes: 90
    duration_minutes: 240
    mechanism: "Kurze Erklärung"
affects:
  - "betroffenes_molekuel_oder_prozess"
relaxation_relevance: "high_positive"
tags:
  - "HPA-axis"
  - "anxiolytic"
notes: "Klinische Beobachtungen, Timing, Interaktionen, Einschränkungen"`;
}

function fmtRange(r) {
  if (!r) return "–";
  const { min, max, units } = r;
  if (min != null && max != null) return `${min}–${max} ${units}`;
  if (min != null) return `ab ${min} ${units}`;
  if (max != null) return `bis ${max} ${units}`;
  return "–";
}

// ── Step 3: Call Gemini ────────────────────────────────────────────────────

async function synthesize(prompt) {
  if (!client) throw new Error("GEMINI_API_KEY nicht konfiguriert");
  const model = client.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Step 4: Parse + Validate ───────────────────────────────────────────────

function parseAndValidate(text) {
  // Strip possible markdown fences
  const cleaned = text
    .replace(/^```ya?ml\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsed;
  try {
    parsed = YAML.parse(cleaned);
  } catch (err) {
    return { ok: false, error: `YAML parse error: ${err.message}`, raw: cleaned };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Kein Objekt zurückgegeben", raw: cleaned };
  }

  const errors = [];
  if (!parsed.name)    errors.push("name fehlt");
  if (!parsed.de_name) errors.push("de_name fehlt");
  if (!parsed.category) errors.push("category fehlt");

  return errors.length === 0
    ? { ok: true, data: parsed }
    : { ok: false, errors, data: parsed, raw: cleaned };
}

// ── Main Export ────────────────────────────────────────────────────────────

export async function runEnrichmentPipeline(query, kb) {
  const searchName = query.replace(/_/g, " ");

  // Gather external data
  console.log(`[pipeline] Gathering data for "${searchName}"...`);
  const gathered = await gather(searchName);
  console.log(`[pipeline] PubChem: ${gathered.pubchem ? "✓" : "–"} | Psychonaut: ${gathered.psychonaut ? "✓" : "–"} | KEGG: ${gathered.kegg ? "✓" : "–"}`);

  // Build related context from existing KB
  const allMols = kb.loadMolecules();
  const q = searchName.toLowerCase();
  const related = Object.entries(allMols)
    .filter(([k, m]) =>
      k.includes(q) || m.name?.toLowerCase().includes(q) ||
      m.tags?.some(t => t.includes(q.split(" ")[0]))
    )
    .slice(0, 4)
    .map(([k, m]) => `${k}: ${m.de_name || m.name} (${m.category}) — ${m.functions?.slice(0, 2).join(", ")}`)
    .join("\n");

  // Call Gemini
  const prompt = buildPrompt(query, gathered, related);
  let raw;
  try {
    console.log(`[pipeline] Calling Gemini (${modelId})...`);
    raw = await synthesize(prompt);
  } catch (err) {
    return { ok: false, error: err.message, gathered };
  }

  const parsed = parseAndValidate(raw);

  return {
    ok: parsed.ok,
    query,
    data: parsed.data ?? null,
    errors: parsed.errors ?? null,
    raw_response: parsed.raw ?? null,
    gathered,
    sources: {
      pubchem: !!gathered.pubchem,
      psychonaut: !!gathered.psychonaut,
      kegg: !!gathered.kegg,
    },
  };
}
