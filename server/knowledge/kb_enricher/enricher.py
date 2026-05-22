"""Core-Enrichment-Logik: Molekül aus DB holen → Gemini → Details zurückschreiben."""

from __future__ import annotations

import aiohttp
from loguru import logger

from . import db, gemini


async def enrich_molecule(key: str, dry_run: bool = False) -> dict:
    """Reichert ein Molekül mit Gemini-Daten an.

    Args:
        key:     Molekülschlüssel aus der KB (z.B. "cortisol").
        dry_run: Wenn True, wird nichts in die DB geschrieben.

    Returns:
        Dict mit ok: bool, key, fields_written (oder result bei dry_run).
    """
    mol = db.get_molecule(key)
    if not mol:
        return {"ok": False, "error": f"Molekül '{key}' nicht in KB"}

    label = mol.get("de_name") or mol.get("name") or key
    logger.info(f"Anreichere: {key} ({label})")

    async with aiohttp.ClientSession() as session:
        prompt = gemini.build_prompt(mol)
        result = await gemini.call_gemini(prompt, session)

    if not result:
        return {"ok": False, "error": "Gemini lieferte kein verwertbares Ergebnis"}

    result.setdefault("sources", ["gemini-enrichment"])
    result.setdefault("needs_review", True)

    if dry_run:
        return {"ok": True, "dry_run": True, "key": key, "result": result}

    ok = db.upsert_detail(key, result)
    return {
        "ok": ok,
        "key": key,
        "fields_written": [k for k, v in result.items() if v is not None],
    }


async def enrich_batch(keys: list[str], dry_run: bool = False) -> list[dict]:
    """Reichert mehrere Moleküle sequentiell an (Gemini-Rate-Limit schonen)."""
    results = []
    for key in keys:
        r = await enrich_molecule(key, dry_run)
        results.append(r)
    return results
