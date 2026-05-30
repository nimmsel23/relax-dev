# relax-dev Project Documentation (Generated for Gemini)

This `GEMINI.md` provides an overview of the `relax-dev` project, its architecture, development practices, and key functionalities, designed to serve as an instructional context for AI agents.

---

## 1. Project Overview

`relax-dev` is a standalone application combining relaxation techniques, physiological tracking, and substance interaction analysis. It features a React 18 frontend (Vite), a Node.js HTTP API (Fastify), and a dynamic biochemistry knowledge base (KB) powered by Gemini AI for on-demand enrichment. The application uses file-based persistence for user data and YAML files for the core knowledge base.

**Key Technologies:**
- **Frontend:** React 18, Vite, Zustand (state management), Recharts (visualizations), Tailwind CSS.
- **Backend:** Node.js, Fastify (HTTP API), `better-sqlite3` (for KB cache), `yaml` (for KB data).
- **AI/Knowledge:** Google Gemini API (`@google/generative-ai`), `dotenv`.
- **Persistence:** Local file system (`data/`).

**Core Features:**
- **Session Tracking:** Log relaxation techniques, timing, and mood.
- **Journal:** Markdown-based daily entries.
- **Physio Timeline:** Deterministic physiological simulation of various biochemical curves based on events and context.
- **Biochemistry Knowledge Base:** Dynamic KB with AI-powered enrichment for molecules, reactions, and interactions.
- **Substance Catalog:** Frontend for exploring the knowledge base with a dual-layer approach:
  - **Wirkweise (Mechanisms):** High-level overview of physiological impacts (e.g., Cortisol, Dopamine) mapped from molecular components.
  - **Moleküle (Molecules):** Deep scientific detail of individual active ingredients.
  - **Knowledge Graph:** Interactive visualization of substance-molecule networks.

---

## 2. Building and Running

The project utilizes `npm` for dependency management and scripts for development and production workflows.

**Quickstart:**

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Development (Vite HMR + Nodemon backend):**
    ```bash
    npm run dev
    ```
    This runs both the UI and API concurrently.

    Alternatively, run separately:
    ```bash
    npm run ui:dev   # Vite only (UI: http://localhost:5904)
    npm run start    # API only (API: http://localhost:9123)
    ```
3.  **Production build:**
    ```bash
    npm run build    # Creates optimized build in `dist/`
    npm run preview  # Test production build locally
    ```

---

## 3. Development Conventions

**Code Style:**
-   **Frontend:** React functional components, Zustand for state management.
-   **Backend:** Node.js native HTTP (using Fastify as a lightweight framework), file-based persistence.
-   **Modules:** ECMAScript Modules (ESM) are used throughout (`"type": "module"` in `package.json`).
-   **Comments:** Sparingly used, primarily for explaining the "why" of complex logic, not the "what". Code is expected to be self-documenting.

**Hot Reload:**
-   **UI:** Vite HMR provides instant updates on source code changes.
-   **API:** `nodemon` monitors `server.mjs` and restarts the backend on changes.

**Testing:**
-   API endpoints can be tested using `curl` commands. Examples are provided in `README.md` and `ARCHITECTURE.md`.
-   The project relies on manual testing via API calls and UI interaction for verification.

---

## 4. Key Architectural Components

### 4.1. Frontend (React/Vite)

-   **Entry Point:** `src/main.jsx` renders the `App` component.
-   **Main Application:** `src/App.jsx` handles global layout, tab navigation, and theme management using `useCircadianTheme`.
-   **Views:** Organized under `src/views/` (e.g., `Dashboard.jsx`, `Session.jsx`, `PhysioTimeline.jsx`, `SubstanceCatalog.jsx`).
-   **State Management:** `zustand` is used, particularly for `physioStore.js`.
-   **Styling:** Tailwind CSS and `styles.css` (Catppuccin + CSS variables).

### 4.2. Backend (Node.js/Fastify API)

-   **Main Server:** `server.mjs` sets up the Fastify server, serves static files, and defines core API routes (sessions, journal, stats, theme, export).
-   **API Routing:**
    -   `/api/knowledge/*` routes are handled by `server/routes/knowledge.js` via `handleKnowledgeAPI`.
    -   `/api/physio/*` routes are handled by `server/routes/physio.js` via `handlePhysioSimulate`.
-   **Data Persistence:** User-specific data (sessions, journal, theme) is stored in `data/` as JSON or Markdown files.

### 4.3. Biochemistry Knowledge Base (KB)

The KB is a central component for scientific data, implemented with a dynamic, AI-enriched approach.

-   **Structure:**
    -   `knowledge/molecules.yaml`: Definitions of molecules (e.g., hormones, neurotransmitters), including effects, sources, and relaxation relevance.
    -   `knowledge/reactions.yaml`: Descriptions of biochemical cascades and processes.
    -   `knowledge/interactions.yaml`: Pairwise molecule interactions.
-   **Loading & Caching:** `server/knowledge/kb-loader.js` loads and caches YAML files in memory. It also provides lookup and search functionalities.
-   **AI Enrichment (`server/knowledge/ai-enricher.js`):**
    -   Utilizes the Gemini API to generate comprehensive entries for missing molecules, interactions, or reactions on demand.
    -   When a query for a molecule or interaction is not found in the local YAML files, `ai-enricher.js` prompts Gemini to generate the data in a structured YAML format.
    -   The generated data is then added to the in-memory KB cache and persisted to the respective YAML file.
    -   This allows for a dynamically growing knowledge base.
-   **Enrichment Pipeline (`server/knowledge/enricher-pipeline.js`):** Orchestrates enrichment from multiple sources (PubChem, KEGG, Psychonaut) before resorting to Gemini for synthesis.

### 4.4. Physio Timeline Simulation

-   **API Endpoint:** `/api/physio/simulate` (handled by `server/routes/physio.js`).
-   **Core Logic:** `server/engine/simulate.js` performs deterministic physiological simulations based on user-defined events (e.g., coffee, meals) and context (e.g., sleep debt, stress level).
-   **Input:** Events (type, time), context (sleep debt, stress level), horizon (minutes), resolution.

---

## 5. Environment Variables

Environment variables are managed via `.env` files, loaded using `dotenv`.

**Required for AI features:**
-   `GEMINI_API_KEY`: Your Google Gemini API key (e.g., `AIzaSy...`). Should be placed in `~/.env/relax.env`.
-   `GEMINI_MODEL`: The Gemini model to use (default: `gemini-2.5-flash`). Also in `~/.env/relax.env`.

**Optional:**
-   `PORT`: API server port (default: `9123`).
-   `HOST`: API host (default: `127.0.0.1`).
-   `RELAX_STATIC_DIR`: Override the static file serving directory (`dist/` or `public/`).

---

## 6. Future Enhancements

The project has a roadmap for future development, including:
-   **RELAX-003: Substance Response Tracking + Personal Learning:** AI analysis of user observations.
-   **Wearables Integration:** HRV, HR, sleep data.
-   **Advanced Stats:** Trend analysis, correlation.
-   **Offline Capabilities:** Service worker, IndexedDB for PWA.
-   **Knowledge Graph Visualization:** Interactive visualization of molecule relationships.
-   **AI-powered Recommendations.**
-   **Mobile App.**
-   **KB Versioning, User Contributions, Multi-language support.**

---
