// One-shot: restore pipeline-overwritten molecules to curated KB keys
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "../knowledge/molecule.catalog.yaml");

const RESTORE = {
  erysotrine: {
    name: "Erysotrine",
    de_name: "Erysotrin",
    category: "alkaloid",
    found_in: ["mulungu", "erythrina_mulungu"],
    functions: ["GABA modulation", "Anxiolytic", "Mild CNS depression"],
    primary_effects: {
      anxiety: { direction: "decrease" },
      gaba:    { direction: "potentiate" },
    },
    relaxation_relevance: "high_positive",
    notes: "Major alkaloid in mulungu; traditional anxiolytic",
  },
  withanolide_a: {
    name: "Withanolide A",
    de_name: "Withanolid A",
    category: "alkaloid_steroidal",
    found_in: ["ashwagandha", "withania_somnifera"],
    functions: ["Stress hormone modulation", "Cortisol reduction", "Anxiolytic via GABA modulation"],
    primary_effects: {
      cortisol: { direction: "decrease", magnitude: "28_30%_with_chronic_use" },
      anxiety:  { direction: "decrease" },
    },
    relaxation_relevance: "high_positive",
    notes: "Primary active alkaloid in ashwagandha",
  },
  eurycomanone: {
    name: "Eurycomanone",
    de_name: "Eurycomanon",
    category: "quassinoid",
    found_in: ["tongkat_ali", "eurycoma_longifolia"],
    functions: ["Cortisol reduction", "LH stimulation (testosterone support)", "Adaptogenic stress modulation"],
    primary_effects: {
      cortisol: {
        direction: "decrease",
        magnitude: "16_26%_reduction_chronic_use",
        mechanism: "HPA_axis_modulation",
      },
      testosterone: {
        direction: "increase",
        mechanism: "LH_stimulation → Leydig_cell_activation",
      },
    },
    affects: ["cortisol", "testosterone", "stress_resilience"],
    relaxation_relevance: "moderate_positive",
    notes: "Primary bioactive in tongkat ali; 2% eurycomanone = standard extract quality",
  },
};

const raw = fs.readFileSync(FILE, "utf8");
const doc = YAML.parseDocument(raw);
const mols = doc.get("molecules");

for (const [key, data] of Object.entries(RESTORE)) {
  const existing = mols.get(key);
  if (!existing) { console.warn(`⚠️  ${key} nicht gefunden`); continue; }

  // Restore core fields, keep tags from previous patch
  const tags = existing.get("tags");
  for (const [field, value] of Object.entries(data)) {
    existing.set(field, YAML.parse(JSON.stringify(value)));
  }
  // Remove pipeline metadata
  existing.delete("_source");
  existing.delete("_created_at");
  existing.delete("_metadata");
  // Re-apply tags
  if (tags) existing.set("tags", tags);

  console.log(`✅ Restored ${key}`);
}

fs.writeFileSync(FILE, doc.toString(), "utf8");
console.log("Fertig.");
