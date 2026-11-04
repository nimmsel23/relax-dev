# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**relax-dev** — App für das Entspannungstrainer-Fachmodul der Präventiven Vitaltrainer-Ausbildung, ergänzt um persönliche Praxis- und Trackingbereiche. Der Modul-Tab ist der Standard-Einstieg. React/Vite-Frontend; die Relax FastAPI-Routen laufen in Coach :9150. Session- und Journaldaten bleiben dateibasiert, die optionale Knowledge Base nutzt SQLite.

**Inhaltliche Leitplanke**: Für Ausbildungsinhalte haben die lokalen Kurs-PDFs Vorrang. Kursaussagen werden als solche kenntlich gemacht. Zusätzliche biochemische Modelle oder Katalogdaten sind kein Beleg für individuelle Wirkungen und dürfen nicht als Diagnose, Messung oder Trainerempfehlung erscheinen.

**Status**: Active development. Der Ausbildungsablauf mit Grundlagen, Methoden, Stundenentwurf, Fallaufgabe und Praxisnachweis ist der Produktfokus. Knowledge Base, Physiologie-Ansicht und Katalog sind unterstützende Zusatzbereiche.

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite (:5903), Tailwind CSS + custom CSS variables
- **Backend**: Relax FastAPI-Routen in Coach (`server.py`, :9150); SQLite für KB-Daten, Dateien für Sessions/Journal
- **UI Components**: lucide-react for icons, reactflow for graph, marked for markdown rendering
- **Theming**: Catppuccin-inspired (mocha/latte), CSS variable-driven

### Port Convention
| Service | Port | Dev Path |
|---------|------|----------|
| Vite (UI) | 5903 | `pnpm run ui:dev` (only UI) |
| Coach API + Relax routes | 9150 | `coach-server start` |
| KB Enricher (Python) | 9124 | `python server/knowledge/kb_enricher.py serve` |

**Wichtig**: Im Dev-Betrieb `:5903` für Vite verwenden. Coach stellt Relax-Routen unter `/relax-api/*` und `/api/relax/*` bereit.

### Knowledge Base Architecture (Dual-Catalog)

**Konzept**: Optionale Knowledge Base mit bidirektionalem Mapping zwischen Herbal Substances (user-facing) und biochemischen Molekülen. Sie ist ein eigenständiger Zusatzbereich und keine Ausbildungsquelle oder Grundlage für individuelle Wirkungsversprechen.

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

### Relax API (server.py)
FastAPI application mounted inside Coach on :9150. Relax keeps ownership of session files, journal entries, theme, physiology simulation, and the Knowledge Base.

**Session & Journal**:
  - `GET /health` — Service health check
  - `GET /techniques` — Available relaxation techniques (hardcoded list)
  - `GET /session?date=YYYY-MM-DD` — Fetch session data
  - `POST /session` — Save session items
  - `GET /session/history?limit=10&before=YYYY-MM-DD` — Sessions before an optional date cursor (exclusive), newest first; request earlier pages with the last returned date
  - `GET /session/latest` — Most recent session
  - `GET /journal?date=...` — Fetch markdown entry
  - `POST /journal` — Save markdown entry
  - `GET /journal/list` — List 50 most recent entries
  - `GET /stats/summary?days=14` — Aggregated stats
  - `GET /export/csv?days=14` — CSV download
  - `GET /theme` / `POST /theme` — Theme preference

Environment variables:
- `COACH_API_URL` (default `http://127.0.0.1:9150`)
- `RELAX_STATIC_DIR` (override static root, defaults to dist/ or public/)
- `GEMINI_API_KEY` (loaded from `~/.env/relax.env`)
- `GEMINI_MODEL` (default `gemini-2.5-flash`, loaded from `~/.env/relax.env`)

### Frontend (React/Vite)
**Views** (tab-based in `src/views/`):
1. **Dashboard** — Daily overview, today's quick stats
2. **Session** — Log relaxation techniques with timing and mood tracking
2b. **Breath** (`#atem`) — Atem-Tab: Kategorien (Beruhigen/Schlaf/Fokus/Energie/SOS), Muster-Karten mit PNI-Erklärung, immersiver Orb-Visualizer (`components/breath/BreathPlayer.jsx`), Abschluss loggt nach Stimmungsabfrage ins Session-Log. Muster + Timing-Logik (`phaseAt`) liegen rein datengetrieben in `src/lib/breath/patterns.js` (Test: `tests/breath.test.mjs`). Neues Muster = ein Eintrag in `PATTERNS`. **Nicht `src/data/` nutzen** — von `.gitignore` (`data/`) verschluckt.
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
# UI only; Coach provides the API on :9150
cd ~/relax-dev && pnpm run dev

# Access via :5903 (Vite HMR); API routes are in Coach :9150
```

The **dev runner** (`scripts/dev-runner.mjs`) starts Vite only. Relax API changes require restarting the shared Coach service; the runner never creates another API server.

**KB Enricher** (Python, optional, separat starten):
```bash
# Von relax-dev root (python -m wegen Paket-Imports):
python -m server.knowledge.kb_enricher serve          # HTTP :9124
python -m server.knowledge.kb_enricher enrich cortisol
python -m server.knowledge.kb_enricher batch --limit 5
python -m server.knowledge.kb_enricher status
```

### Vite Proxy
Vite rewrites `/api/*` and Relax root routes to Coach :9150; the API is mounted at `/api/relax/*` and `/relax-api/*`.

### Cloud-Entwicklung / frischer Checkout
Das Repo ist ohne diesen Rechner lauffähig: `corepack enable && bash scripts/ci-install.sh`, dann `pnpm test` und `pnpm run build`. Relax API-Routen laufen in Coach :9150. `pnpm-lock.yaml` ist eingecheckt (CI installiert mit `--frozen-lockfile`, bei Änderungen an `package.json` mit committen); kein eingechecktes `pnpm-workspace.yaml`, `scripts/ci-install.sh` schreibt `allowBuilds` flüchtig. Devcontainer in `.devcontainer/`. Details im README-Abschnitt „Cloud-Entwicklung".

### Building
```bash
pnpm run build          # Vite build → dist/
pnpm run build:android  # Baut natives Bundle & Debug-APK via Gradle/Capacitor
pnpm run run:android    # Deployt direkt auf Android-Gerät/Emulator
```
Production API: Coach :9150. The retired `server.mjs` entrypoint does not listen.

## Key Design Notes

- Relax uses FastAPI routes mounted into the existing Coach process.
- **Kein UI-Framework** (kein shadcn, kein MaterialUI) — Tailwind + CSS variables, leichtgewichtig halten
- **SQLite für KB** (`sqlite3` via Python, WAL) — KB-Katalog und API-Cache; Sessions/Journal bleiben dateibasiert
- **YAML = Authoring, SQLite = Betrieb** — YAML manuell editieren, SQLite per Migration importieren; nie direkt YAML zur Laufzeit schreiben
- **Pipeline schreibt nur Detail-Tabellen** — `curated=1` Index-Einträge sind write-protected; Gemini kann Details anreichern, nie kuratierte Einträge überschreiben
- **`marked`** für Markdown-Rendering (Vault-Tab) — bereits installiert
- **`reactflow`** für Graph-Visualisierung — bereits installiert

## Testing API
```bash
http GET :9150/api/relax/api/knowledge/hub/cortisol
http GET :9150/api/relax/api/knowledge/vault/mulungu
http GET ':9150/api/relax/api/knowledge/expand?q=ashwagandha'
http GET ':9150/api/relax/api/knowledge/health'
http GET ':9150/api/relax/api/knowledge/network'
http GET ':9150/api/relax/api/knowledge/interaction?mol1=cortisol&mol2=testosterone'
# KB-DB neu importieren (nach YAML-Änderungen):
node scripts/migrate-yaml-to-sqlite.mjs --force
```

## Ausbildungsmodul als Produktziel

Der Modul-Tab ist der Standard-Einstieg und fachlicher Schwerpunkt dieses Repositories. Kurs-PDFs sind für Ausbildungsinhalte maßgeblich; lokale Notizen sind entsprechend zu kennzeichnen. Keine biochemischen oder gesundheitlichen Wirkungen als individuelle Messung, Diagnose oder Zusage ausgeben. Die Produktvision und die nächsten fachlichen Schritte stehen in `VISION.md` und `NEXT.md`; der seitenbezogene Quellenabgleich steht in `docs/ENTSPANNUNGSTRAINER-QUELLEN.md`.

Physio-Timeline und Substanzkatalog sind zusätzliche Bereiche. Sie dürfen den Kursablauf und die belegte Trainerrolle nicht überlagern. Wirkmodelle und externe Datenquellen brauchen eigene Belege und ersetzen keine Ausbildungsquelle.

## File Manifest

### Root & Config
- `package.json` — dependencies: React, Vite, Tailwind, lucide-react, reactflow, marked, @google/generative-ai
- `vite.config.js` — Vite + proxy config
- `CLAUDE.md` — This file
- `VISION.md` — Produktziel und fachliche Leitplanken des Entspannungstrainer-Moduls
- `NEXT.md` — Nächste Schritte für Kursabgleich, Nachweis und Akzeptanz

### Knowledge Base Data
- `knowledge/substance.catalog.yaml` — 11 kuratierte Substanzen
- `knowledge/molecule.catalog.yaml` — 38 biochemische Moleküle (inkl. Testosteron)
- `knowledge/interactions.yaml` — 33 Molekül-Interaktionen (inkl. PNI-Kaskaden)
- `knowledge/reactions.yaml` — 12 physiologische Reaktionskaskaden

### Backend
- `server.py` — Relax FastAPI routes mounted by Coach
- `scripts/dev-runner.mjs` — Vite-only dev launcher
- `scripts/migrate-yaml-to-sqlite.mjs` — YAML → SQLite Migration (einmalig oder `--force`)
- `server/knowledge/fastapi_api.py` — Knowledge Base routes mounted in Coach
- `server/knowledge/kb-db.js` — SQLite migration helper used by the YAML import script
- `server/knowledge/kb-loader.js` — YAML import/migration helpers; runtime queries use the Python router
- `server/knowledge/kb-cache.js` — legacy Node cache helper; runtime API cache is handled by the Python route module
- `server/knowledge/vault-search.js` — Vault-Index, Name-Matching, Obsidian-Sanitizer
- `server/knowledge/enricher-pipeline.js` — retired Node implementation; runtime enrichment routes are in `fastapi_api.py`
- `server/knowledge/kb_enricher/` — Python Enrichment-Engine :9124 (modulares Paket)
  - `config.py` — Env-Loading, Gemini-Konstanten, Pfade
  - `db.py` — SQLite-Helpers (COALESCE-Semantik, enriched_at-Kriterium)
  - `gemini.py` — Gemini REST Client + Prompt-Builder (kein SDK)
  - `enricher.py` — Core-Logik: enrich_molecule() / enrich_batch()
  - `server.py` — aiohttp HTTP-Server + Route-Handler
  - `cli.py` — typer CLI (serve/enrich/batch/status/list)
  - `README.md` — Doku, Design-Entscheidungen, Erweiterungs-Guide
- `server/knowledge/pubchem.js` — legacy Node PubChem client
- `server/knowledge/kegg.js` — legacy Node KEGG client
- `server/knowledge/psychonaut.js` — Psychonaut Wiki GraphQL (Onset/Peak/Duration)

### Frontend
- `src/views/Breath.jsx` + `src/components/breath/BreathPlayer.jsx` + `src/lib/breath/patterns.js` — Atem-Tab (siehe Views)
- `src/views/SubstanceCatalog.jsx` — Substances-Liste + Graph-Toggle + Modal (Übersicht/Moleküle/Vault)
- `src/components/KnowledgeGraph.jsx` — Reactflow: overview / expanded / hub Modi
- `src/styles.css` — Catppuccin CSS variables + `.vault-markdown` + `.vault-link` styles

## Notes for Future Sessions

- **Kursfidelität**: Bei Änderungen am Ausbildungsmodul zuerst `docs/ENTSPANNUNGSTRAINER-QUELLEN.md` und die referenzierten Original-PDFs prüfen. Lokale Notizen nicht als Originalskript ausgeben; fehlende Anleitungen nicht erfinden.
- **Katalog-Status**: 11 Substances, 38 Molecules (inkl. Testosteron), 33 Interactions — kuratiert auf eigene Erfahrung. Neue Substanzen nur hinzufügen wenn tatsächlich genutzt.
- **YAML editieren → Migration**: Nach manuellen YAML-Änderungen immer `node scripts/migrate-yaml-to-sqlite.mjs --force` ausführen, damit SQLite aktuell bleibt.
- **Vault-Notes**: Obsidian-Vault `~/Vitaltrainer/` (Symlink auf `~/Dokumente/Vitaltrainer/`). `[[links]]` sind konsistenter als `#tags`. Vault-Files können KB-Frontmatter bekommen: `kb_key`, `category`, `formula`, `kb_interactions`.
- **KB Enricher (Python)**: `server/knowledge/kb_enricher/` (Paket). Start: `python -m server.knowledge.kb_enricher serve`. Gemini REST direkt (kein SDK). `enriched_at IS NULL` = noch nicht angereichert. COALESCE-Semantik. 503-Retry (3x). Immer von relax-dev root aufrufen.
- **Nächste Features**: siehe `NEXT.md`; der Ausbildungsablauf hat Vorrang, zusätzliche Physio-/Katalogarbeit bleibt nachgeordnet.
- **Keine UI-Framework-Creep**: Tailwind + CSS variables reicht. Nicht shadcn/MUI einführen.
- **Gemini AI**: Optional für KB-Enrichment. Key in `~/.env/relax.env`. Pipeline schreibt in `molecule_details`, nie in kuratierte Index-Einträge.

---

## Dispatcher

Jedes neue Skript/Tool in diesem Repo gehört als Option in den zentralen Dispatcher — nicht als loses Standalone-Script.
Bei Bash vs. Python: Python bevorzugen. Deps: `typer` + `loguru` + `gum`-Fallback für TUI.
Referenz-Implementierung: `~/aos-dev/bin/bridge-devctl menu`

| Dispatcher | Typ | Funktion |
|---|---|---|
| `relax` | python3 | **Domain CLI** — direkter SQLite-Zugriff + File-Reads, HTTP-Fallback via `server/knowledge/http.py` |
| `relax-devctl` | python3 | **Server-Controller** — start/stop/restart/enricher/deploy → /opt |

`relax` = KB-Queries, Sessions, Journal, Enrich — alles direkt ohne laufenden Server (SQLite + JSON-Files).
`relax-devctl` = Service-Management + Deploy. Neues Server-Tool → hierher.

### HTTP-Fallback-Modul

`server/knowledge/http.py` — sauberes Python-Modul (`import server.knowledge.http as _http`).
Wird von `relax` via `_try_http()` aufgerufen wenn kein direkter DB/File-Zugriff möglich.
Ziel: Coach Relax-Routen auf `:9150` (env: `COACH_API_URL`).

```python
from server.knowledge import http as _http
_http.substances(limit)         # GET /api/knowledge/substances?limit=N
_http.molecules(limit)          # GET /api/knowledge/molecules?limit=N
_http.substance_detail(key)     # GET /api/knowledge/substance/<key>
_http.molecule_detail(key)      # GET /api/knowledge/molecule/<key>
_http.interactions(key)         # GET /api/knowledge/interactions/<key>
_http.search(query)             # GET /api/knowledge/search?q=...
```

### Update 2026-10-25: PATH und Deploy

- `bin/` ist jetzt ein echter Ordner mit relativen Symlinks (`relax`, `relax-add`, `relax-log`, `entspannungsctx`, `relax-devctl`, `physio-devctl`, `physio-kb`, `deploy-relax-dev`); PATH zeigt auf `~/relax-dev/bin` (`~/.dotfiles/config/shell/paths.sh`). Der frühere Symlink `bin -> ~/relax/bin` liegt in `archive/bin-symlink-2026-10-25`.
- `~/relax` (separater Klon) ist nach `~/.local/relax` umgezogen. `deploy.sh` deployt dorthin (`RELAX_DEPLOY_DIR` überschreibt), per rsync + `npm run build`, ohne sudo; `/opt/relax`, Backup-Ordner und `relax.service`-Restart entfallen (die Unit gab es nicht).
- `relax <Freitext>` loggt eine Session (Technik, Dauer, Wochentag/gestern, Notiz), siehe `relax log --help`.
