# Physio Simulation Migration Plan

**Source:** `~/.physio-sim/` (Monorepo mit Turborepo + pnpm)
**Target:** `~/relax-dev/` (Standalone React/Vite + Node.js)
**Status:** Planning

---

## Phase 1: Architecture Adaptation

### Source Structure (Monorepo)
```
physio-sim/
├─ apps/api           → Fastify Node.js backend
├─ apps/mobile        → React Native / Expo
├─ packages/engine    → Pure simulation (TS functions)
├─ packages/shared    → Types + DTOs
```

### Target Structure (Standalone)
```
relax-dev/
├─ server.mjs         → Extend with /api/physio/simulate endpoint
├─ src/
│  ├─ components/physio/
│  │  ├─ EventInputPanel.jsx
│  │  ├─ EventList.jsx
│  │  ├─ PhysioChart.jsx
│  │  └─ SimulationControls.jsx
│  └─ views/PhysioTimeline.jsx
├─ server/
│  ├─ engine/         → Pure simulation (adapt from packages/engine)
│  │  ├─ curves.js
│  │  ├─ events.js
│  │  ├─ interactions.js
│  │  └─ simulate.js
│  ├─ routes/physio.js
│  └─ types.js        → Shared types (adapt from packages/shared)
└─ data/physio/       → Simulation cache / logs (optional)
```

---

## Phase 2: Simulation Engine Porting

### From packages/engine → server/engine/

**Files to Port:**
1. `spike()`, `ramp()`, `decay()` curve primitives
   - Port to: `server/engine/curves.js`
   - No changes needed (pure math)

2. `interaction.service.ts` → nonlinear stacking
   - Port to: `server/engine/interactions.js`
   - No changes needed (pure logic)

3. `substance.model.ts` → coffee, nicotine, THC, meal effects
   - Port to: `server/engine/events.js`
   - Rename: "substances" → "events" (align with relax-dev terminology)

4. `simulateSession()` → main orchestrator
   - Port to: `server/engine/simulate.js`
   - Adapt return format to match relax-dev data structure

### Shared Types → server/types.js

Port from `packages/shared/types.ts`:
- `Substance` → `Event` (coffee, meal, nicotine, THC)
- `Context` → `ContextModifiers` (fasted, sleepDebt, stressLevel, circadianPhase)
- `SimulationInput`, `SimulationOutput`

---

## Phase 3: Backend API Integration

### Current server.mjs
- Add new endpoint: `POST /api/physio/simulate`
- Route file: `server/routes/physio.js`
- Reuse readJson/writeJson/json helpers from server.mjs

### API Contract

**Request:**
```json
{
  "events": [
    {"type": "coffee", "time": 0, "dose": 1},
    {"type": "meal", "time": 60, "macro": "carbs"},
    {"type": "nicotine", "time": 120, "dose": 1}
  ],
  "context": {
    "fasted": false,
    "sleepDebt": 0.2,
    "stressLevel": 0.5,
    "circadianPhase": "morning"
  },
  "horizonMinutes": 480,
  "resolution": 1
}
```

**Response:**
```json
{
  "ok": true,
  "timestamps": [0, 1, 2, ...],
  "curves": {
    "cortisol": [0.5, 0.52, ...],
    "dopamine": [0.3, 0.35, ...],
    "glucose": [0.4, 0.42, ...]
  },
  "metrics": {
    "stabilityIndex": 0.85,
    "volatilityScore": 0.3,
    "peakCortisol": 0.75,
    "peakDopamine": 0.8
  }
}
```

---

## Phase 4: Frontend UI Integration

### New View: PhysioTimeline.jsx

Replace manual Physio Timeline in main App navigation:
```
TABS = [
  { id: 'dash',    label: 'Heute', Icon: Activity },
  { id: 'session', label: 'Session', Icon: MoonStar },
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'stats',   label: 'Stats', Icon: BarChart3 },
  { id: 'physio',  label: 'Physio', Icon: Zap },  // NEW
]
```

### PhysioTimeline.jsx Structure

```jsx
├─ EventInputPanel (add/remove events)
├─ EventList (display selected events)
├─ SimulationControls (context sliders + simulate button)
└─ PhysioChart (render 3 curves: cortisol, dopamine, glucose)
```

### Chart Library

**Decision:** Nivo line chart (already in package.json recommended libraries)
- Clean API
- Good for time series
- Mobile-friendly

---

## Phase 5: Data Persistence (Optional)

### Session Cache

Store simulation results for later review:
```
data/physio/
├─ YYYY-MM-DD-simulation-001.json
├─ YYYY-MM-DD-simulation-002.json
└─ index.json (metadata)
```

### Extend /session endpoint

Track when user runs simulations + save inputs for education.

---

## Phase 6: Testing & Validation

### Determinism Check

Run same simulation 3 times, verify identical output.

### Edge Cases

1. Empty events array (baseline curve)
2. Multiple concurrent events (interaction stacking)
3. Context modifier variations (fasted vs fed, high stress vs calm)
4. Extreme time horizons (1440 min = 24h)

### Performance

Simulation must complete in <100ms for typical inputs.

---

## Tickets to Create

| ID | Title | Depends On | Priority |
|---|---|---|---|
| RELAX-002-A | Port simulation engine + types | None | Critical |
| RELAX-002-B | Implement /api/physio/simulate endpoint | RELAX-002-A | Critical |
| RELAX-002-C | Build PhysioTimeline view + UI | RELAX-002-B | High |
| RELAX-002-D | Integrate Nivo chart + styling | RELAX-002-C | High |
| RELAX-002-E | Add simulation caching (optional) | RELAX-002-D | Medium |

---

## Timeline Estimate

- **RD-002-A:** 2h (pure porting, no complexity)
- **RD-002-B:** 1h (route + validation)
- **RD-002-C:** 2h (UI components)
- **RD-002-D:** 2h (chart integration + styling)
- **RD-002-E:** 1h (optional caching)

**Total MVP:** 5–7 hours (can be split across sessions)

---

## Migration Checklist

- [ ] Copy engine logic (curves, events, interactions, simulate)
- [ ] Create server/engine/ directory structure
- [ ] Port shared types to server/types.js
- [ ] Add /api/physio/simulate endpoint
- [ ] Test endpoint with curl/httpie
- [ ] Create PhysioTimeline view + components
- [ ] Add Nivo chart rendering
- [ ] Style with Tailwind + CSS variables
- [ ] Add to main App navigation
- [ ] Test end-to-end (UI → API → engine → chart)
- [ ] Documentation + CLAUDE.md update
- [ ] Create relax-dev-tickets.md entries

---

## Notes

- **Not porting:** Monorepo complexity (relax-dev is standalone)
- **Not porting:** React Native specific code (using React web instead)
- **Adapting:** "substances" terminology → "events" (aligns with relax-dev session/event model)
- **New:** Integration with mood/session logging (future enhancement)

