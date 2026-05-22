# KB Enricher

Python-Enrichment-Engine für die relax-dev Knowledge Base.  
Liest Moleküle aus `data/kb.db` (SQLite), fragt Gemini nach biochemischen Details und schreibt die Ergebnisse in `molecule_details` zurück.

## Architektur

```
kb_enricher/
├── config.py    — Pfade, Env-Loading, Gemini-Konstanten
├── db.py        — SQLite-Helpers (lesen/schreiben, COALESCE-Semantik)
├── gemini.py    — Gemini REST Client + Prompt-Builder (kein SDK)
├── enricher.py  — Core-Logik: enrich_molecule() / enrich_batch()
├── server.py    — aiohttp HTTP-Server :9124
├── cli.py       — typer CLI-Befehle
├── __init__.py  — Public API exports
└── __main__.py  — python -m Einstiegspunkt
```

## Voraussetzungen

```bash
python3 -c "import aiohttp, typer, loguru"   # alle verfügbar via yay
```

Gemini API Key in `~/.env/relax.env`:
```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

## CLI

```bash
# Von relax-dev root:
python -m server.knowledge.kb_enricher <befehl>

# Befehle:
serve                          # HTTP-Server auf :9124 starten
enrich cortisol                # Einzelnes Molekül anreichern
enrich magnesium --dry-run     # Vorschau (nichts in DB schreiben)
batch                          # Alle unangereicherten Moleküle
batch --limit 5                # Max. 5 Moleküle
status                         # DB-Stats + Enrichment-Übersicht
list                           # Unangereicherte Moleküle auflisten
```

## HTTP API (:9124)

```bash
http GET  :9124/health
http GET  :9124/status
http GET  :9124/molecules
http POST :9124/enrich          key=cortisol
http POST :9124/enrich          key=magnesium dry_run:=true
http POST :9124/batch-enrich    keys:='["cortisol","gaba"]'
http POST :9124/batch-enrich    # ohne keys → alle unangereicherten
```

## Datenfluss

```
molecule (key, name, category, tags, ...)    ← SQLite molecules-Tabelle
         ↓
    Gemini Prompt
         ↓
    Gemini REST API
         ↓
    JSON-Response (formula, pubchem_cid, functions, primary_effects, ...)
         ↓
    upsert_detail() — COALESCE: nur NULL-Felder befüllen
         ↓
molecule_details (formula, functions, primary_effects, enriched_at, ...)
```

## Design-Entscheidungen

**COALESCE-Semantik**: `upsert_detail()` überschreibt keine bestehenden Werte —
es werden nur NULL-Felder befüllt. So können manuell eingetragene Daten nicht
durch Gemini-Output überschrieben werden.

**enriched_at als Kriterium**: "Unangereichert" bedeutet `enriched_at IS NULL`,
nicht `formula IS NULL`. Moleküle ohne Summenformel (Peptide, Zytokine) gelten
nach dem ersten Gemini-Aufruf als angereichert.

**Kein SDK**: Gemini wird via direktem HTTP-Request (aiohttp) angesprochen —
kein `google-generativeai` Package nötig. API Key aus `~/.env/relax.env`.

**Retry-Logik**: Bei HTTP 503 oder Timeout bis zu 3 Versuche mit 5/10/15s Pause.

**extra-Feld**: Felder die nicht im DB-Schema stehen (z.B. `circadian_rhythm`,
`synergies`) landen als JSON-Blob in `molecule_details.extra`.

## Erweiterung

Neuen CLI-Befehl hinzufügen: in `cli.py` eine Funktion mit `@cli.command()` dekoieren.

Neuen HTTP-Endpunkt hinzufügen: Handler-Funktion in `server.py`, Route in `make_app()`.

Anderen Prompt verwenden: `gemini.build_prompt()` anpassen oder eine zweite
Prompt-Funktion schreiben und in `enricher.py` referenzieren.
