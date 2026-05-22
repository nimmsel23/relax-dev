import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/cache.db");

class KBCache {
  constructor() {
    this.db = null;
  }

  open() {
    if (this.db) return;
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this._migrate();
  }

  _migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS external_cache (
        key        TEXT PRIMARY KEY,
        source     TEXT NOT NULL,
        data       TEXT NOT NULL,
        cached_at  INTEGER NOT NULL,
        ttl        INTEGER NOT NULL DEFAULT 604800
      );

      CREATE TABLE IF NOT EXISTS enriched_molecules (
        mol_key    TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        source     TEXT NOT NULL DEFAULT 'pubchem',
        fetched_at INTEGER NOT NULL
      );
    `);
  }

  // ── External API cache (PubChem, Psychonaut, etc.) ──────────────────────

  getCached(key) {
    this.open();
    const row = this.db.prepare(
      "SELECT data, cached_at, ttl FROM external_cache WHERE key = ?"
    ).get(key);
    if (!row) return null;
    const age = Math.floor(Date.now() / 1000) - row.cached_at;
    if (age > row.ttl) {
      this.db.prepare("DELETE FROM external_cache WHERE key = ?").run(key);
      return null;
    }
    return JSON.parse(row.data);
  }

  setCache(key, data, source = "api", ttl = 604800) {
    this.open();
    this.db.prepare(`
      INSERT OR REPLACE INTO external_cache (key, source, data, cached_at, ttl)
      VALUES (?, ?, ?, ?, ?)
    `).run(key, source, JSON.stringify(data), Math.floor(Date.now() / 1000), ttl);
  }

  // ── Enriched molecule storage ────────────────────────────────────────────

  getEnriched(molKey) {
    this.open();
    const row = this.db.prepare(
      "SELECT data FROM enriched_molecules WHERE mol_key = ?"
    ).get(molKey);
    return row ? JSON.parse(row.data) : null;
  }

  saveEnriched(molKey, data, source = "pubchem") {
    this.open();
    this.db.prepare(`
      INSERT OR REPLACE INTO enriched_molecules (mol_key, data, source, fetched_at)
      VALUES (?, ?, ?, ?)
    `).run(molKey, JSON.stringify(data), source, Math.floor(Date.now() / 1000));
  }

  listEnriched() {
    this.open();
    return this.db.prepare(
      "SELECT mol_key, source, fetched_at FROM enriched_molecules ORDER BY fetched_at DESC"
    ).all();
  }

  stats() {
    this.open();
    return {
      cached_entries: this.db.prepare("SELECT COUNT(*) as n FROM external_cache").get().n,
      enriched_molecules: this.db.prepare("SELECT COUNT(*) as n FROM enriched_molecules").get().n,
      db_path: DB_PATH,
    };
  }
}

export const kbCache = new KBCache();
