# Knowledge Base & Vault Integration Architecture

## Overview
The `relax-dev` project utilizes a hybrid knowledge management system:
1.  **Formal Knowledge Base (KB):** Structured data (molecules, substances, interactions) stored in YAML files, migrated and served via SQLite (`data/kb.db`).
2.  **Informal Vault (Obsidian):** Unstructured text-based notes stored in local markdown files.

## Components

### 1. KB Pipeline
*   **Source of Truth:** YAML files in `/knowledge/`.
*   **Storage:** SQLite database at `data/kb.db` (managed by `server/knowledge/kb-db.js`).
*   **CLI Tool:** `/kb` (Python wrapper) used for enrichment, searching, and status checks.
*   **Migration:** `scripts/migrate-yaml-to-sqlite.mjs` handles the synchronization from YAML to SQLite, maintaining a distinction between curated index fields and AI/pipeline-enriched detail fields.

### 2. Vault Integration (`server/knowledge/vault-search.js`)
*   **Purpose:** Bridges structured KB data with unstructured Obsidian vault notes.
*   **Indexing:** Scans pre-configured `VAULT_PATHS` and indexes `.md` files by filename.
*   **Matching:** Maps KB entities (molecules/substances) to relevant Markdown files using a scoring algorithm based on names and aliases.
*   **Connectivity:** Extracts Wikilinks (`[[link]]`) from markdown files, enabling the system to discover connections between KB entities and broader knowledge topics in the vault.
*   **Rendering:** Sanitizes Obsidian-style links for frontend interactivity (`<span class="vault-link" ...>`).

## Knowledge Base Structure

### Data Files (`/knowledge/`)

```
knowledge/
  substance.catalog.yaml # High-level substances (e.g., Ashwagandha, Coffee)
  molecule.catalog.yaml  # 70+ molecules (hormones, neurotransmitters, etc.)
  reactions.yaml         # 12 major biochemical cascades (HPA axis, sleep, etc.)
  interactions.yaml      # 30+ molecule-to-molecule interactions
```

#### substance.catalog.yaml

This layer defines substances as they are consumed or encountered by the user. It maps substances to their active components (molecules) and high-level physiological impacts.

```yaml
ashwagandha:
  name: "Ashwagandha"
  de_name: "Ashwagandha"
  category: "herbal_adaptogen"
  description: "Ayurvedic adaptogen for stress resilience..."
  references: ["withaferin_a", "withanolide_d", "gaba"] # Links to molecules
  traditional_use: ["Stress management", "Sleep enhancement"]
  relaxation_relevance: "high_positive"
  mechanism: "Withanolides inhibit cortisol release..."
```

#### molecule.catalog.yaml

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
