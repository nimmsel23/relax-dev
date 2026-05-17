# Physio Simulation Engine

Pure functional deterministic physiological simulation system.

**Principle:** Model cortisol, dopamine, glucose responses to lifestyle events (coffee, meals, nicotine, THC) with context modifiers.

## Files

- **curves.js** — Primitive curve functions: spike(), ramp(), decay()
- **events.js** — Event effects: coffeeEffect(), mealEffect(), etc.
- **interactions.js** — Compose effects + apply context modifiers
- **simulate.js** — Main orchestrator: simulateSession()
- **types.js** — Shared JSDoc type definitions

## Usage

```js
const { simulateSession } = require("./simulate");

const result = simulateSession({
  events: [
    { type: "coffee", time: 0, dose: 1 },
    { type: "meal", time: 120, macro: "carbs" }
  ],
  context: {
    fasted: false,
    sleepDebt: 0.1,
    stressLevel: 0.3,
    circadianPhase: "morning"
  },
  horizonMinutes: 480,
  resolution: 1
});

console.log(result.curves.cortisol);  // [0.2, 0.21, ...]
console.log(result.metrics);          // {stabilityIndex, volatilityScore, ...}
```

## Design Principles

✔ Pure functions only (no side effects)
✔ Deterministic (same input = same output)
✔ No external dependencies
✔ Composable curves
✔ Context-aware modifiers
✔ Synergy detection

## Determinism

All randomness is removed. Every call with identical input produces identical output.

Use for:
- Client education (show cause-effect)
- Curriculum examples
- Research data
- Reproducible demonstrations
