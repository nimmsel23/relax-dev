/**
 * Einmalige Migration: YAML-Kataloge → SQLite (data/kb.db)
 *
 * Trennt Index-Felder (bleiben in YAML) von Detail-Feldern (SQLite).
 * Überschreibt keine bereits vorhandenen DB-Einträge mit curated=1.
 *
 * Usage: node scripts/migrate-yaml-to-sqlite.mjs [--force]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { kbDb } from "../server/knowledge/kb-db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.join(__dirname, "../knowledge");

const force = process.argv.includes("--force");

// ── Field sets ─────────────────────────────────────────────────────────────

// Fields that stay in YAML index (thin catalog)
const MOL_INDEX_FIELDS = new Set(["name", "de_name", "category", "relaxation_relevance", "tags", "found_in"]);
// Fields that go to molecule_details
const MOL_SKIP = new Set(["_source", "_created_at", "_metadata"]);

const SUB_INDEX_FIELDS = new Set(["name", "de_name", "category", "relaxation_relevance", "references"]);

// ── Helpers ────────────────────────────────────────────────────────────────

function loadYAML(filename) {
  const filePath = path.join(KB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ${filename} nicht gefunden`);
    return {};
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return YAML.parse(raw);
}

function splitMolecule(key, mol) {
  const index = { name: mol.name, de_name: mol.de_name, category: mol.category,
                   relaxation_relevance: mol.relaxation_relevance,
                   tags: mol.tags || [], found_in: mol.found_in || [] };
  const detail = {};
  for (const [k, v] of Object.entries(mol)) {
    if (!MOL_INDEX_FIELDS.has(k) && !MOL_SKIP.has(k)) detail[k] = v;
  }
  return { index, detail };
}

function splitSubstance(key, sub) {
  const index = { name: sub.name, de_name: sub.de_name, category: sub.category,
                   relaxation_relevance: sub.relaxation_relevance,
                   references: sub.references || [] };
  const detail = {};
  for (const [k, v] of Object.entries(sub)) {
    if (!SUB_INDEX_FIELDS.has(k)) detail[k] = v;
  }
  return { index, detail };
}

// ── Main ───────────────────────────────────────────────────────────────────

if (!kbDb.isEmpty() && !force) {
  console.log("ℹ️  DB bereits befüllt. Mit --force neu importieren.");
  process.exit(0);
}

console.log("📦 Lade YAML-Dateien...");
const molData  = loadYAML("molecule.catalog.yaml");
const subData  = loadYAML("substance.catalog.yaml");
const interData = loadYAML("interactions.yaml");
const reactData = loadYAML("reactions.yaml");

const molecules    = molData.molecules    || {};
const substances   = subData.substances   || {};
const interactions = interData.interactions || {};
const reactions    = reactData.reactions   || {};

console.log(`   Moleküle: ${Object.keys(molecules).length}`);
console.log(`   Substanzen: ${Object.keys(substances).length}`);
console.log(`   Interaktionen: ${Object.keys(interactions).length}`);
console.log(`   Reaktionen: ${Object.keys(reactions).length}`);

// Molecules
console.log("\n🔬 Importiere Moleküle...");
for (const [key, mol] of Object.entries(molecules)) {
  const { index, detail } = splitMolecule(key, mol);
  kbDb.upsertMolecule(key, index, detail, true);
}
console.log(`   ✅ ${Object.keys(molecules).length} Moleküle`);

// Substances
console.log("🌿 Importiere Substanzen...");
for (const [key, sub] of Object.entries(substances)) {
  const { index, detail } = splitSubstance(key, sub);
  kbDb.upsertSubstance(key, index, detail, true);
}
console.log(`   ✅ ${Object.keys(substances).length} Substanzen`);

// Interactions
console.log("⚡ Importiere Interaktionen...");
for (const [key, inter] of Object.entries(interactions)) {
  kbDb.upsertInteraction(key, inter, true);
}
console.log(`   ✅ ${Object.keys(interactions).length} Interaktionen`);

// Reactions
console.log("🔄 Importiere Reaktionen...");
for (const [key, reaction] of Object.entries(reactions)) {
  kbDb.upsertReaction(key, reaction, true);
}
console.log(`   ✅ ${Object.keys(reactions).length} Reaktionen`);

const stats = kbDb.stats();
console.log("\n📊 DB-Status:");
console.log(`   molecules:         ${stats.molecules} (${stats.molecules_curated} kuratiert)`);
console.log(`   molecule_details:  ${stats.molecule_details}`);
console.log(`   substances:        ${stats.substances} (${stats.substance_details} mit Details)`);
console.log(`   interactions:      ${stats.interactions}`);
console.log(`   reactions:         ${stats.reactions}`);
console.log("\n✅ Migration abgeschlossen → data/kb.db");
