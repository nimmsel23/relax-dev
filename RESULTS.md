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
