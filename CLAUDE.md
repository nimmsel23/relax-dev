# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**relax-dev** — Standalone Relax Centre application for relaxation techniques, stress management, and personal wellness tracking. Self-contained React/Vite frontend + Node.js backend with file-based data storage (no database).

**Leitplanke**: **Psychoneuroimmunologie (PNI)** — die wissenschaftliche Grundlage des Projekts. Stressphysiologie (HPA-Achse, Cortisol), Neurotransmitter (GABA, Serotonin, Dopamin), Immunmodulation (IL-10, Inflammation) und deren Wechselwirkungen mit Relaxationstechniken und Substanzen. Alle Features bauen auf diesem Rahmen auf.

**Status**: Active development. Dual-catalog KB + SQLite-Layer + Vault integration + cross-substance graph + Python Enrichment-Engine implementiert. Physio Timeline (PNI-Simulation) ist das nächste Major Feature.

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite (:5904), Tailwind CSS + custom CSS variables
- **Backend**: Node.js HTTP server (`server.mjs`, :9123), SQLite für KB-Daten, file-based für Sessions/Journal
- **UI Components**: lucide-react for icons, reactflow for graph, marked for markdown rendering
- **Theming**: Catppuccin-inspired (mocha/latte), CSS variable-driven

### Port Convention
| Service | Port | Dev Path |
|---------|------|----------|
| Vite (UI) | 5904 | `npm run ui:dev` (or via dev-runner) |
| Node API | 9123 | `npm run start` (or via dev-runner) |
| KB Enricher (Python) | 9124 | `python server/knowledge/kb_enricher.py serve` |

**Wichtig**: Im Dev-Betrieb immer über `:5904` zugreifen (Vite + HMR). `:9123` direkt serviert nur `dist/` — Änderungen ohne Build unsichtbar.

### Knowledge Base Architecture (Dual-Catalog)

**Konzept**: Bidirektionales Mapping zwischen Herbal Substances (user-facing) und biochemischen Molekülen (wissenschaftliche Ebene). Fundament ist PNI — jede Substanz wirkt über Moleküle auf Neurotransmitter, Hormone oder Immunmediatoren.

### Zwei-Schichten-Architektur (KB)

**YAML = dünner kuratierter Index** (menschlich editierbar, Source of Truth für Kuration):
- `knowledge/substance.catalog.yaml` — Index-Felder: name, de_name, category, relaxation_relevance, references (→ molecule keys)
- `knowledge/molecule.catalog.yaml` — Index-Felder: name, de_name, category, relaxation_relevance, tags, found_in (→ substance keys)
- `knowledge/interactions.yaml` — Molekül-Interaktionen (bleiben vollständig in YAML + SQLite)
- `knowledge/reactions.yaml` — Physiologische Kaskaden (bleiben vollständig in YAML + SQLite)

**SQLite = operationale DB** (`data/kb.db`, WAL-Modus):
- `molecules` + `molecule_details` — Index getrennt von Details (formula, primary_effects, functions, affects, notes, kegg_id, pubchem_cid, sources)
- `substances` + `substance_details` — Index getrennt von Details (source_plant, description, traditional_use, mechanism, vault_file)
- `interactions`, `reactions` — vollständige JSON-Blobs
- `curated=1` Einträge (aus YAML importiert) sind write-protected für die Pipeline
- Auto-Import: beim Serverstart, wenn DB leer → YAML wird automatisch importiert
- Re-Import: `node scripts/migrate-yaml-to-sqlite.mjs [--force]`

**Bestände** (Stand 2026-05-19): 11 Substances, 38 Molecules (inkl. Testosteron), 33 Interactions (inkl. Cortisol↔Testosteron), 12 Reactions

**Dispatcher** (`kb-loader.js`):
- Liest ausschließlich aus SQLite via `kb-db.js`
- `dispatchQuery(query)` — routes to substance or molecule expansion
- `expandSubstance(query)` — substance + referenced plant compounds + endogenous targets (GABA, Cortisol etc.) mit `via`-Metadata
- `expandMolecule(query)` — molecule + substances containing it + related molecules
- `buildMoleculeHub(molKey)` — cross-substance graph: welche Substances beeinflussen dieses Molekül
- `buildNetworkGraph()` — alle Moleküle als Nodes, Edges aus interactions + primary_effects
- In-memory Name→Key Index für O(1) Lookups, wird bei Writes invalidiert

**Endogene Targets vs. Pflanzenmoleküle**:
- Neurotransmitter/Hormone/Mineralien (category: neurotransmitter|hormone|amino_acid|mineral|...) = Graph-Nodes (Ziele)
- Pflanzliche Alkaloide/Flavonoide = Kanten-Labels (Vermittler), keine eigenen Graph-Nodes

**Frontend**: Knowledge Graph (`KnowledgeGraph.jsx`) mit Reactflow — 4 Modi:
- **overview**: alle Substances als Grid, klickbar
- **expanded**: eine Substance → endogene Targets (GABA, Kortisol) mit Pflanzenmolekül als Kantenbezeichnung
- **hub**: Molekül als Zentrum (rot), alle Substances die es beeinflussen oben, verwandte Moleküle unten
- **network**: alle 38 Moleküle als Nodes (kategorie-geclustert), Edges aus interactions + primary_effects

**API** (`/api/knowledge/*`):
- `GET /api/knowledge/expand?q=...` — dispatcher (detects substance or molecule)
- `GET /api/knowledge/expand/substance/:id` — substance expansion
- `GET /api/knowledge/expand/molecule/:id` — molecule expansion
- `GET /api/knowledge/hub/:id` — molecule hub: alle Substances + Moleküle die es beeinflussen
- `GET /api/knowledge/vault/:id` — passendes Vault-Markdown für Substance oder Molecule
- `GET /api/knowledge/interaction?mol1=...&mol2=...` — interaction lookup (with AI generation fallback)
- `GET /api/knowledge/search?q=...` — cross-catalog search
- `GET /api/knowledge/health` — KB status
- All others: `/substances`, `/molecules`, `/interactions`, `/reactions`

### Vault Integration

**Sources** (`server/knowledge/vault-search.js`):
- `~/Vitaltrainer/Sportkompetenz/Endokrinologie/` — Hormone, Neurotransmitter (Dopamin, Kortisol, Melatonin, HPA-Achse...)
- `~/Vitaltrainer/Sportkompetenz/Biochemie/Supplemente/` — KSM-66 Ashwagandha, Koffein, Kreatin...
- `~/Vitaltrainer/Sportkompetenz/Physiologie/` — Amygdala, Hippocampus, ZNS...
- `~/Vitaltrainer/Dipl.Entspannungstrainer/` — Entspannungsprotokolle, PMR, Atemschulung
- `~/BODY/Kräuter/` — Kräuterprofile (Mulungu, Passionsblume, Lavendel...)

**Matching**: Name-Score (de_name → name → key, first-word fallback) — kein Hardcoding von Pfaden.

**Obsidian-Syntax**:
- `[[wikilinks]]` → im Vault-Tab als klickbare Spans gerendert, Klick öffnet passendes Substance-Modal
- `[[wikilinks]]` werden beim Indexieren auch als Relation-Map extrahiert (entry.links)
- Tags (#cortisol, #Kräuter etc.) sind in Vault-Notes inkonsistent — nicht als primären Linker nutzen. `[[links]]` sind zuverlässiger.

**Vault-Tab im Modal**: Dritter Tab in SubstanceCatalog-Modal nach Übersicht + Moleküle.

### Data Structure
```
data/
  kb.db                        # SQLite: KB-Katalog (molecules, substances, interactions, reactions)
  cache.db                     # SQLite: API-Cache (PubChem, KEGG, Psychonaut) + enriched molecules
  sessions/YYYY-MM-DD.json     # {date, items: [{id, technique, minutes, mood_before, mood_after, note}], saved_at}
  journal/YYYY-MM-DD.md        # Markdown entries, one file per day
  theme.json                   # {theme: "mocha" | "latte"}
```

### Core Backend (server.mjs)
Single-file HTTP API server (no frameworks, native Node.js):
- **Static serving**: `dist/` (prod build) → fallback to `public/`
- Routes delegieren an `server/routes/knowledge.js` für `/api/knowledge/*`

**Session & Journal**:
  - `GET /health` — Service health check
  - `GET /techniques` — Available relaxation techniques (hardcoded list)
  - `GET /session?date=YYYY-MM-DD` — Fetch session data
  - `POST /session` — Save session items
  - `GET /session/history?limit=10` — Last N sessions
  - `GET /session/latest` — Most recent session
  - `GET /journal?date=...` — Fetch markdown entry
  - `POST /journal` — Save markdown entry
  - `GET /journal/list` — List 50 most recent entries
  - `GET /stats/summary?days=14` — Aggregated stats
  - `GET /export/csv?days=14` — CSV download
  - `GET /theme` / `POST /theme` — Theme preference

Environment variables:
- `PORT` (default 9123)
- `HOST` (default 127.0.0.1)
- `RELAX_STATIC_DIR` (override static root, defaults to dist/ or public/)
- `GEMINI_API_KEY` (loaded from `~/.env/relax.env`)
- `GEMINI_MODEL` (default `gemini-2.5-flash`, loaded from `~/.env/relax.env`)

### Frontend (React/Vite)
**Views** (tab-based in `src/views/`):
1. **Dashboard** — Daily overview, today's quick stats
2. **Session** — Log relaxation techniques with timing and mood tracking
3. **Journal** — Write/edit markdown journal entries
4. **Stats** — View aggregated summaries
5. **SubstanceCatalog** — Substances als Basis (nicht Molecules). Modal: Übersicht / Moleküle / Vault-Tab. `[[wikilinks]]` im Vault-Tab navigierbar. List ↔ Graph toggle.

**Theme system**: CSS custom properties (`data-theme` auf `<html>`):
- `--bg`, `--ink`, `--glass`, `--card`, `--line`, `--muted`, `--dim`, `--accent`
- Toggled via top-right button; persisted via `/theme` endpoint

**Mobile-first design**: Bottom navigation, Glassmorphism header, safe area padding.

## Development

### Running
```bash
# Both UI + API together (recommended)
cd ~/relax-dev && npm run dev

# Access via :5904 (Vite HMR) — not :9123
```

The **dev runner** (`scripts/dev-runner.mjs`) starts both services in parallel:
- API: nodemon watches `server.mjs` AND `server/` (routes + knowledge) — restart bei Backend-Änderungen automatisch
- Vite: HMR auf Source-Änderungen
- Änderungen an `dev-runner.mjs` selbst erfordern manuellen Neustart

**KB Enricher** (Python, optional, separat starten):
```bash
# Von relax-dev root (python -m wegen Paket-Imports):
python -m server.knowledge.kb_enricher serve          # HTTP :9124
python -m server.knowledge.kb_enricher enrich cortisol
python -m server.knowledge.kb_enricher batch --limit 5
python -m server.knowledge.kb_enricher status
```

### Vite Proxy
`/api`, `/session`, `/journal`, `/stats`, `/techniques`, `/export`, `/theme`, `/health` → `:9123`

### Building
```bash
npm run build   # Vite build → dist/
```
Production: `node server.mjs` serves `dist/`.

## Key Design Notes

- **Kein Framework** im Backend (raw Node.js) — minimal, schnell, single-file
- **Kein UI-Framework** (kein shadcn, kein MaterialUI) — Tailwind + CSS variables, leichtgewichtig halten
- **SQLite für KB** (`better-sqlite3`, sync, WAL) — KB-Katalog und API-Cache; Sessions/Journal bleiben file-based
- **YAML = Authoring, SQLite = Betrieb** — YAML manuell editieren, SQLite per Migration importieren; nie direkt YAML zur Laufzeit schreiben
- **Pipeline schreibt nur Detail-Tabellen** — `curated=1` Index-Einträge sind write-protected; Gemini kann Details anreichern, nie kuratierte Einträge überschreiben
- **`marked`** für Markdown-Rendering (Vault-Tab) — bereits installiert
- **`reactflow`** für Graph-Visualisierung — bereits installiert

## Testing API
```bash
http GET :9123/api/knowledge/hub/cortisol
http GET :9123/api/knowledge/vault/mulungu
http GET ':9123/api/knowledge/expand?q=ashwagandha'
http GET ':9123/api/knowledge/health'
http GET ':9123/api/knowledge/network'
http GET ':9123/api/knowledge/interaction?mol1=cortisol&mol2=testosterone'
# KB-DB neu importieren (nach YAML-Änderungen):
node scripts/migrate-yaml-to-sqlite.mjs --force
```

## Planned Feature: Physio Timeline (PNI-Simulation)

Das zentrale nächste Feature — direkter Ausdruck der PNI-Leitplanke:

> **Physiological Simulation System** — Modelliert Kortisol, Dopamin, Glukose-Kurven als Reaktion auf Lifestyle-Events (Kaffee, Training, Mulungu, Fasten) mit Kontext-Modifikatoren (nüchtern, Schlafdefizit, Stresslevel).

**Architecture**:
```
Backend: POST /api/physio/simulate → deterministisches Simulations-Engine (pure functions, kein ML)
Frontend: Physio-Timeline View → Event-Panel + @nivo/line Chart (3 Kurven gleichzeitig)
```

**Datenquellen** (dokumentiert in `HOT.md`):
- PubChem REST — Moleküldaten
- Psychonaut Wiki — Onset/Duration/Intensity-Kurven
- HMDB — endogene Biochemie (Kortisol, Dopamin, Serotonin)
- DSLD (NIH) — Supplement-Daten (Adaptogene, Mikronährstoffe)

**Bezug zu PNI**: HPA-Achse (Kortisol-Kurve), autonomes Nervensystem (Dopamin/Adenosin), Nährstoff-Timing (Glukose + Insulin → Tryptophan → Serotonin).

## File Manifest

### Root & Config
- `package.json` — dependencies: React, Vite, Tailwind, lucide-react, reactflow, marked, @google/generative-ai
- `vite.config.js` — Vite + proxy config
- `CLAUDE.md` — This file
- `HOT.md` — Open-source Datenquellen + Node-Module für Physio-Simulation

### Knowledge Base Data
- `knowledge/substance.catalog.yaml` — 11 kuratierte Substanzen
- `knowledge/molecule.catalog.yaml` — 38 biochemische Moleküle (inkl. Testosteron)
- `knowledge/interactions.yaml` — 33 Molekül-Interaktionen (inkl. PNI-Kaskaden)
- `knowledge/reactions.yaml` — 12 physiologische Reaktionskaskaden

### Backend
- `server.mjs` — Single-file Node.js HTTP server
- `scripts/dev-runner.mjs` — Parallel dev launcher (nodemon + Vite)
- `scripts/migrate-yaml-to-sqlite.mjs` — YAML → SQLite Migration (einmalig oder `--force`)
- `server/routes/knowledge.js` — Knowledge Base API (`/api/knowledge/*`)
- `server/knowledge/kb-db.js` — SQLite-Layer (better-sqlite3): Schema, CRUD, curated-Guard
- `server/knowledge/kb-loader.js` — Dispatcher + Hub-Builder + Graph; liest ausschließlich via kb-db
- `server/knowledge/kb-cache.js` — SQLite API-Cache (PubChem/KEGG/Psychonaut TTL-Cache)
- `server/knowledge/vault-search.js` — Vault-Index, Name-Matching, Obsidian-Sanitizer
- `server/knowledge/enricher-pipeline.js` — PubChem + KEGG + Psychonaut → Gemini → KB-Detail (Node.js, via `/api/knowledge/enrich`)
- `server/knowledge/kb_enricher/` — Python Enrichment-Engine :9124 (modulares Paket)
  - `config.py` — Env-Loading, Gemini-Konstanten, Pfade
  - `db.py` — SQLite-Helpers (COALESCE-Semantik, enriched_at-Kriterium)
  - `gemini.py` — Gemini REST Client + Prompt-Builder (kein SDK)
  - `enricher.py` — Core-Logik: enrich_molecule() / enrich_batch()
  - `server.py` — aiohttp HTTP-Server + Route-Handler
  - `cli.py` — typer CLI (serve/enrich/batch/status/list)
  - `README.md` — Doku, Design-Entscheidungen, Erweiterungs-Guide
- `server/knowledge/pubchem.js` — PubChem REST Client (CID, formula, pharmacology)
- `server/knowledge/kegg.js` — KEGG REST Client (Compound-ID, Pathway-Namen)
- `server/knowledge/psychonaut.js` — Psychonaut Wiki GraphQL (Onset/Peak/Duration)

### Frontend
- `src/views/SubstanceCatalog.jsx` — Substances-Liste + Graph-Toggle + Modal (Übersicht/Moleküle/Vault)
- `src/components/KnowledgeGraph.jsx` — Reactflow: overview / expanded / hub Modi
- `src/styles.css` — Catppuccin CSS variables + `.vault-markdown` + `.vault-link` styles

## Notes for Future Sessions

- **PNI-Leitplanke**: Psychoneuroimmunologie ist der inhaltliche Rahmen. Kortisol, GABA, HPA-Achse, Vagaltonus, Entzündungs-Depression-Kaskade — alles hängt zusammen. Beim Erweitern des KB immer fragen: wie passt das ins PNI-Bild?
- **Katalog-Status**: 11 Substances, 38 Molecules (inkl. Testosteron), 33 Interactions — kuratiert auf eigene Erfahrung. Neue Substanzen nur hinzufügen wenn tatsächlich genutzt.
- **YAML editieren → Migration**: Nach manuellen YAML-Änderungen immer `node scripts/migrate-yaml-to-sqlite.mjs --force` ausführen, damit SQLite aktuell bleibt.
- **Vault-Notes**: Obsidian-Vault `~/Vitaltrainer/` (Symlink auf `~/Dokumente/Vitaltrainer/`). `[[links]]` sind konsistenter als `#tags`. Vault-Files können KB-Frontmatter bekommen: `kb_key`, `category`, `formula`, `kb_interactions`.
- **KB Enricher (Python)**: `server/knowledge/kb_enricher/` (Paket). Start: `python -m server.knowledge.kb_enricher serve`. Gemini REST direkt (kein SDK). `enriched_at IS NULL` = noch nicht angereichert. COALESCE-Semantik. 503-Retry (3x). Immer von relax-dev root aufrufen.
- **Nächste Features**: Physio Timeline (PNI-Simulation). `HOT.md` enthält Datenquellen-Recherche.
- **Keine UI-Framework-Creep**: Tailwind + CSS variables reicht. Nicht shadcn/MUI einführen.
- **Gemini AI**: Optional für KB-Enrichment. Key in `~/.env/relax.env`. Pipeline schreibt in `molecule_details`, nie in kuratierte Index-Einträge.

---

## Dispatcher

Jedes neue Skript/Tool in diesem Repo gehört als Option in den zentralen Dispatcher — nicht als loses Standalone-Script.
Bei Bash vs. Python: Python bevorzugen. Deps: `typer` + `loguru` + `gum`-Fallback für TUI.
Referenz-Implementierung: `~/aos-dev/bin/bridge-devctl menu`

| Dispatcher | Typ | Funktion |
|---|---|---|
| `relax` | python3 | Relax Service-Dispatcher (typer-basiert) — **Haupteinstieg** |

`relax` ist bereits Python/typer — alle neuen Befehle hier als typer-Commands einbauen, kein separates Skript.
