"""Gemini REST Client und Prompt-Builder für KB-Enrichment.

Verwendet aiohttp für direkte REST-Calls (kein SDK erforderlich).
Retry-Logik: bis zu GEMINI_RETRIES Versuche bei 503/Timeout.
JSON-Bereinigung: entfernt Markdown-Fences, C-Kommentare, Trailing Commas.
"""

from __future__ import annotations

import asyncio
import json
import re

import aiohttp
from loguru import logger

from .config import (
    GEMINI_API_KEY,
    GEMINI_MAX_TOKENS,
    GEMINI_MODEL,
    GEMINI_RETRIES,
    GEMINI_TEMPERATURE,
    GEMINI_TIMEOUT_S,
    KNOWN_MOL_KEYS,
)

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


# ── Prompt ────────────────────────────────────────────────────────────────────


def build_prompt(mol: dict) -> str:
    """Erstellt den Gemini-Prompt für ein Molekül aus dem KB."""
    tags = ", ".join(mol.get("tags") or [])
    found_in = ", ".join(mol.get("found_in") or [])
    known_keys = ", ".join(KNOWN_MOL_KEYS)

    return f"""Du bist ein Biochemie-Experte mit Fokus auf Psychoneuroimmunologie (PNI).

Analysiere das folgende Molekül und liefere biochemische Details als JSON.
Kontext: relax-dev KB — Fokus auf Stress, Relaxation, Schlaf, Neurotransmitter, Entzündung.

Molekül:
  key:      {mol["key"]}
  name:     {mol.get("name", "?")}
  de_name:  {mol.get("de_name", "?")}
  category: {mol.get("category", "?")}
  rel_rel:  {mol.get("relaxation_relevance", "?")}
  tags:     {tags or "–"}
  found_in: {found_in or "–"}

Gib NUR gültiges JSON zurück (kein Markdown, keine Kommentare):
{{
  "formula": "C10H12N2O",
  "pubchem_cid": 5978,
  "kegg_id": "C00483",
  "functions": ["Funktion 1", "Funktion 2"],
  "affects": ["cortisol", "gaba"],
  "primary_effects": {{
    "cortisol": {{"direction": "decrease", "mechanism": "Kurztext max. 80 Zeichen"}},
    "gaba": {{"direction": "increase", "mechanism": "..."}}
  }},
  "notes": "PNI-Kontext: Timing, klinische Relevanz, Besonderheiten."
}}

Für `affects` + `primary_effects` nur Keys aus dieser Liste verwenden (wenn biochemisch korrekt):
{known_keys}

Felder weglassen wenn unbekannt. Antworte ausschließlich mit dem JSON-Objekt."""


# ── JSON-Bereinigung ─────────────────────────────────────────────────────────


def clean_json(text: str) -> str:
    """Bereinigt Gemini-Ausgabe: Markdown-Fences, C-Kommentare, Trailing Commas."""
    # Markdown-Fences entfernen
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])
    if "```" in text:
        text = text[: text.rfind("```")].rstrip()
    # // Zeilenkommentare entfernen (naiv, reicht für Gemini-Output)
    text = re.sub(r"//[^\n\"]*\n", "\n", text)
    # Trailing Commas vor } oder ] entfernen
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    return text.strip()


# ── REST Client ───────────────────────────────────────────────────────────────


async def call_gemini(
    prompt: str,
    session: aiohttp.ClientSession,
) -> dict | None:
    """Sendet prompt an Gemini, gibt geparste JSON-Antwort zurück oder None bei Fehler."""
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY nicht gesetzt — Enrichment übersprungen")
        return None

    url = f"{_GEMINI_BASE}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": GEMINI_TEMPERATURE,
            "maxOutputTokens": GEMINI_MAX_TOKENS,
        },
    }
    text = ""
    for attempt in range(1, GEMINI_RETRIES + 1):
        try:
            async with session.post(
                url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=GEMINI_TIMEOUT_S),
            ) as resp:
                if resp.status == 503:
                    wait = attempt * 5
                    logger.warning(
                        f"Gemini 503 — Versuch {attempt}/{GEMINI_RETRIES}, warte {wait}s"
                    )
                    await asyncio.sleep(wait)
                    continue
                if resp.status != 200:
                    body = await resp.text()
                    logger.error(f"Gemini HTTP {resp.status}: {body[:300]}")
                    return None
                data = await resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                text = clean_json(text)
                return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Gemini JSON-Parse-Fehler: {e}")
            return None
        except Exception as e:
            logger.error(f"Gemini-Fehler: {type(e).__name__}: {e}")
            if attempt < GEMINI_RETRIES:
                await asyncio.sleep(attempt * 3)

    logger.error(f"Gemini: alle {GEMINI_RETRIES} Versuche fehlgeschlagen")
    return None
