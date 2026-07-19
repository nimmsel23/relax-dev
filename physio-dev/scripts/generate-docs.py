#!/usr/bin/env python3
"""Generiert Physiologie Knowledge Base Docs via Gemini API."""

import json
import os
import sys
import urllib.request
from pathlib import Path


def load_env(path: Path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


load_env(Path.home() / ".env" / "gemini.env")

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def call_gemini(prompt: str, retries: int = 4) -> str:
    import time
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                API_URL,
                data=data,
                headers={"Content-Type": "application/json", "X-goog-api-key": API_KEY},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read())
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < retries - 1:
                wait = 2 ** (attempt + 1)
                print(f"  [{e.code}] Warte {wait}s...")
                time.sleep(wait)
            else:
                raise


TEMPLATE = """Erstelle ein Markdown-Dokument für eine Physiologie Knowledge Base eines Vitaltrainers (Ernährungs- + Entspannungstrainer, Österreich/DACH).

Thema: {topic}

Pflicht-Struktur (exakt so, Markdown, Deutsch, wissenschaftlich korrekt):

# {topic}

Kurze Definition (1–2 Sätze, präzise).

## Physiologische Funktion
Kernmechanismus, biochemisch korrekt, keine Vereinfachungen die falsch wären.

## Zusammenhang mit Kaffee/Koffein
Wie beeinflusst Koffein diesen Stoff / dieses System — mechanistisch, konkret.

## Relevanz Ernährung (→ fuel-dev)
Praktische Ernährungscoaching-Implikationen.

## Relevanz Entspannung/PNI (→ relax-dev)
Psychoneuroimmunologie-Relevanz, Stressachse, therapeutische Ansätze.

## Klienten-Erklärung
> Ein Absatz in Anführungszeichen, einfache Sprache für Klienten.

## Verweise
Liste von Links zu anderen Knowledge Base Files (z.B. `systems/hpa-achse.md`)

---
Zusatzkontext: {context}

WICHTIG: Nur das Markdown-Dokument ausgeben, keine Einleitung, kein Kommentar davor/danach.
"""

MAP_PROMPT = """Erstelle ein Markdown-Dokument: vollständige Physiologie-Map der Kaffee/Koffein-Wirkungen für eine Vitaltrainer Knowledge Base.

# Map: Kaffee — Physiologische Gesamtwirkung

## Kaskaden-Diagramm
Vollständiges ASCII-Diagramm: Koffein → alle betroffenen Systeme/Hormone/Neurotransmitter → Endwirkungen.

## Zeitverlauf nach Kaffeekonsum
Tabelle: Was passiert wann (0 min bis 8h). Adenosin-Blockade, Cortisol, Dopamin, Adrenalin, Crash, Melatonin-Suppression.

## Nüchtern vs. Nach Mahlzeit
Unterschiede in der physiologischen Antwort — konkret und mechanistisch.

## Optimales Timing (evidenzbasiert)
Wann trinken, wann aufhören, Dosis, Kontraindikationen.

## Querverweise
Alle beteiligten Knowledge Base Files.

Sprache: Deutsch. Präzise. Kein Marketing.
WICHTIG: Nur das Markdown-Dokument ausgeben, keine Einleitung davor.
"""

DOCS = [
    {
        "topic": "Adenosin",
        "path": "knowledge/neurotransmitters/adenosin.md",
        "context": "Adenosin ist der Primärmechanismus hinter Koffeinwirkung. Neuromodulator der Müdigkeit signalisiert (Sleep Pressure). Koffein = kompetitiver Antagonist an A1/A2A-Rezeptoren. Adenosin akkumuliert während Wachheit (Schlafhomöostase). Inkludiere: Rezeptortypen A1/A2A, Sleep Pressure, Toleranzentwicklung durch Rezeptor-Upregulation, Rebound-Müdigkeit nach Abbruch.",
    },
    {
        "topic": "Dopamin",
        "path": "knowledge/neurotransmitters/dopamin.md",
        "context": "Koffein erhöht Dopamin-Signaling indirekt: A2A-Adenosin-Rezeptoren sind mit D2-Dopamin-Rezeptoren im Striatum co-lokalisiert. Dopamin-Rolle in Motivation, Belohnung, Fokus. Toleranz/Abhängigkeit. Koffein + Dopamin = warum Kaffee motivierend wirkt. Präventive Aspekte: Koffein und Parkinson-Risiko (epidemiologisch).",
    },
    {
        "topic": "Adrenalin & Noradrenalin (Katecholamine)",
        "path": "knowledge/hormones/adrenalin-noradrenalin.md",
        "context": "Koffein stimuliert Katecholamin-Ausschüttung via Sympathikus. Adrenalin (Epinephrin) = systemisch (Herz, Lunge, Muskeln). Noradrenalin = neuronal + systemisch. Wirkungen: Herzrate ↑, Blutdruck ↑, Lipolyse, Bronchodilatation, Glukose-Mobilisierung aus Leber. Chronischer Konsum = dauerhaft erhöhter Sympathotonus. Nebennieren-Erschöpfung bei Überkonsum.",
    },
    {
        "topic": "Melatonin",
        "path": "knowledge/hormones/melatonin.md",
        "context": "Koffein supprimiert Melatonin-Produktion der Zirbeldrüse. Verzögert Melatonin-Onset um 40–120 min. Halbwertszeit Koffein 5–6h → Nachmittagskaffee stört Nachtschlaf erheblich. Inkludiere: zirkadiane Rhythmik, Licht + Melatonin, DLMO (Dim Light Melatonin Onset), Schlafphasen, Melatonin als Antioxidans.",
    },
    {
        "topic": "ANS — Autonomes Nervensystem",
        "path": "knowledge/systems/ans.md",
        "context": "ANS = Sympathikus (fight-or-flight) + Parasympathikus (rest-and-digest) + enterisches NS. Koffein aktiviert Sympathikus direkt via Adenosin-Blockade + Katecholamine. HRV als Messgröße für ANS-Balance. Vagusnerv als Haupt-Parasympathikus-Leitung. Polyvagal-Theorie (kurz). Atemübungen → Parasympathikus. Chronischer Koffein = HRV ↓.",
    },
    {
        "topic": "Darm-Hirn-Achse",
        "path": "knowledge/systems/darm-hirn-achse.md",
        "context": "Bidirektionale Kommunikation: Darm ↔ Gehirn via Vagusnerv, Hormone, Immunsystem, Mikrobiom-Metaboliten. Kaffee: Magensäure ↑, Motilität ↑, Chlorogensäuren als präbiotisch. Serotonin: 90% im Darm. Stressachse (HPA) ↔ Darm-Permeabilität (Leaky Gut). Mikrobiom-Grundlagen, Stress → Dysbiose.",
    },
]


def main():
    if not API_KEY:
        print("GEMINI_API_KEY nicht gesetzt.", file=sys.stderr)
        sys.exit(1)

    base = Path(__file__).parent.parent

    for doc in DOCS:
        out = base / doc["path"]
        out.parent.mkdir(parents=True, exist_ok=True)
        if out.exists():
            print(f"  skip {out.name} (existiert bereits)")
            continue
        print(f"Generiere {doc['path']}...")
        prompt = TEMPLATE.format(topic=doc["topic"], context=doc["context"])
        content = call_gemini(prompt)
        out.write_text(content)
        print(f"  ✓ {out.name}")

    map_out = base / "maps" / "kaffee-physiologie.md"
    map_out.parent.mkdir(parents=True, exist_ok=True)
    if not map_out.exists():
        print("Generiere maps/kaffee-physiologie.md...")
        map_out.write_text(call_gemini(MAP_PROMPT))
        print("  ✓ kaffee-physiologie.md")
    else:
        print("  skip kaffee-physiologie.md (existiert bereits)")

    print("\nAlle Docs generiert.")


if __name__ == "__main__":
    main()
