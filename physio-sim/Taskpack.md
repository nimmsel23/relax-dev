Ich gebe dir das so, dass du es direkt als **Codex-Agent Taskpack** verwenden kannst: also sauber getrennte Specs für Backend, Frontend, plus eine “Implementation Map” und passende Open-Source-Bausteine.

---

# 📦 1. FEATURE-DOKUMENTATION (SYSTEM DESIGN)

## 🧠 Feature Name

**Physio Simulation Timeline (PST)**

---

## 🎯 Ziel

Die App soll aus Substanzen + Kontext eine **zeitbasierte Simulation biologischer Signale** erzeugen und als Graph darstellen.

---

## 🧱 Architekturübersicht

```
React Native App
   ↓
API Route: /simulate
   ↓
Node.js Simulation Engine
   ↓
Curve Generator + Interaction Engine
   ↓
Response: Time Series Data
   ↓
Frontend Chart Renderer
```

---

# 🖥️ 2. BACKEND SPEZIFIKATION (Node.js)

## 📁 Struktur

```
/backend
  /src
    /routes
      simulate.route.ts
    /controllers
      simulate.controller.ts
    /services
      simulation.service.ts
      curveEngine.service.ts
      interaction.service.ts
    /models
      substance.model.ts
      session.model.ts
    /utils
      math.utils.ts
```

---

## 🔌 API ROUTE

### POST `/simulate`

#### Request

```ts
{
  substances: [
    { type: "coffee", dose: number },
    { type: "nicotine", dose: number },
    { type: "thc", strength: "low" | "high" }
  ],
  context: {
    fasted: boolean,
    sleepQuality: number, // 0-1
    stressLevel: number   // 0-1
  },
  duration: number, // minutes
  resolution: number // e.g. 1 min step
}
```

---

#### Response

```ts
{
  cortisol: Array<{ t: number, v: number }>,
  dopamine: Array<{ t: number, v: number }>,
  glucose: Array<{ t: number, v: number }>,
  insulin: Array<{ t: number, v: number }>,
  metrics: {
    stabilityIndex: number,
    volatilityScore: number,
    dopamineVariance: number
  }
}
```

---

## ⚙️ Simulation Engine (Core Logic)

### curveEngine.service.ts

```ts
export function spike(peak: number, delay: number, decay: number) {
  return (t: number) => {
    const x = t - delay;
    if (x < 0) return 0;
    return peak * Math.exp(-x / decay);
  };
}
```

---

### interaction.service.ts

```ts
export function applyInteractions(curves, context) {
  return (t: number) => {
    let cortisol = 0;
    let dopamine = 0;
    let glucose = 0;

    for (const c of curves) {
      cortisol += c.cortisol(t);
      dopamine += c.dopamine(t);
      glucose += c.glucose(t);
    }

    if (context.fasted) glucose *= 1.4;

    return { cortisol, dopamine, glucose };
  };
}
```

---

## 📊 Metrics Service

```ts
export function volatility(series: number[]) {
  return Math.max(...series) - Math.min(...series);
}
```

---

# 📱 3. FRONTEND SPEZIFIKATION (React Native)

## 📁 Struktur

```
/app
  /screens
    SimulationScreen.tsx
  /components
    PhysioChart.tsx
    SubstanceInput.tsx
  /api
    simulate.api.ts
  /state
    simulation.store.ts
```

---

## 🧭 ROUTE (React Navigation)

```ts
{
  name: "Simulation",
  component: SimulationScreen
}
```

---

## 🧩 Simulation Screen Flow

```ts
1. User selects substances
2. User sets context (fasted, sleep, stress)
3. Tap "Simulate"
4. Call API /simulate
5. Render PhysioChart
```

---

## 📊 Chart Component

Empfohlen:

👉 **react-native-svg + victory-native**

```bash
npm install victory-native react-native-svg
```

---

### PhysioChart.tsx

```ts
<VictoryChart>
  <VictoryLine data={data.cortisol} />
  <VictoryLine data={data.dopamine} />
  <VictoryLine data={data.glucose} />
</VictoryChart>
```

---

# 🧪 4. CODEx / AGENT TASK DEFINITION

Wenn du einen lokalen Codex-Agenten nutzt, gib ihm dieses Setup:

---

## 🧾 TASK: “Add Physio Simulation Feature”

### Goal:

Implement `/simulate` backend route + React Native screen

---

### Backend Tasks:

* Create `simulation.service.ts`
* Implement:

  * spike()
  * interaction engine
  * metric calculations
* Add route `/simulate`
* Validate request schema

---

### Frontend Tasks:

* Add `SimulationScreen`
* Add navigation route
* Build:

  * Substance selector UI
  * Context toggles
  * Chart renderer
* Call `/simulate` API

---

### Constraints:

* No external AI APIs
* Deterministic math only
* All curves must be reproducible

---

# 🧰 5. OPEN SOURCE PROJEKTE (WICHTIG)

Hier sind echte, brauchbare Tools:

---

## 📊 Charting (React Native)

### 1. Victory Native

[https://formidable.com/open-source/victory/](https://formidable.com/open-source/victory/)

* sehr stabil
* good for line charts
* easy integration

---

### 2. Shopify Skia (BEST OPTION)

[react-native-skia](https://shopify.github.io/react-native-skia/?utm_source=chatgpt.com)

* high performance
* smooth animations
* ideal für “bio curves”

---

## ⚙️ Backend Framework

### 3. Fastify (empfohlen statt Express)

[Fastify](https://fastify.dev/?utm_source=chatgpt.com)

* schneller als Express
* plugin-based
* perfekt für API-only backend

---

## 🧠 Math / Simulation

### 4. mathjs

[mathjs](https://mathjs.org/?utm_source=chatgpt.com)

* curve ops
* interpolation
* statistics

---

### 5. simple-statistics

[simple-statistics](https://simplestatistics.org/?utm_source=chatgpt.com)

* volatility
* variance
* distributions

---

## 🧪 State Management (Frontend)

### 6. Zustand

[Zustand](https://zustand-demo.pmnd.rs/?utm_source=chatgpt.com)

* minimal
* perfect for simulation state

---

## 📡 API Layer

### 7. React Query

[TanStack Query](https://tanstack.com/query/latest?utm_source=chatgpt.com)

* caching simulation results
* avoids recomputation

---

# 🚀 6. BEST PRACTICE ARCHITEKTUR (EMPFEHLUNG)

Wenn du es sauber bauen willst:

## Backend

* Fastify
* TypeScript
* pure functional engine layer

## Frontend

* React Native + Skia
* Zustand + React Query

## Simulation

* stateless pure functions
* no DB logic in engine

---

# 🧠 7. WICHTIGSTER DESIGN SHIFT

Nicht vergessen:

👉 du baust kein Chart Feature
👉 du baust eine **deterministische Bio-Simulation Engine**

---

# Wenn du willst als nächstes:

Ich kann dir direkt liefern:

* komplette **Monorepo Struktur (pnpm + turborepo)**
* fertige **Fastify Boilerplate + /simulate endpoint**
* React Native Screen komplett implementiert
* oder ein **Codex-ready prompt file (1:1 copy/paste)**

Sag einfach 👍
Hier ist eine **saubere, produktionsnahe Monorepo-Struktur mit pnpm + Turborepo**, optimiert für dein Setup (Node.js Simulation Engine + React Native App + Shared Logic).

Ich baue dir das so, dass ein Codex-Agent direkt damit arbeiten kann.

---

# 🧱 1. MONOREPO OVERVIEW

```
physio-sim/
├── apps/
│   ├── api/                # Node.js Backend (Fastify)
│   ├── mobile/            # React Native App (Expo empfohlen)
│
├── packages/
│   ├── engine/            # 🔥 Core Simulation Engine (pure TS)
│   ├── shared/            # Types, DTOs, utils
│   ├── ui/                # Optional shared UI components
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

---

# ⚙️ 2. PNPM WORKSPACE

## `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

# 🚀 3. TURBOREPO CONFIG

## `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

---

# 📦 4. ROOT PACKAGE.JSON

```json
{
  "name": "physio-sim",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

# 🧠 5. SHARED ENGINE PACKAGE (CORE)

## 📁 `packages/engine`

```
engine/
  src/
    curves/
      spike.ts
      ramp.ts
    models/
      substance.ts
    simulation/
      simulate.ts
      interaction.ts
    index.ts
  package.json
  tsconfig.json
```

---

## 📦 `packages/engine/package.json`

```json
{
  "name": "@physio/engine",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w"
  }
}
```

---

## ⚙️ Core Example

### spike.ts

```ts
export const spike = (peak: number, delay: number, decay: number) =>
  (t: number) => {
    const x = t - delay;
    if (x < 0) return 0;
    return peak * Math.exp(-x / decay);
  };
```

---

## simulate.ts

```ts
import { spike } from "../curves/spike";

export function simulateSession(input) {
  const caffeine = {
    cortisol: spike(0.4, 10, 90),
    dopamine: spike(0.2, 20, 120),
    glucose: spike(0.1, 30, 60)
  };

  return caffeine;
}
```

---

# 🌐 6. BACKEND (Fastify API)

## 📁 `apps/api`

```
api/
  src/
    routes/
      simulate.route.ts
    controllers/
      simulate.controller.ts
    server.ts
  package.json
  tsconfig.json
```

---

## server.ts

```ts
import Fastify from "fastify";
import simulateRoute from "./routes/simulate.route";

const app = Fastify();

app.register(simulateRoute);

app.listen({ port: 3000 });
```

---

## simulate.route.ts

```ts
import { simulateSession } from "@physio/engine";

export default async function (app) {
  app.post("/simulate", async (req) => {
    return simulateSession(req.body);
  });
}
```

---

# 📱 7. MOBILE APP (React Native / Expo)

## 📁 `apps/mobile`

```
mobile/
  app/
    screens/
      SimulationScreen.tsx
    components/
      PhysioChart.tsx
    api/
      simulate.ts
  package.json
```

---

## API CALL

```ts
export async function simulate(data) {
  const res = await fetch("http://localhost:3000/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return res.json();
}
```

---

## SimulationScreen.tsx

```ts
import { useState } from "react";
import { simulate } from "../api/simulate";

export default function SimulationScreen() {
  const [data, setData] = useState(null);

  const run = async () => {
    const result = await simulate({
      substances: [{ type: "coffee", dose: 1 }],
      context: { fasted: true }
    });

    setData(result);
  };

  return (
    <>
      <Button title="Simulate" onPress={run} />
      {data && <PhysioChart data={data} />}
    </>
  );
}
```

---

## PhysioChart.tsx (Skia empfohlen)

```bash
pnpm add @shopify/react-native-skia
```

```ts
import { Canvas, Path } from "@shopify/react-native-skia";

export function PhysioChart({ data }) {
  return (
    <Canvas style={{ height: 300 }}>
      {/* render curves */}
    </Canvas>
  );
}
```

---

# 🔁 8. SHARED TYPES (WICHTIG!)

## `packages/shared`

```
shared/
  src/
    types.ts
```

---

## types.ts

```ts
export type Substance = {
  type: "coffee" | "nicotine" | "thc";
  dose?: number;
  strength?: "low" | "high";
};

export type Context = {
  fasted: boolean;
  sleepQuality?: number;
};
```

---

# ⚡ 9. DEV WORKFLOW

## Start alles:

```bash
pnpm install
pnpm dev
```

---

## Turbo macht:

* API dev server
* engine watch build
* mobile expo dev

parallel

---

# 🧠 10. WARUM DAS SETUP GUT IST

✔ Engine ist komplett isoliert (wichtig für Simulation)
✔ Backend nur API Layer
✔ Mobile bleibt dumb renderer
✔ Shared types verhindern Drift
✔ Turbo sorgt für Cache + Speed

---

# 🚀 11. OPTIONAL UPGRADE PATH (später)

Wenn du skalieren willst:

### 1. Engine → WebAssembly (Rust)

* massive performance gains

### 2. API → microservice

* simulation service separat

### 3. Add Redis cache

* precomputed sessions

---

# Wenn du willst als nächsten Schritt:

Ich kann dir direkt liefern:

### 🔥 1. fertiges GitHub Repo Template

### 🔥 2. Codex Agent Prompt (copy/paste automation)

### 🔥 3. komplette Fastify + React Native Boilerplate

### 🔥 4. oder “v1 MVP Build Plan in 48h”

Sag einfach 👍
Hier ist ein **copy/paste fertiger Codex-Agent Prompt**, speziell für dein Setup (Monorepo + Turborepo + Node.js API + React Native + Simulation Engine).

Er ist so geschrieben, dass ein Agent:

* Architektur versteht
* keine falschen Abkürzungen nimmt
* sauber in Packages arbeitet
* deterministisch implementiert

---

# 🤖 CODEx AGENT PROMPT (MASTER TEMPLATE)

```txt
You are an expert full-stack TypeScript engineer working in a Turborepo monorepo using pnpm workspaces.

You are responsible for implementing a "Physio Simulation Timeline" feature across backend and mobile frontend.

---

# 🧠 PROJECT CONTEXT

Monorepo structure:

apps/
  api/        -> Fastify Node.js backend
  mobile/     -> React Native (Expo)
packages/
  engine/     -> Pure simulation engine (NO IO, pure functions only)
  shared/     -> shared types & DTOs

---

# 🎯 FEATURE GOAL

Implement a deterministic physiological simulation system:

Input:
- substances (coffee, nicotine, THC)
- context (fasted, sleep quality, stress)

Output:
- time series curves:
  - cortisol
  - dopamine
  - glucose
  - insulin

- derived metrics:
  - stabilityIndex
  - volatilityScore

---

# ⚙️ HARD RULES

1. Engine MUST be pure functional code (no API, no DB)
2. Backend MUST only orchestrate engine
3. Frontend MUST NOT contain business logic
4. All time series must be deterministic
5. No external AI / ML APIs
6. Use TypeScript strict mode only
7. Do not introduce unnecessary dependencies

---

# 📦 IMPLEMENTATION TASKS

## 1. packages/engine

Implement:

- spike(), ramp(), decay() curve primitives
- substance models:
  caffeine, nicotine, THC
- interaction engine:
  nonlinear stacking rules
- simulateSession(input): returns full curves

---

## 2. apps/api (Fastify)

Create route:

POST /simulate

Responsibilities:
- validate input
- call engine simulateSession()
- compute metrics
- return JSON response

Do NOT implement simulation logic here.

---

## 3. apps/mobile (React Native)

Create screen:

SimulationScreen

Features:
- select substances
- set context (fasted, sleep, stress)
- call /simulate API
- render curves using chart component

Use:
- react-native-skia OR victory-native
- no business logic in UI layer

---

## 4. packages/shared

Define:

- Substance type
- Context type
- SimulationInput
- SimulationOutput

All types MUST be reused across apps.

---

# 📊 OUTPUT FORMAT EXPECTED FROM API

{
  cortisol: [{ t: number, v: number }],
  dopamine: [{ t: number, v: number }],
  glucose: [{ t: number, v: number }],
  insulin: [{ t: number, v: number }],
  metrics: {
    stabilityIndex: number,
    volatilityScore: number
  }
}

---

# 🧠 ENGINE DESIGN PRINCIPLES

- curves = pure functions of time t
- all substances return curve sets
- interaction layer modifies curves non-linearly
- context applies global multipliers
- everything is composable

---

# 🚫 DO NOT

- do NOT mix backend and engine logic
- do NOT hardcode UI logic in engine
- do NOT introduce stateful global variables
- do NOT use class-based architecture unless strictly necessary
- do NOT over-engineer ML or AI components

---

# ✅ SUCCESS CRITERIA

- Running pnpm turbo dev starts all apps
- /simulate returns deterministic output
- mobile renders curves correctly
- engine is fully testable in isolation
- shared types eliminate duplication

---

# 🧪 OPTIONAL (IF TIME)

Add:
- caching layer in API
- unit tests for curve engine
- performance optimization for large simulations

END OF TASK
```

---

# 🧰 WARUM DIESER PROMPT GUT FUNKTIONIERT

Er folgt genau den Mustern aus modernen Codex-Agent Setups:

* klare Boundaries (engine vs API vs UI)
* deterministische Regeln
* explizite Nicht-Ziele
* testbare Outputs
* monorepo-awareness

Das ist wichtig, weil Agenten sonst typischerweise:

* Business Logic ins Frontend schieben
* Engine mit API vermischen
* nicht-deterministische Simulation bauen

---

# 🚀 OPTIONAL NEXT STEP

Wenn du willst, kann ich dir als nächstes bauen:

### 🔥 1. AGENTS.md für dieses Repo (extrem wichtig für Codex)

### 🔥 2. echte Engine Implementation (production-ready TS)

### 🔥 3. React Native Screen + Skia Chart fully working

### 🔥 4. oder CI pipeline (GitHub Actions + Turbo caching)

Sag einfach 👍
