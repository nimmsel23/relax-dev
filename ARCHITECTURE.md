# ARCHITECTURE.md

## Biochemistry Knowledge Base + AI Integration

### Overview

**relax-dev** now includes a **dynamic biochemistry knowledge base** with **Gemini AI-powered enrichment**. The KB serves as the foundation for:
- Physio Timeline simulation (accurate substance effect modeling)
- Substance interaction checking
- Personalized recommendations (RELAX-003, upcoming)
- Educational catalog of molecules and processes

---

## Knowledge Base Structure

### Data Files (`/knowledge/`)

```
knowledge/
  molecules.yaml        # 70+ molecules (hormones, neurotransmitters, minerals, etc.)
  reactions.yaml        # 12 major biochemical cascades (HPA axis, sleep, stress, etc.)
  interactions.yaml     # 30+ molecule-to-molecule interactions
```

#### molecules.yaml

Each molecule has:
```yaml
caffeine:
  name: "Caffeine"
  de_name: "Koffein"
  category: "alkaloid"
  formula: "C8H10N4O2"
  sources:
    external: [coffee, tea, dark_chocolate]
    endogenous: false
  functions: ["adenosine antagonist", "increases wakefulness", ...]
  primary_effects:
    dopamine:
      direction: "increase"
      magnitude: "30"  # percent
      onset_minutes: 15
      peak_minutes: 45
      duration_minutes: 300
      mechanism: "A1/A2a receptor antagonism"
  affects: [dopamine, cortisol, adrenaline]
  relaxation_relevance: "high_negative"
  notes: "..."
```

**Fields:**
- `name`, `de_name` — English and German labels
- `category` — Classification (hormone, neurotransmitter, mineral, alkaloid, etc.)
- `formula` — Chemical formula if applicable
- `sources` — Where it comes from (food, endogenous production, supplements)
- `functions` — Primary physiological roles
- `primary_effects` — How it affects other molecules/processes (with timing)
- `produces_from` / `produces_to` — Precursor/product relationships
- `affected_by` — What increases/decreases its levels
- `affects` — What this molecule impacts
- `relaxation_relevance` — `high_positive`, `moderate_positive`, `neutral`, `moderate_negative`, `high_negative`
- `notes` — Additional context

#### reactions.yaml

Major biochemical cascades and processes:
```yaml
hpa_axis:
  name: "Hypothalamic-Pituitary-Adrenal Axis"
  de_name: "HPA-Achse"
  description: "Primary stress response system..."
  category: "stress_response"
  cascade:
    - step: 1
      molecule: "CRH"
      location: "hypothalamus"
      trigger: "stress perception"
    - step: 2
      molecule: "ACTH"
      ...
  activated_by: [stress, exercise, caffeine, poor_sleep]
  inhibited_by: [relaxation, parasympathetic_activation, sleep]
  typical_duration_minutes: 20
  ...
```

#### interactions.yaml

Pairwise and multi-way interactions:
```yaml
caffeine_nicotine:
  molecules: [caffeine, nicotine]
  type: "synergistic"
  combined_effect: "amplified dopamine response"
  dopamine_change: "50"  # percent (vs 30% alone)
  mechanism: "both converge on VTA dopamine neurons"
  user_experience: "heightened focus, anxiety risk"
  recommendation: "avoid if anxiety-prone"
  relaxation_relevance: "high_negative"
```

---

## Backend Architecture

### Knowledge Base Loading (`server/knowledge/kb-loader.js`)

```typescript
class KnowledgeBaseLoader {
  loadMolecules()      // Load + cache molecules.yaml
  loadReactions()      // Load + cache reactions.yaml
  loadInteractions()   // Load + cache interactions.yaml
  
  getMolecule(query)   // Fast lookup by name or key
  searchMolecules(q)   // Full-text search
  getInteraction(m1, m2) // Find pairwise interaction
  
  addMolecule(key, data)    // Add new molecule to KB
  addInteraction(key, data) // Add new interaction to KB
  saveMolecules()   // Persist changes to molecules.yaml
  saveInteractions() // Persist changes to interactions.yaml
}
```

**Caching:** Files are loaded once and cached in memory. Updates trigger file writes (YAML).

### AI Enrichment (`server/knowledge/ai-enricher.js`)

```typescript
class AIEnricher {
  // Triggered when KB query returns 404
  async checkAndEnrich(query, kbLoader)
    // If molecule not in KB:
    // 1. Call generateMoleculeEntry(query)
    // 2. Gemini researches & returns YAML-like object
    // 3. kbLoader.addMolecule() saves it
    // 4. Next query → cache hit
  
  async generateMoleculeEntry(name, category?)
    // Prompts Gemini: "Generate biochemistry entry for X"
    // Returns evidence-based YAML structure
  
  async generateInteraction(mol1, mol2, existingData?)
    // Prompts Gemini: "How do mol1 and mol2 interact?"
    // Uses existing molecule data for context
  
  async generateReaction(name, description)
    // Prompts Gemini: "Describe this biochemical cascade"
}
```

**Gemini API:**
- Reads from `~/.env/gemini.env` (GEMINI_API_KEY, GEMINI_MODEL)
- Uses `gemini-2.5-flash` for fast generation
- Fallback: if Gemini fails, returns 404 with cached info

### API Routes (`server/routes/knowledge.js`)

| Endpoint | Method | Behavior |
|----------|--------|----------|
| `/api/knowledge/health` | GET | KB status: molecule count, reaction count, AI enabled |
| `/api/knowledge/molecules` | GET | List all molecules |
| `/api/knowledge/molecule/:id` | GET | Get single molecule; **AI enrichment if missing** |
| `/api/knowledge/search?q=...` | GET | Full-text search molecules |
| `/api/knowledge/reaction/:id` | GET | Get single reaction |
| `/api/knowledge/reactions` | GET | List all reactions |
| `/api/knowledge/interaction?mol1=X&mol2=Y` | GET | Get interaction; **AI enrichment if missing** |
| `/api/knowledge/interactions` | GET | List all interactions |

**Response format:**
```json
{
  "ok": true,
  "molecule": { /* molecule data */ },
  "source": "cache" | "ai_generated",
  "saved": true | false
}
```

---

## Data Flow

### Query Workflow

```
User: "What is Quercetin?"
  ↓
GET /api/knowledge/molecule/quercetin
  ↓
kb-loader.getMolecule("quercetin")
  ├─ Found in molecules.yaml? → Return immediately
  └─ Not found? → Continue
  ↓
ai-enricher.generateMoleculeEntry("quercetin")
  ├─ Calls Gemini API
  ├─ Gemini researches & returns YAML
  └─ kbLoader.addMolecule() saves to molecules.yaml
  ↓
Return enriched molecule + "source": "ai_generated"
  ↓
Next query for "Quercetin" → cache hit (instant)
```

### Interaction Query

```
User: "Do Caffeine + Magnesium work together?"
  ↓
GET /api/knowledge/interaction?mol1=caffeine&mol2=magnesium
  ↓
kb-loader.getInteraction("caffeine", "magnesium")
  ├─ Found in interactions.yaml? → Return
  └─ Not found? → Continue
  ↓
ai-enricher.generateInteraction("caffeine", "magnesium", {caffeineData}, {magnesiumData})
  ├─ Calls Gemini with molecule context
  ├─ Gemini generates interaction YAML
  └─ kbLoader.addInteraction() saves to interactions.yaml
  ↓
Return interaction + "source": "ai_generated"
```

---

## Integration with Other Features

### Physio Timeline (RELAX-002)

The simulation engine (`server/engine/`) can **eventually** use KB data for effect curves:

```javascript
// Current: Hardcoded effects
const coffeeEffect = spike(0, 45, 1.0, 300);

// Future: Load from KB
const molecule = kb.getMolecule("caffeine");
const effect = spike(
  molecule.primary_effects.dopamine.onset_minutes,
  molecule.primary_effects.dopamine.peak_minutes,
  molecule.primary_effects.dopamine.magnitude / 100,
  molecule.primary_effects.dopamine.duration_minutes
);
```

**Benefits:**
- Data-driven simulation (not hardcoded)
- Easy to update effects
- Personalization (users can adjust KB based on their observations)

### Substance Response Tracking (RELAX-003)

Users log observations (what they took, how they felt):
```
"I took caffeine at 09:00"
"By 09:45 I felt: energized, jittery, focused"
```

The system can:
1. Compare against KB predicted effects
2. Adjust personalized parameters over time
3. Flag unexpected interactions (e.g., "Your THC + Caffeine usually causes anxiety; avoid combo?")

---

## Development Workflow

### Adding a New Substance

**Option 1: Manual Edit**
```yaml
# Edit knowledge/molecules.yaml directly
quercetin:
  name: "Quercetin"
  de_name: "Quercetin"
  category: "flavonoid"
  sources:
    external: [apples, onions, berries, tea]
  functions: ["antioxidant", "anti-inflammatory", "quercetin receptor agonist"]
  primary_effects:
    inflammation:
      direction: "decrease"
      magnitude: "15"
  relaxation_relevance: "moderate_positive"
```

**Option 2: AI-Generated (Lazy Loading)**
```bash
curl http://localhost:9123/api/knowledge/molecule/quercetin
# Gemini researches & generates entry automatically
# Next query returns from cache
```

### Adding a New Interaction

Similar two-path approach:
- Manual: Edit `knowledge/interactions.yaml`
- Lazy: Query endpoint, Gemini generates on-demand

### Extending Reactions

Add to `knowledge/reactions.yaml` for complex cascades (e.g., circadian rhythm modulation, immune response to stress, etc.).

---

## File Structure

```
relax-dev/
├── knowledge/                    # KB source files
│   ├── molecules.yaml           # (70+ molecules)
│   ├── reactions.yaml           # (12 cascades)
│   └── interactions.yaml        # (30+ interactions)
│
├── server/
│   ├── knowledge/
│   │   ├── kb-loader.js        # YAML loading + caching
│   │   └── ai-enricher.js      # Gemini integration
│   │
│   ├── routes/
│   │   └── knowledge.js         # API endpoints
│   │
│   └── engine/
│       ├── curves.js           # (unchanged)
│       ├── events.js           # (can use KB data)
│       ├── interactions.js     # (can use KB data)
│       └── simulate.js         # (unchanged)
│
├── src/
│   ├── api.js                  # (add KB fetch helpers)
│   ├── views/
│   │   ├── PhysioTimeline.jsx  # (uses Physio API)
│   │   └── SubstanceCatalog.jsx # (uses Knowledge API, TBD)
│   └── ...
│
└── .env/
    └── gemini.env              # GEMINI_API_KEY
```

---

## Environment Variables

**Required:**
```
# ~/.env/gemini.env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
```

**Optional:**
```
PORT=9123              # API server port
HOST=127.0.0.1        # API host
RELAX_STATIC_DIR=...  # Override static dir
```

---

## Dependencies

New packages:
- `@google/generative-ai` — Gemini API client
- `yaml` — Parse/stringify YAML files
- `dotenv` — Load `.env` files

---

## Future Enhancements

1. **KB Versioning** — Track when entries were added/modified (git-style)
2. **Knowledge Graphs** — Visualize molecule → interaction → process relationships
3. **User-Contributed KB** — Users can suggest/vote on KB entries
4. **Personalized KB** — Adjust effects based on user observations (RELAX-003)
5. **Multi-Language KB** — Expand beyond DE/EN
6. **Research Citation** — Link KB entries to papers/sources
7. **Smart Recommendations** — "Based on your condition, try combining X + Y"
8. **KB Export** — Download as JSON, CSV, PDF for offline reference

---

## Testing

### Manual API Tests

```bash
# Health check
curl http://localhost:9123/api/knowledge/health | jq

# Get molecule (will AI-generate if missing)
curl http://localhost:9123/api/knowledge/molecule/quercetin | jq

# Search molecules
curl 'http://localhost:9123/api/knowledge/search?q=sleep' | jq

# Get interaction
curl 'http://localhost:9123/api/knowledge/interaction?mol1=caffeine&mol2=magnesium' | jq

# List all molecules
curl http://localhost:9123/api/knowledge/molecules | jq '.molecules | length'
```

### Adding Test Data

```bash
# Add custom molecule
cat > /tmp/test-mol.json << 'EOF'
{
  "name": "Test Molecule",
  "category": "test",
  "functions": ["test"]
}
EOF

# Manually edit knowledge/molecules.yaml to test persistence
nano knowledge/molecules.yaml
```

---

## Performance Notes

- **Caching:** Molecules/reactions/interactions loaded once on first query
- **AI Latency:** First-time Gemini queries take ~2-5s; subsequent queries instant (cache)
- **YAML Parsing:** Minimal overhead; YAML chosen for human readability over speed
- **Storage:** YAML files kept under 100KB each (scalable to 1MB+ before optimization needed)

If KB grows large:
- Consider SQLite backend (drop-in replacement for loader.js)
- Implement pagination for list endpoints
- Add ElasticSearch for full-text search

---

## Responsibilities

- **kb-loader.js** — I/O, caching, indexing
- **ai-enricher.js** — Gemini API calls, YAML generation, parsing
- **knowledge.js (routes)** — HTTP API, request validation, response formatting
- **molecules.yaml, reactions.yaml, interactions.yaml** — Data (human-editable)

