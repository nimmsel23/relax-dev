/**
 * KB SQLite Layer
 * Zwei-Schichten-Architektur:
 *   molecules / substances  — kuratierter Index (name, category, tags, references)
 *   molecule_details / substance_details — anreicherbar durch Pipeline + Gemini
 *
 * DB: data/kb.db (WAL mode)
 */

import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../..", "data", "kb.db");

class KnowledgeDB {
  constructor() {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS molecules (
        key                 TEXT PRIMARY KEY,
        name                TEXT NOT NULL,
        de_name             TEXT,
        category            TEXT,
        relaxation_relevance TEXT,
        tags                TEXT,   -- JSON array
        found_in            TEXT,   -- JSON array
        curated             INTEGER DEFAULT 1,
        imported_at         TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS molecule_details (
        key             TEXT PRIMARY KEY REFERENCES molecules(key) ON DELETE CASCADE,
        formula         TEXT,
        functions       TEXT,         -- JSON array
        primary_effects TEXT,         -- JSON object
        affects         TEXT,         -- JSON array
        notes           TEXT,
        extra           TEXT,         -- JSON: any additional fields (circadian_rhythm, synergies, etc.)
        kegg_id         TEXT,
        pubchem_cid     INTEGER,
        sources         TEXT,         -- JSON array
        enriched_at     TEXT,
        needs_review    INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS substances (
        key                 TEXT PRIMARY KEY,
        name                TEXT NOT NULL,
        de_name             TEXT,
        category            TEXT,
        relaxation_relevance TEXT,
        molecule_refs       TEXT,   -- JSON array of molecule keys
        curated             INTEGER DEFAULT 1,
        imported_at         TEXT    DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS substance_details (
        key            TEXT PRIMARY KEY REFERENCES substances(key) ON DELETE CASCADE,
        source_plant   TEXT,
        common_names   TEXT,   -- JSON array
        description    TEXT,
        traditional_use TEXT,  -- JSON array
        mechanism      TEXT,
        notes          TEXT,
        vault_file     TEXT,
        extra          TEXT,   -- JSON
        enriched_at    TEXT
      );

      CREATE TABLE IF NOT EXISTS interactions (
        key         TEXT PRIMARY KEY,
        mol1        TEXT,
        mol2        TEXT,
        type        TEXT,
        data        TEXT NOT NULL,  -- full JSON blob
        curated     INTEGER DEFAULT 1,
        imported_at TEXT    DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_inter_mol1 ON interactions(mol1);
      CREATE INDEX IF NOT EXISTS idx_inter_mol2 ON interactions(mol2);

      CREATE TABLE IF NOT EXISTS reactions (
        key         TEXT PRIMARY KEY,
        data        TEXT NOT NULL,  -- full JSON blob
        curated     INTEGER DEFAULT 1,
        imported_at TEXT    DEFAULT (datetime('now'))
      );
    `);
  }

  // ── Molecules ──────────────────────────────────────────────────────────────

  getMolecule(key) {
    const row = this.db.prepare(`
      SELECT m.*, md.formula, md.functions, md.primary_effects, md.affects,
             md.notes, md.extra, md.kegg_id, md.pubchem_cid, md.sources, md.enriched_at, md.needs_review
      FROM molecules m
      LEFT JOIN molecule_details md ON m.key = md.key
      WHERE m.key = ?
    `).get(key);
    return row ? this._parseMol(row) : null;
  }

  getAllMolecules() {
    const rows = this.db.prepare(`
      SELECT m.*, md.formula, md.functions, md.primary_effects, md.affects,
             md.notes, md.extra, md.kegg_id, md.pubchem_cid, md.sources, md.enriched_at
      FROM molecules m
      LEFT JOIN molecule_details md ON m.key = md.key
    `).all();
    return Object.fromEntries(rows.map(r => [r.key, this._parseMol(r)]));
  }

  searchMolecules(q) {
    const like = `%${q}%`;
    const rows = this.db.prepare(`
      SELECT m.*, md.formula, md.functions, md.primary_effects, md.affects, md.notes, md.extra
      FROM molecules m
      LEFT JOIN molecule_details md ON m.key = md.key
      WHERE m.key LIKE ? OR m.name LIKE ? OR m.de_name LIKE ? OR m.category LIKE ?
    `).all(like, like, like, like);
    return Object.fromEntries(rows.map(r => [r.key, this._parseMol(r)]));
  }

  upsertMolecule(key, indexData, detailData = null, curated = true) {
    this.db.prepare(`
      INSERT INTO molecules (key, name, de_name, category, relaxation_relevance, tags, found_in, curated)
      VALUES (@key, @name, @de_name, @category, @relaxation_relevance, @tags, @found_in, @curated)
      ON CONFLICT(key) DO UPDATE SET
        name = excluded.name, de_name = excluded.de_name,
        category = excluded.category, relaxation_relevance = excluded.relaxation_relevance,
        tags = excluded.tags, found_in = excluded.found_in
      WHERE molecules.curated = 0 OR @curated = 1
    `).run({
      key,
      name: indexData.name || key,
      de_name: indexData.de_name || null,
      category: indexData.category || null,
      relaxation_relevance: indexData.relaxation_relevance || null,
      tags: JSON.stringify(indexData.tags || []),
      found_in: JSON.stringify(indexData.found_in || []),
      curated: curated ? 1 : 0,
    });

    if (detailData) this.upsertMoleculeDetail(key, detailData, curated);
  }

  upsertMoleculeDetail(key, data, curated = false) {
    const existing = this.db.prepare(`SELECT curated FROM molecules WHERE key = ?`).get(key);
    if (existing?.curated && !curated) {
      console.warn(`[kb-db] Skipped pipeline overwrite of curated molecule "${key}"`);
      return false;
    }

    // Pull known extra fields into extra JSON
    const KNOWN = new Set(["formula", "functions", "primary_effects", "affects", "notes",
                            "kegg_id", "pubchem_cid", "sources", "needs_review",
                            "name", "de_name", "category", "relaxation_relevance", "tags", "found_in",
                            "_source", "_created_at", "_metadata"]);
    const extra = {};
    for (const [k, v] of Object.entries(data)) {
      if (!KNOWN.has(k)) extra[k] = v;
    }

    this.db.prepare(`
      INSERT INTO molecule_details
        (key, formula, functions, primary_effects, affects, notes, extra, kegg_id, pubchem_cid, sources, enriched_at, needs_review)
      VALUES
        (@key, @formula, @functions, @primary_effects, @affects, @notes, @extra, @kegg_id, @pubchem_cid, @sources, @enriched_at, @needs_review)
      ON CONFLICT(key) DO UPDATE SET
        formula = excluded.formula, functions = excluded.functions,
        primary_effects = excluded.primary_effects, affects = excluded.affects,
        notes = excluded.notes, extra = excluded.extra,
        kegg_id = excluded.kegg_id, pubchem_cid = excluded.pubchem_cid,
        sources = excluded.sources, enriched_at = excluded.enriched_at,
        needs_review = excluded.needs_review
    `).run({
      key,
      formula: data.formula || null,
      functions: JSON.stringify(data.functions || []),
      primary_effects: JSON.stringify(data.primary_effects || {}),
      affects: JSON.stringify(data.affects || []),
      notes: data.notes || null,
      extra: JSON.stringify(extra),
      kegg_id: data.kegg_id || null,
      pubchem_cid: data.pubchem_cid || null,
      sources: JSON.stringify(data.sources || []),
      enriched_at: new Date().toISOString(),
      needs_review: data.needs_review ? 1 : 0,
    });
    return true;
  }

  _parseMol(row) {
    const mol = {
      _key: row.key,
      name: row.name,
      de_name: row.de_name,
      category: row.category,
      relaxation_relevance: row.relaxation_relevance,
      tags: this._j(row.tags, []),
      found_in: this._j(row.found_in, []),
      _curated: !!row.curated,
    };
    if (row.formula !== undefined) {
      mol.formula = row.formula;
      mol.functions = this._j(row.functions, []);
      mol.primary_effects = this._j(row.primary_effects, {});
      mol.affects = this._j(row.affects, []);
      if (row.notes) mol.notes = row.notes;
      if (row.kegg_id) mol.kegg_id = row.kegg_id;
      if (row.pubchem_cid) mol.pubchem_cid = row.pubchem_cid;
      if (row.enriched_at) mol._enriched_at = row.enriched_at;
      Object.assign(mol, this._j(row.extra, {}));
    }
    return mol;
  }

  // ── Substances ─────────────────────────────────────────────────────────────

  getSubstance(key) {
    const row = this.db.prepare(`
      SELECT s.*, sd.source_plant, sd.common_names, sd.description, sd.traditional_use,
             sd.mechanism, sd.notes, sd.vault_file, sd.extra, sd.enriched_at
      FROM substances s
      LEFT JOIN substance_details sd ON s.key = sd.key
      WHERE s.key = ?
    `).get(key);
    return row ? this._parseSub(row) : null;
  }

  getAllSubstances() {
    const rows = this.db.prepare(`
      SELECT s.*, sd.source_plant, sd.common_names, sd.description, sd.traditional_use,
             sd.mechanism, sd.notes, sd.vault_file, sd.extra, sd.enriched_at
      FROM substances s
      LEFT JOIN substance_details sd ON s.key = sd.key
    `).all();
    return Object.fromEntries(rows.map(r => [r.key, this._parseSub(r)]));
  }

  searchSubstances(q) {
    const like = `%${q}%`;
    const rows = this.db.prepare(`
      SELECT s.*, sd.description, sd.source_plant, sd.notes, sd.extra
      FROM substances s
      LEFT JOIN substance_details sd ON s.key = sd.key
      WHERE s.key LIKE ? OR s.name LIKE ? OR s.de_name LIKE ? OR s.category LIKE ? OR sd.description LIKE ?
    `).all(like, like, like, like, like);
    return Object.fromEntries(rows.map(r => [r.key, this._parseSub(r)]));
  }

  upsertSubstance(key, indexData, detailData = null, curated = true) {
    this.db.prepare(`
      INSERT INTO substances (key, name, de_name, category, relaxation_relevance, molecule_refs, curated)
      VALUES (@key, @name, @de_name, @category, @relaxation_relevance, @molecule_refs, @curated)
      ON CONFLICT(key) DO UPDATE SET
        name = excluded.name, de_name = excluded.de_name,
        category = excluded.category, relaxation_relevance = excluded.relaxation_relevance,
        molecule_refs = excluded.molecule_refs
      WHERE substances.curated = 0 OR @curated = 1
    `).run({
      key,
      name: indexData.name || key,
      de_name: indexData.de_name || null,
      category: indexData.category || null,
      relaxation_relevance: indexData.relaxation_relevance || null,
      molecule_refs: JSON.stringify(indexData.references || []),
      curated: curated ? 1 : 0,
    });

    if (detailData) {
      const KNOWN_IDX = new Set(["name", "de_name", "category", "relaxation_relevance", "references",
                                  "source_plant", "common_names", "description", "traditional_use",
                                  "mechanism", "notes", "vault_file"]);
      const extra = {};
      for (const [k, v] of Object.entries(detailData)) {
        if (!KNOWN_IDX.has(k)) extra[k] = v;
      }
      this.db.prepare(`
        INSERT INTO substance_details
          (key, source_plant, common_names, description, traditional_use, mechanism, notes, vault_file, extra, enriched_at)
        VALUES
          (@key, @source_plant, @common_names, @description, @traditional_use, @mechanism, @notes, @vault_file, @extra, @enriched_at)
        ON CONFLICT(key) DO UPDATE SET
          source_plant = excluded.source_plant, common_names = excluded.common_names,
          description = excluded.description, traditional_use = excluded.traditional_use,
          mechanism = excluded.mechanism, notes = excluded.notes,
          vault_file = excluded.vault_file, extra = excluded.extra,
          enriched_at = excluded.enriched_at
      `).run({
        key,
        source_plant: detailData.source_plant || null,
        common_names: JSON.stringify(detailData.common_names || []),
        description: detailData.description || null,
        traditional_use: JSON.stringify(detailData.traditional_use || []),
        mechanism: detailData.mechanism || null,
        notes: detailData.notes || null,
        vault_file: detailData.vault_file || null,
        extra: JSON.stringify(extra),
        enriched_at: new Date().toISOString(),
      });
    }
  }

  _parseSub(row) {
    const sub = {
      _key: row.key,
      name: row.name,
      de_name: row.de_name,
      category: row.category,
      relaxation_relevance: row.relaxation_relevance,
      references: this._j(row.molecule_refs, []),
      _curated: !!row.curated,
    };
    if (row.source_plant !== undefined) {
      sub.source_plant = row.source_plant;
      sub.common_names = this._j(row.common_names, []);
      sub.description = row.description;
      sub.traditional_use = this._j(row.traditional_use, []);
      sub.mechanism = row.mechanism;
      sub.notes = row.notes;
      if (row.vault_file) sub.vault_file = row.vault_file;
      Object.assign(sub, this._j(row.extra, {}));
    }
    return sub;
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  getInteraction(mol1, mol2) {
    const row = this.db.prepare(`
      SELECT data FROM interactions WHERE key = ? OR key = ?
    `).get(`${mol1}_${mol2}`, `${mol2}_${mol1}`);
    return row ? this._j(row.data, null) : null;
  }

  getAllInteractions() {
    const rows = this.db.prepare(`SELECT key, data FROM interactions`).all();
    return Object.fromEntries(rows.map(r => [r.key, this._j(r.data, {})]));
  }

  upsertInteraction(key, data, curated = true) {
    const mols = data.molecules || [];
    this.db.prepare(`
      INSERT INTO interactions (key, mol1, mol2, type, data, curated)
      VALUES (@key, @mol1, @mol2, @type, @data, @curated)
      ON CONFLICT(key) DO UPDATE SET data = excluded.data, type = excluded.type
      WHERE interactions.curated = 0 OR @curated = 1
    `).run({
      key,
      mol1: mols[0] || null,
      mol2: mols[1] || null,
      type: data.type || null,
      data: JSON.stringify(data),
      curated: curated ? 1 : 0,
    });
  }

  // ── Reactions ──────────────────────────────────────────────────────────────

  getAllReactions() {
    const rows = this.db.prepare(`SELECT key, data FROM reactions`).all();
    return Object.fromEntries(rows.map(r => [r.key, this._j(r.data, {})]));
  }

  upsertReaction(key, data, curated = true) {
    this.db.prepare(`
      INSERT INTO reactions (key, data, curated)
      VALUES (@key, @data, @curated)
      ON CONFLICT(key) DO UPDATE SET data = excluded.data
      WHERE reactions.curated = 0 OR @curated = 1
    `).run({ key, data: JSON.stringify(data), curated: curated ? 1 : 0 });
  }

  // ── Utils ──────────────────────────────────────────────────────────────────

  isEmpty() {
    return this.db.prepare(`SELECT COUNT(*) as n FROM molecules`).get().n === 0;
  }

  stats() {
    return {
      molecules:         this.db.prepare(`SELECT COUNT(*) as n FROM molecules`).get().n,
      molecules_curated: this.db.prepare(`SELECT COUNT(*) as n FROM molecules WHERE curated=1`).get().n,
      molecule_details:  this.db.prepare(`SELECT COUNT(*) as n FROM molecule_details`).get().n,
      substances:        this.db.prepare(`SELECT COUNT(*) as n FROM substances`).get().n,
      substance_details: this.db.prepare(`SELECT COUNT(*) as n FROM substance_details`).get().n,
      interactions:      this.db.prepare(`SELECT COUNT(*) as n FROM interactions`).get().n,
      reactions:         this.db.prepare(`SELECT COUNT(*) as n FROM reactions`).get().n,
    };
  }

  _j(val, fallback) {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "object") return val;
    try { return JSON.parse(val); } catch { return fallback; }
  }
}

export const kbDb = new KnowledgeDB();
