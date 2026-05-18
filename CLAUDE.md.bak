# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**relax-dev** — Standalone Relax Centre application for relaxation techniques, stress management, and personal wellness tracking. Self-contained React/Vite frontend + Node.js backend with file-based data storage (no database).

**Status**: Placeholder implementation, being reconceptualized with Psychoneuroimmunology inputs (see `UNKLARHEITEN.md`).

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite (:5904), Tailwind CSS + custom CSS variables
- **Backend**: Node.js HTTP server (`server.mjs`, :9004), file-based storage
- **UI Components**: lucide-react for icons, tab-based navigation
- **Theming**: Catppuccin-inspired (mocha/latte), CSS variable-driven

### Port Convention
| Service | Port | Dev Path |
|---------|------|----------|
| Vite (UI) | 5904 | `npm run ui:dev` (or via dev-runner) |
| Node API | 9004 | `npm run start` (or via dev-runner) |

### Data Structure
**Local file-based storage** (`data/` directory, created at runtime):
```
data/
  sessions/YYYY-MM-DD.json     # {date, items: [{id, technique, minutes, mood_before, mood_after, note}], saved_at}
  journal/YYYY-MM-DD.md        # Markdown entries, one file per day
  theme.json                   # {theme: "mocha" | "latte"}
```

### Core Backend (server.mjs)
Single-file HTTP API server (no frameworks, native Node.js):
- **Static serving**: `dist/` (prod build) → fallback to `public/`
- **API endpoints**:
  - `GET /health` — Service health check
  - `GET /techniques` — Available relaxation techniques (hardcoded list)
  - `GET /session?date=YYYY-MM-DD` — Fetch session data
  - `POST /session` — Save session items
  - `GET /session/history?limit=10` — Last N sessions
  - `GET /session/latest` — Most recent session
  - `GET /journal?date=...` — Fetch markdown entry
  - `POST /journal` — Save markdown entry
  - `GET /journal/list` — List 50 most recent entries
  - `GET /stats/summary?days=14` — Aggregated stats (mood delta, streak, by_technique, per_day)
  - `GET /export/csv?days=14` — CSV download
  - `GET /theme` — Current theme preference
  - `POST /theme` — Save theme preference

Environment variables:
- `PORT` (default 9004)
- `HOST` (default 127.0.0.1)
- `RELAX_STATIC_DIR` (override static root, defaults to dist/ or public/)

### Frontend (React/Vite)
**Views** (tab-based in `src/views/`):
1. **Dashboard** — Daily overview, today's quick stats
2. **Session** — Log relaxation techniques with timing and mood tracking
3. **Journal** — Write/edit markdown journal entries
4. **Stats** — View aggregated summaries (charts, streak, mood trends)

**Theme system**: CSS custom properties (`data-theme` attribute on `<html>`):
- `--bg`, `--ink`, `--glass`, `--glass-border`, `--card`, `--line`, `--muted`, `--dim`, `--accent`
- Toggled via top-right button; persisted via `/theme` endpoint

**Mobile-first design**:
- Bottom navigation (lucide icons + labels)
- Glassmorphism header/footer (blur backdrop)
- Safe area padding for notches (`pb-safe`)
- Vertical scroll layout

## Development

### Setup
```bash
npm install
```

### Running
```bash
# Both UI + API together (recommended for dev)
npm run dev

# UI only (needs API running separately)
npm run ui:dev

# API only
npm run start
```

The **dev runner** (`scripts/dev-runner.mjs`) starts both services in parallel:
- API: nodemon watches `server.mjs` for changes
- Vite: standard hot reload on source changes
- Both share stdio (combined logs)

### Vite Proxy
Dev UI proxies API calls to :9004 via `vite.config.js`:
- `/session`, `/journal`, `/stats`, `/techniques`, `/export`, `/theme`, `/health` → :9004

### Building
```bash
npm run build          # Vite build → dist/
npm run preview        # Test prod build locally
```

Production: `node server.mjs` serves `dist/` if present, else `public/`.

## Key Decisions & Design Notes

### Why file-based storage?
- No external dependencies (no database, no driver config)
- Transparent to git (human-readable JSON/Markdown)
- Portable and backup-friendly
- Suitable for single-user personal app

### Why no framework (raw Node.js in server.mjs)?
- Minimal overhead, fast cold start
- Single file easy to reason about
- Sufficient for CRUD + static serving
- Lightweight—no npm dependency cruft

### CSS variables over Tailwind config
Theming via `data-theme` attribute + CSS custom properties allows runtime theme toggle without bundler restart. Catppuccin palette (mocha = dark, latte = light) provides semantic color tokens.

### Tab-based nav over router
Single-view SPA with tab switching (no route changes). Simpler state management, instant transitions. Suitable for mobile-first UX.

## Common Development Tasks

### Adding a new technique
Edit `server.mjs` line ~162 (`/techniques` endpoint), add entry to the techniques array.

### Adding a new API endpoint
1. Add handler in `server.mjs` (check pathname, parse query/body, return JSON)
2. Add Vite proxy entry in `vite.config.js` if frontend needs it
3. Add `api.get()` or `api.post()` call in React view (`src/api.js`)

### Modifying stats aggregation
`computeSummary()` in `server.mjs` (line ~82) calculates `total_minutes`, `days_with_sessions`, `streak_days`, `avg_mood_delta`, `by_technique`, `per_day`. Adjust formulas there.

### Adding a new view
1. Create `src/views/NewView.jsx`
2. Add to `TABS` array in `src/App.jsx` with icon from lucide-react
3. Import view and add to tab → view map in App

### Testing API manually
```bash
http POST :9004/session date=2026-05-17 items='[{"technique":"breath-4-7-8","minutes":5,"mood_before":3,"mood_after":4}]'
http GET ':9004/stats/summary?days=14'
http GET ':9004/export/csv?days=7'
```

## Considerations for Reconceptualization (UNKLARHEITEN.md)

Project is in **placeholder mode** pending Psychoneuroimmunology inputs. Three open questions:
1. **Mood scales**: Current 1–5 for mood; alternatives: stress 1–10, tension 1–10
2. **Sleep tracking**: Separate JSON structure or journal markdown?
3. **CSV export granularity**: Per-item or per-day summary?

All questions will be revisited after domain expert inputs. Current mood tracking, technique taxonomy, and aggregation logic may change.

### Planned Feature: Physio Timeline Graph Engine

See `AGENTS-11-05-2026.md` for detailed spec. Next major feature:

> **Physiological Simulation System** — Models cortisol, dopamine, glucose curves in response to lifestyle events (coffee, nicotine, THC, meals) with context modifiers (fasted, sleep debt, stress level).

**Implementation approach** (from AGENTS.md):
- Backend: Deterministic math-based simulation (pure functions, no ML)
- Frontend: Event input UI + Nivo line chart (3 curves)
- Shared types for API contract
- MVP-first: functionality over perfection, simplicity over flexibility

**Architecture**:
```
Backend: POST /api/physio/simulate → simulation engine (curves, events, interactions)
Frontend: /physio-timeline page → event panel + chart
Shared: types, constants (Event, SimulationRequest, SimulationResponse)
```

This feature will likely replace or significantly enhance the current mood tracking and integrate deeper psychoneuroimmunology concepts (HPA axis, autonomic nervous system, nutrient timing).

## Deployment

### Dev Environment
Running `npm run dev` on localhost (both :5904 and :9004) is the standard. Logs to stdout; shutdown with Ctrl+C.

### Production (Standalone)
1. `npm run build` → creates `dist/`
2. `node server.mjs` (or systemd unit if integrated into AlphaOS)
3. Server auto-detects `dist/`, serves SPA with proper 404 → index.html fallback

Port and static dir configurable via env vars (see server.mjs env section).

## File Manifest

### Root & Config
- `package.json` — npm scripts, dependencies (React, Vite, Tailwind, lucide-react)
- `vite.config.js` — Vite + proxy config
- `tailwind.config.cjs` — Tailwind CSS customization
- `postcss.config.cjs` — PostCSS pipeline
- `.gitignore` — Standard (node_modules, dist)
- `README.md` — Quick start (mostly duplicated in this CLAUDE.md)
- `UNKLARHEITEN.md` — Open design questions

### Backend
- `server.mjs` — Single-file Node.js HTTP server (MIME, JSON helpers, API routes, static serve)
- `scripts/dev-runner.mjs` — Parallel dev launcher (API + Vite)

### Frontend
- `src/main.jsx` — Vite entry, React root
- `src/App.jsx` — Main component (tab nav, theme toggle)
- `src/api.js` — Fetch helpers (get, post), date utilities, download handler
- `src/styles.css` — Catppuccin palette CSS variables, base typography
- `src/views/` — View components:
  - `Dashboard.jsx` — Today overview
  - `Session.jsx` — Technique logging + mood input
  - `Journal.jsx` — Markdown editor
  - `Stats.jsx` — Summary charts & trends
- `src/components/` — (empty; leaf components inline in views)

### Static Assets
- `public/` — Fallback static files (index.html, favicon, etc.)
- `index.html` — Vite template, root div
- `dist/` — Output of `npm run build` (served in prod)

## Notes for Future Sessions

- **Reconceptualization pending**: This is a scaffolding app. Domain inputs will reshape mood tracking, technique taxonomy, and export formats.
- **Planned feature next**: See `AGENTS-11-05-2026.md` for **Physio Timeline Graph Engine** spec (physiological simulation system). This represents the deeper integration with Psychoneuroimmunology.
- **Agent workflow**: `AGENTS-11-05-2026.md` is a template for agent-driven feature implementation (backend → frontend → integration). Reference this if building the physio feature.
- **Data migration**: If scales or structures change, scripts to migrate existing `data/sessions/*.json` files will be needed.
- **Component library**: No UI framework (no shadcn, no MaterialUI). Styling is Tailwind + CSS variables. Keep it lightweight.
- **Offline support**: Currently no service worker or IndexedDB caching. If adding, consider local-first sync to `/api/*`.
