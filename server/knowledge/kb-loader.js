import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import YAML from "yaml";
import { kbDb } from "./kb-db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.join(__dirname, "../..", "knowledge");

class KnowledgeBaseLoader {
  constructor() {
    // Thin in-memory name→key indexes for case-insensitive lookup
    this.moleculeIndex = null;
    this.substanceIndex = null;
    this._ensureDB();
  }

  // Auto-import YAML on first run if DB is empty
  _ensureDB() {
    if (!kbDb.isEmpty()) return;
    console.log("[kb] DB leer — importiere YAML-Kataloge...");
    this._importYAML();
  }

  _importYAML() {
    const load = (filename, key) => {
      const fp = path.join(KB_DIR, filename);
      if (!fs.existsSync(fp)) return {};
      const data = YAML.parse(fs.readFileSync(fp, "utf8"));
      return data[key] || {};
    };

    const MOL_INDEX = new Set(["name", "de_name", "category", "relaxation_relevance", "tags", "found_in"]);
    const SUB_INDEX = new Set(["name", "de_name", "category", "relaxation_relevance", "references"]);
    const SKIP = new Set(["_source", "_created_at", "_metadata"]);

    const molecules = load("molecule.catalog.yaml", "molecules");
    for (const [key, mol] of Object.entries(molecules)) {
      const index = {}, detail = {};
      for (const [k, v] of Object.entries(mol)) {
        if (SKIP.has(k)) continue;
        if (MOL_INDEX.has(k)) index[k] = v; else detail[k] = v;
      }
      kbDb.upsertMolecule(key, index, detail, true);
    }

    const substances = load("substance.catalog.yaml", "substances");
    for (const [key, sub] of Object.entries(substances)) {
      const index = {}, detail = {};
      for (const [k, v] of Object.entries(sub)) {
        if (SUB_INDEX.has(k)) index[k] = v; else detail[k] = v;
      }
      kbDb.upsertSubstance(key, index, detail, true);
    }

    const interactions = load("interactions.yaml", "interactions");
    for (const [key, inter] of Object.entries(interactions)) {
      kbDb.upsertInteraction(key, inter, true);
    }

    const reactions = load("reactions.yaml", "reactions");
    for (const [key, rxn] of Object.entries(reactions)) {
      kbDb.upsertReaction(key, rxn, true);
    }

    console.log(`[kb] Import: ${Object.keys(molecules).length} Mol / ${Object.keys(substances).length} Sub / ${Object.keys(interactions).length} Int / ${Object.keys(reactions).length} Rxn`);
  }

  // ── Index ──────────────────────────────────────────────────────────────────

  _buildMoleculeIndex() {
    if (this.moleculeIndex) return;
    this.moleculeIndex = {};
    for (const [key, mol] of Object.entries(kbDb.getAllMolecules())) {
      this.moleculeIndex[key.toLowerCase()] = key;
      if (mol.name) this.moleculeIndex[mol.name.toLowerCase()] = key;
      if (mol.de_name) this.moleculeIndex[mol.de_name.toLowerCase()] = key;
    }
  }

  _buildSubstanceIndex() {
    if (this.substanceIndex) return;
    this.substanceIndex = {};
    for (const [key, sub] of Object.entries(kbDb.getAllSubstances())) {
      this.substanceIndex[key.toLowerCase()] = key;
      if (sub.name) this.substanceIndex[sub.name.toLowerCase()] = key;
      if (sub.de_name) this.substanceIndex[sub.de_name.toLowerCase()] = key;
    }
  }

  _invalidateIndexes() {
    this.moleculeIndex = null;
    this.substanceIndex = null;
  }

  // ── Public API (same interface as before) ──────────────────────────────────

  loadMolecules() { return kbDb.getAllMolecules(); }
  loadSubstances() { return kbDb.getAllSubstances(); }
  loadReactions() { return kbDb.getAllReactions(); }
  loadInteractions() { return kbDb.getAllInteractions(); }

  getMolecule(query) {
    this._buildMoleculeIndex();
    const key = this.moleculeIndex[query.toLowerCase()];
    return key ? kbDb.getMolecule(key) : null;
  }

  getSubstance(query) {
    this._buildSubstanceIndex();
    const key = this.substanceIndex[query.toLowerCase()];
    return key ? kbDb.getSubstance(key) : null;
  }

  searchMolecules(query) { return kbDb.searchMolecules(query.toLowerCase()); }
  searchSubstances(query) { return kbDb.searchSubstances(query.toLowerCase()); }

  getInteraction(mol1, mol2) { return kbDb.getInteraction(mol1, mol2); }

  molExistsInKB(query) { return this.getMolecule(query) !== null; }
  interactionExistsInKB(mol1, mol2) { return this.getInteraction(mol1, mol2) !== null; }

  addMolecule(key, moleculeData, source = "manual", metadata = {}) {
    const indexFields = ["name", "de_name", "category", "relaxation_relevance", "tags", "found_in"];
    const index = Object.fromEntries(indexFields.map(f => [f, moleculeData[f]]).filter(([, v]) => v !== undefined));
    const detail = { ...moleculeData, sources: [source], needs_review: metadata.needs_review || false };
    const ok = kbDb.upsertMolecule(key, index, detail, false);
    if (ok !== false) this._invalidateIndexes();
    return ok !== false;
  }

  addInteraction(key, interactionData) {
    kbDb.upsertInteraction(key, interactionData, false);
  }

  // Legacy save methods — no-ops (SQLite writes on upsert)
  saveMolecules() {}
  saveSubstances() {}
  saveInteractions() {}
  saveReactions() {}

  // ── Dispatcher & Graph Expansion (unchanged logic) ─────────────────────────

  expandSubstance(query) {
    const substance = this.getSubstance(query);
    if (!substance) return null;

    const moleculeReferences = substance.references || [];
    const molecules = [];
    const interactions = [];

    for (const molRef of moleculeReferences) {
      const mol = this.getMolecule(molRef);
      if (mol) molecules.push(mol);
    }

    const interactionsSet = new Set();
    for (let i = 0; i < moleculeReferences.length; i++) {
      for (let j = i + 1; j < moleculeReferences.length; j++) {
        const inter = this.getInteraction(moleculeReferences[i], moleculeReferences[j]);
        if (inter) interactionsSet.add(JSON.stringify(inter));
      }
    }
    interactionsSet.forEach(item => interactions.push(JSON.parse(item)));

    const ENDOGENOUS = new Set([
      "neurotransmitter", "hormone", "amino_acid", "mineral",
      "cytokine", "neuropeptide", "nucleoside",
    ]);
    const targetsMap = new Map();
    for (const mol of molecules) {
      for (const [targetKey, effect] of Object.entries(mol.primary_effects || {})) {
        const targetMol = this.getMolecule(targetKey);
        if (!targetMol || !ENDOGENOUS.has(targetMol.category)) continue;
        if (!targetsMap.has(targetKey)) targetsMap.set(targetKey, { ...targetMol, via: [] });
        targetsMap.get(targetKey).via.push({
          mol_key:   mol._key,
          mol_name:  mol.de_name || mol.name,
          direction: effect.direction,
          mechanism: effect.mechanism ?? null,
        });
      }
    }

    return {
      type: "substance_expansion",
      substance,
      molecules,
      targets: [...targetsMap.values()],
      interactions,
      molecule_count: molecules.length,
      interaction_count: interactions.length,
      target_count: targetsMap.size,
    };
  }

  expandMolecule(query) {
    const molecule = this.getMolecule(query);
    if (!molecule) return null;

    const substances = [];
    for (const subKey of molecule.found_in || []) {
      const sub = this.getSubstance(subKey);
      if (sub) substances.push(sub);
    }

    const relatedMolecules = [];
    for (const [key, mol] of Object.entries(kbDb.getAllMolecules())) {
      if (key !== molecule._key) {
        const inter = this.getInteraction(molecule._key, key);
        if (inter) relatedMolecules.push({ ...mol, _key: key, interaction_type: inter.type });
      }
    }

    return {
      type: "molecule_expansion",
      molecule,
      found_in_substances: substances,
      related_molecules: relatedMolecules,
      substance_count: substances.length,
      related_count: relatedMolecules.length,
    };
  }

  buildMoleculeHub(molKey) {
    this._buildMoleculeIndex();
    const targetKey = this.moleculeIndex[molKey.toLowerCase()] || molKey;
    const target = kbDb.getMolecule(targetKey);
    if (!target) return null;

    const molecules = kbDb.getAllMolecules();
    const substances = kbDb.getAllSubstances();

    const affectingMolecules = [];
    for (const [key, mol] of Object.entries(molecules)) {
      if (key === targetKey) continue;
      const effects = mol.primary_effects || {};
      if (effects[targetKey] || (mol.affects || []).includes(targetKey)) {
        affectingMolecules.push({ ...mol, _key: key, effect: effects[targetKey] });
      }
    }

    const affectingSubstances = [];
    const seenSubs = new Set();
    for (const affMol of affectingMolecules) {
      for (const [subKey, sub] of Object.entries(substances)) {
        if (seenSubs.has(subKey)) continue;
        if ((sub.references || []).includes(affMol._key)) {
          affectingSubstances.push({ ...sub, _key: subKey, via_molecule: affMol._key });
          seenSubs.add(subKey);
        }
      }
    }

    const relatedMolecules = [];
    for (const [key, mol] of Object.entries(molecules)) {
      if (key === targetKey) continue;
      const inter = this.getInteraction(targetKey, key);
      if (inter) relatedMolecules.push({ ...mol, _key: key, interaction: inter });
    }

    return {
      type: "molecule_hub",
      hub: { ...target, _key: targetKey },
      affecting_substances: affectingSubstances,
      affecting_molecules: affectingMolecules,
      related_molecules: relatedMolecules,
    };
  }

  buildNetworkGraph() {
    const molecules = kbDb.getAllMolecules();
    const interactions = kbDb.getAllInteractions();

    const nodes = [];
    const edges = [];
    const seenEdges = new Set();

    for (const [key, mol] of Object.entries(molecules)) {
      nodes.push({
        _key: key,
        name: mol.de_name || mol.name,
        category: mol.category,
        tags: mol.tags || [],
        relaxation_relevance: mol.relaxation_relevance,
      });
    }

    for (const inter of Object.values(interactions)) {
      const [a, b] = inter.molecules || [];
      if (!a || !b || !molecules[a] || !molecules[b]) continue;
      const id = `${a}__${b}`;
      if (!seenEdges.has(id)) {
        seenEdges.add(id);
        edges.push({ id, source: a, target: b, type: inter.type, label: inter.type });
      }
    }

    for (const [molKey, mol] of Object.entries(molecules)) {
      for (const [targetKey, effect] of Object.entries(mol.primary_effects || {})) {
        if (!molecules[targetKey]) continue;
        const id = `${molKey}__${targetKey}__fx`;
        if (!seenEdges.has(id)) {
          seenEdges.add(id);
          edges.push({ id, source: molKey, target: targetKey, type: "primary_effect",
                       direction: effect.direction, label: effect.direction });
        }
      }
    }

    return { nodes, edges, molecule_count: nodes.length, edge_count: edges.length };
  }

  dispatchQuery(query) {
    if (!query || typeof query !== "string") return { error: "Invalid query" };
    const q = query.toLowerCase().trim();
    const substance = this.getSubstance(q);
    if (substance) return { matched_type: "substance", data: this.expandSubstance(q) };
    const molecule = this.getMolecule(q);
    if (molecule) return { matched_type: "molecule", data: this.expandMolecule(q) };
    return { matched_type: null, data: null, suggestion: "No substance or molecule found matching: " + query };
  }

  searchAll(query) {
    const substanceResults = this.searchSubstances(query);
    const moleculeResults = this.searchMolecules(query);
    return {
      substances: Object.keys(substanceResults).map(key => ({ _key: key, ...substanceResults[key] })),
      molecules: Object.keys(moleculeResults).map(key => ({ _key: key, ...moleculeResults[key] })),
      total: Object.keys(substanceResults).length + Object.keys(moleculeResults).length,
    };
  }
}

export const kb = new KnowledgeBaseLoader();
