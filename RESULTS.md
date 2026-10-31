# Atem-Tab, Build-Fixes, node:sqlite und Cloud-Tauglichkeit (2026-10-29)

Neues Feature „Atem" (Visualizer, Streaks, Dashboard-Karte) plus Aufräumen am Build: Der Vite-Build lieferte wegen absoluter bzw. veralteter Kopien unter `public/` nur einen 5-kB-Stub. Außerdem `better-sqlite3` durch `node:sqlite` ersetzt, CI auf pnpm umgestellt und das Repo aus einem frischen Checkout lauffähig gemacht. Alles auf `dev` committet, nichts gepusht oder deployt.

- **Atem-Tab** (`src/views/Breath.jsx`, `src/components/breath/BreathPlayer.jsx`, `src/lib/breath/patterns.js`, `e12c69d`): 5 Kategorien mit 15 Techniken, Muster-Karten mit PNI-Erklärung, Orb-Visualizer (Phasenring, Countdown, 3-s-Vorlauf, Wake-Lock, Pause/Beenden, optionale Vibration). Abschluss fragt Stimmung ab und schreibt ins normale Session-Log (Läufe < 20 s verworfen). Tab `#atem` in `src/App.jsx`, `.no-scrollbar` in `src/styles.css`, CLAUDE.md ergänzt. Muster liegen bewusst in `src/lib/`, weil `src/data/` von `.gitignore` verschluckt wird.
- **Atem-Statistik** (`src/lib/breath/stats.js`, `src/lib/breath/prefs.js`, `tests/breath-stats.test.mjs`, `f4520b5`): Atem-Erkennung, Minuten pro Tag, aktuelle/längste Serie, Tageszeit-Vorschlag; `Breath.jsx` nutzt die gemeinsamen Module.
- **Dashboard-Karte „Atmen"** (`src/components/breath/BreathCard.jsx`, `fbf0b1d`): Serie, Rekord, 7-Tage-Balken, Tageszeit-Vorschlag mit Sprung in den Atem-Tab. Nur gegen Mock-Server im Headless-Browser getestet.
- **Build-Fix Symlinks/Kopien** (`31ffa4c`, `74e81c2`, `eca76ec`): `public/src`, `public/index.html`, `public/physio`, `scripts/deploy.sh`, `scripts/kb`, `scripts/physio-devctl`, `physio-sim/fuel-dev` und `physio-devctl` entfernt; `bin/physio-devctl` ist jetzt ein relativer Symlink. `npm run build` liefert wieder die volle App (~820 kB statt Stub), `dist/` enthält kein `src/` und kein `physio/` mehr.
- **`server/knowledge/kb-db.js`, `kb-cache.js`, `package.json`** (`22a1917`): `better-sqlite3` durch eingebautes `node:sqlite` (`DatabaseSync`) ersetzt, Abhängigkeit entfernt, CLAUDE.md/GEMINI.md angepasst. Gegen Kopie der DB geprüft (Lese-/Schreibpfade, `curated`-Schutz, WAL, Foreign Keys).
- **CI und Cloud-Setup** (`693f6b0`, `1468d1f`, `a1b3af7`, `a217146`): `.github/workflows/check.yml` und `preview-dev.yml` auf pnpm, neues `scripts/ci-install.sh` (gemeinsamer Einstieg für CI/Devcontainer, schreibt `allowBuilds` nur flüchtig und nur ohne übergeordneten Workspace, standalone `--frozen-lockfile`), `pnpm-lock.yaml` eingecheckt, `.nvmrc` + `engines` (Node ≥ 22.13), `.devcontainer/devcontainer.json`, `tests/server-smoke.test.mjs`, `test`-Script als Dateiliste, README/CLAUDE.md um „Cloud-Entwicklung" ergänzt (inkl. Korrektur `~/.env/relax.env`). In frischer Kopie mit leerem `HOME` verifiziert: Install, Tests, Build grün.
- **README** (`607b528`): Release-Weg auf `dev` → `master` → `vitalos` korrigiert (laut `AGENTS.md`).

---

## 2026-10-21 — Gemeinsamer Changelog

Universalisierten VitalOS-Release-Dialog über vendorte Vite-Module eingebunden. Standalone mit eigener Bestätigung; eingebettet unterdrückt zugunsten des zentralen Shell-Dialogs.

# RESULTS.md

Session: physio-sim (2026-05-18)

## Completed

### Dual-Catalog Knowledge Base Architecture
- Implemented bidirectional substance ↔ molecule mapping in YAML catalogs
- 19 herbal substances + 27 biochemical molecules with cross-references
- Each molecule tracks `found_in` (which substances contain it)
- Each substance tracks `references` (which molecules it contains)

### Knowledge Base Loader & Dispatcher
- Extended `kb-loader.js` with `dispatchQuery()` intelligent router
- Substance expansion: substance → molecules → interactions between them
- Molecule expansion: molecule → substances containing it → related molecules (via interactions)
- Caching + indexing for fast lookups across both catalogs
- Search across both catalogs unified (`searchAll()`)

### Knowledge API Routes
- Implemented `/api/knowledge/*` endpoint suite in `knowledge.js`
- `/api/knowledge/expand?q=...` — unified dispatcher (detects substance or molecule)
- `/api/knowledge/substance/:id` — single substance
- `/api/knowledge/expand/substance/:id` — substance expansion
- `/api/knowledge/molecule/:id` — single molecule (with AI enrichment fallback)
- `/api/knowledge/expand/molecule/:id` — molecule expansion
- `/api/knowledge/interaction?mol1=...&mol2=...` — interaction lookup (with AI generation)
- `/api/knowledge/search?q=...` — cross-catalog search
- `/api/knowledge/health` — KB status (added `dual_catalog_enabled: true`)
- All routes integrated into `server.mjs`

### Graph Visualization
- Built `KnowledgeGraph.jsx` Reactflow component
- Custom node types: `SubstanceNode` (central, larger) + `MoleculeNode` (circular layout)
- Substance at (0, 0), molecules arranged in circle (radius 280px)
- Edges: substance→molecule (animated gray), molecule↔molecule (color-coded: green synergistic, red antagonistic dashed)
- Includes ReactFlow controls, background, mini-map
- Loading/error/empty states

### UI Integration
- Added List/Graph toggle to `SubstanceCatalog.jsx`
- Graph view shows `KnowledgeGraph` component
- List view preserves existing flat categorized display
- Separate search inputs for list vs graph modes
- All existing functionality preserved

### Gemini API Configuration
- Moved API key loading from `~/.env/gemini.env` → `~/.env/relax.env`
- Updated `ai-enricher.js` + `ai-enricher-v2.js` to load from `~/.env/relax.env`
- Project-level `relax.env.example` removed (was in .gitignore anyway)
- Config uses `os.homedir()` for cross-platform compatibility

### Git Commits
- `401bfb1` — Dual-catalog + graph visualization implementation
- `1696ac8` — Documentation + configuration updates
- `d533e3f` — Gemini API config (initial, project-level relax.env)
- `474a617` — Remove relax.env.example
- `17d2b29` — Configure Gemini API to load from ~/.env/relax.env

## Test Results

All API endpoints tested & functional:
- ✅ Health check: 19 substances, 27 molecules, dual_catalog_enabled=true
- ✅ Substance expansion (Mulungu): returned substance + 3 molecules + interactions
- ✅ Molecule expansion (Caffeine): returned molecule + substances containing it + related molecules
- ✅ Interaction lookup (Caffeine ↔ L-Theanine): synergistic effect recognized
- ✅ Cross-catalog search (Ashwagandha): found substance

## Known Issues / Gaps

- Browser testing of graph visualization not yet performed (API side verified only)
- Physiology Obsidian Vault integration not explored (user asked, deferred)
- Physio Timeline Graph Engine (cortisol/dopamine simulation) not implemented (planned feature)

## 2026-10-31 — Dependabot

Enabled Dependabot alerts and security updates. Configured weekly GitHub Actions and npm/pnpm updates; version updates target `dev`. Minor/patch updates are grouped; vendored mini-app-shell copies stay maintained at their source. Validated YAML, repository manifest paths and update targets.
