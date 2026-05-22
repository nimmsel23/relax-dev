"""SQLite-Helpers für den KB Enricher.

Liest aus und schreibt in data/kb.db (WAL-Modus).
Curated=1-Index-Einträge werden nie überschrieben.
COALESCE-Semantik beim Update: nur NULL-Felder werden befüllt.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from .config import DB_PATH


# ── Verbindung ────────────────────────────────────────────────────────────────


def _connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    return con


def _j(val, fallback=None):
    """Sicheres JSON.parse — gibt fallback zurück wenn val None oder kein gültiges JSON."""
    if val is None:
        return fallback
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return fallback


# ── Lesen ─────────────────────────────────────────────────────────────────────


def get_molecule(key: str) -> dict | None:
    """Gibt ein Molekül mit gemergten Index- und Detail-Feldern zurück."""
    con = _connect()
    try:
        row = con.execute("SELECT * FROM molecules WHERE key=?", (key,)).fetchone()
        if not row:
            return None
        mol = dict(row)
        mol["tags"] = _j(mol.get("tags"), [])
        mol["found_in"] = _j(mol.get("found_in"), [])

        det = con.execute(
            "SELECT * FROM molecule_details WHERE key=?", (key,)
        ).fetchone()
        if det:
            det = dict(det)
            for field in ("functions", "primary_effects", "affects"):
                det[field] = _j(det.get(field))
            extra = _j(det.get("extra"), {})
            if extra:
                mol.update(extra)
            mol.update({k: v for k, v in det.items() if k != "extra" and v is not None})
        return mol
    finally:
        con.close()


def list_needing_enrichment() -> list[dict]:
    """Moleküle ohne enriched_at-Timestamp (noch nie von Gemini bearbeitet)."""
    con = _connect()
    try:
        rows = con.execute(
            """
            SELECT m.key, m.name, m.de_name, m.category, m.curated,
                   d.formula, d.pubchem_cid, d.enriched_at
            FROM molecules m
            LEFT JOIN molecule_details d ON m.key = d.key
            WHERE d.enriched_at IS NULL
            ORDER BY m.curated DESC, m.category, m.name
            """
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        con.close()


def stats() -> dict:
    """Zählt Einträge pro Tabelle + Anzahl unangereichter Moleküle."""
    con = _connect()
    try:
        result: dict = {}
        for tbl in (
            "molecules", "molecule_details", "substances",
            "substance_details", "interactions", "reactions",
        ):
            result[tbl] = con.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        result["unenriched"] = con.execute(
            """
            SELECT COUNT(*) FROM molecules m
            LEFT JOIN molecule_details d ON m.key = d.key
            WHERE d.enriched_at IS NULL
            """
        ).fetchone()[0]
        return result
    finally:
        con.close()


# ── Schreiben ─────────────────────────────────────────────────────────────────

# Bekannte Detail-Felder (alles andere → extra JSON)
_KNOWN_FIELDS = frozenset({
    "formula", "pubchem_cid", "kegg_id", "functions",
    "primary_effects", "affects", "notes", "sources", "needs_review",
})


def upsert_detail(key: str, data: dict) -> bool:
    """Schreibt molecule_details für key.

    - Molecule muss existieren.
    - COALESCE: befüllt nur NULL-Felder (kein Überschreiben existierender Werte).
    - enriched_at wird immer auf jetzt gesetzt.
    - Felder außerhalb _KNOWN_FIELDS landen in extra (JSON).
    """
    con = _connect()
    try:
        if not con.execute(
            "SELECT 1 FROM molecules WHERE key=?", (key,)
        ).fetchone():
            return False

        extra = {k: v for k, v in data.items() if k not in _KNOWN_FIELDS}
        now = datetime.now(timezone.utc).isoformat()

        row_params = (
            data.get("formula"),
            json.dumps(data["functions"]) if data.get("functions") else None,
            json.dumps(data["primary_effects"]) if data.get("primary_effects") else None,
            json.dumps(data["affects"]) if data.get("affects") else None,
            data.get("notes"),
            json.dumps(extra) if extra else None,
            data.get("kegg_id"),
            data.get("pubchem_cid"),
            json.dumps(data.get("sources", ["gemini-enrichment"])),
            now,
            int(bool(data.get("needs_review", True))),
        )

        exists = con.execute(
            "SELECT 1 FROM molecule_details WHERE key=?", (key,)
        ).fetchone()

        if exists:
            con.execute(
                """
                UPDATE molecule_details SET
                    formula         = COALESCE(formula, ?),
                    functions       = COALESCE(functions, ?),
                    primary_effects = COALESCE(primary_effects, ?),
                    affects         = COALESCE(affects, ?),
                    notes           = COALESCE(notes, ?),
                    extra           = COALESCE(extra, ?),
                    kegg_id         = COALESCE(kegg_id, ?),
                    pubchem_cid     = COALESCE(pubchem_cid, ?),
                    sources         = COALESCE(sources, ?),
                    enriched_at     = ?,
                    needs_review    = ?
                WHERE key=?
                """,
                row_params + (key,),
            )
        else:
            con.execute(
                """
                INSERT INTO molecule_details
                    (key, formula, functions, primary_effects, affects, notes,
                     extra, kegg_id, pubchem_cid, sources, enriched_at, needs_review)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (key,) + row_params,
            )
        con.commit()
        return True
    finally:
        con.close()
