"""Konfiguration, Pfade und Konstanten für den KB Enricher."""

from __future__ import annotations

import os
from pathlib import Path

# ── Pfade ────────────────────────────────────────────────────────────────────

# server/knowledge/kb_enricher/ → relax-dev/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_PATH = BASE_DIR / "data" / "kb.db"
ENV_FILE = Path.home() / ".env" / "relax.env"

# ── Env laden ────────────────────────────────────────────────────────────────


def load_env() -> None:
    """Lädt Schlüssel-Wert-Paare aus ENV_FILE in os.environ (kein Überschreiben)."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


load_env()

# ── Gemini ───────────────────────────────────────────────────────────────────

GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TEMPERATURE: float = 0.1
GEMINI_MAX_TOKENS: int = 2048
GEMINI_TIMEOUT_S: int = 60
GEMINI_RETRIES: int = 3

# ── Server ───────────────────────────────────────────────────────────────────

DEFAULT_PORT: int = int(os.environ.get("KB_ENRICHER_PORT", 9124))
DEFAULT_HOST: str = "127.0.0.1"

# ── Bekannte Molekülkeys (für Prompt-Kontext) ────────────────────────────────

KNOWN_MOL_KEYS: list[str] = [
    "cortisol", "serotonin", "dopamine", "gaba", "melatonin", "adenosine",
    "norepinephrine", "acetylcholine", "testosterone", "bdnf", "npy",
    "histamine", "glutamate", "il_10", "tnf_alpha", "nitric_oxide",
    "endorphins", "anandamide", "l_theanine", "glycine", "tryptophan",
    "magnesium", "linalool", "apigenin", "luteolin", "salidroside", "rosavin",
    "withanolide_a", "caffeic_acid", "epicatechin", "egcg", "rosmarinic_acid",
]
