/**
 * Interaction Engine — Compose multiple effects + apply context modifiers
 */

import { clamp } from "./curves.js";

/**
 * Stack multiple curve functions with non-linear compositing
 * Prevents "spike stacking" by using saturation curves instead of simple addition
 * @param {Array} effectCurves - Array of {cortisol, dopamine, glucose} objects
 * @param {Array} events - Original events (for timing interference)
 * @param {Object} context - {fasted, sleepDebt, stressLevel, circadianPhase}
 * @returns {Function} Composite curve function (t) => {cortisol, dopamine, glucose}
 */
function composeEffects(effectCurves, events, context) {
  return (t) => {
    // Non-linear composition: use saturation blending instead of addition
    let cortisol = 0;
    let dopamine = 0;
    let glucose = 0;

    for (const effect of effectCurves) {
      if (effect) {
        const c = effect.cortisol(t);
        const d = effect.dopamine(t);
        const g = effect.glucose(t);

        // Non-linear saturation blending: a + b' = a + (1-a)*b
        // Prevents oversaturation but still allows stacking
        cortisol = saturate(cortisol, c);
        dopamine = saturate(dopamine, d);
        glucose = saturate(glucose, g);
      }
    }

    // Apply interference dampening for closely-timed events
    const interference = getInterferenceDamping(events, t);
    cortisol *= interference;
    dopamine *= interference;
    glucose *= interference;

    // Apply context modifiers
    const modifiers = getContextModifiers(context, t);

    cortisol = clamp(cortisol * modifiers.cortisolMult + modifiers.cortisolAdd);
    dopamine = clamp(dopamine * modifiers.dopamineMult);
    glucose = clamp(glucose * modifiers.glucoseMult + modifiers.glucoseAdd);

    return { cortisol, dopamine, glucose };
  };
}

/**
 * Non-linear saturation blending
 * Instead of a + b, use: a + (1 - a) * b
 * This allows stacking without oversaturation
 * @param {number} current - Current value (0-1)
 * @param {number} effect - Effect to add (0-1)
 * @returns {number} Blended value (0-1)
 */
function saturate(current, effect) {
  return current + (1 - current) * effect;
}

/**
 * Interference dampening: closely-timed events interfere with each other
 * If events are < 60 min apart, reduce their combined effect (physiological fatigue)
 * @param {Array} events - Original events with time property
 * @param {number} t - Current time
 * @returns {number} Damping factor (0.6-1.0)
 */
function getInterferenceDamping(events, t) {
  if (!events || events.length < 2) return 1.0;

  // Find how many events are "active" near time t (within 120 min window)
  const activeCount = events.filter((e) => {
    const timeSinceEvent = t - e.time;
    return timeSinceEvent >= 0 && timeSinceEvent < 120; // Event effect window
  }).length;

  // Multiple events reduce effectiveness (diminishing returns)
  // 1 event = 1.0x, 2 events = 0.85x, 3+ events = 0.7x
  if (activeCount <= 1) return 1.0;
  if (activeCount === 2) return 0.85;
  return 0.7;
}

/**
 * Calculate context-based multipliers
 * @param {Object} context - {fasted, sleepDebt, stressLevel, circadianPhase}
 * @param {number} t - Current time (for circadian effects)
 * @returns {Object} Multiplier object
 */
function getContextModifiers(context, t) {
  const {
    fasted = false,
    sleepDebt = 0,
    stressLevel = 0,
    circadianPhase = "morning",
  } = context;

  let cortisolMult = 1;
  let cortisolAdd = 0;
  let dopamineMult = 1;
  let glucoseMult = 1;
  let glucoseAdd = 0;

  // Fasted state: more volatile glucose, higher cortisol
  if (fasted) {
    glucoseMult *= 1.4;
    cortisolMult *= 1.15;
  }

  // Sleep debt: elevated baseline cortisol, reduced dopamine resilience
  if (sleepDebt > 0) {
    cortisolAdd += sleepDebt * 0.3; // Persistent elevation
    dopamineMult *= Math.max(0.6, 1 - sleepDebt * 0.5);
  }

  // Chronic stress: blunted cortisol response, dopamine dysregulation
  if (stressLevel > 0) {
    // Paradoxically, very high stress can blunt cortisol (HPA burnout)
    if (stressLevel > 0.7) {
      cortisolMult *= 0.8;
    } else {
      cortisolMult *= 1 + stressLevel * 0.2;
    }
    dopamineMult *= Math.max(0.5, 1 - stressLevel * 0.6);
  }

  // Circadian modulation: cortisol highest in early morning
  const circadianBoost = getCircadianCortisol(circadianPhase, t);
  cortisolAdd += circadianBoost;

  return {
    cortisolMult,
    cortisolAdd,
    dopamineMult,
    glucoseMult,
    glucoseAdd,
  };
}

/**
 * Circadian rhythm effect on cortisol
 * Models natural cortisol awakening response (CAR) + circadian decline
 * @param {string} phase - "morning" | "afternoon" | "evening"
 * @param {number} t - Time in simulation
 * @returns {number} Cortisol boost/suppression
 */
function getCircadianCortisol(phase, t) {
  // Simplified: just phase-based adjustment
  // In real model, this would be time-of-day dependent
  switch (phase) {
    case "morning":
      return 0.2; // Morning cortisol peak
    case "afternoon":
      return 0.1;
    case "evening":
      return -0.15; // Evening suppression (melatonin rise)
    default:
      return 0;
  }
}

/**
 * Calculate interaction synergies (non-linear effects)
 * Example: caffeine + nicotine = stronger dopamine response
 * @param {Object} compositeValue - {cortisol, dopamine, glucose}
 * @param {Array} events - Original events array
 * @returns {Object} Adjusted values with synergies
 */
function applySynergies(compositeValue, events) {
  const { cortisol, dopamine, glucose } = compositeValue;

  // Check for caffeine + nicotine combo
  const hasCaffeine = events.some((e) => e.type === "coffee");
  const hasNicotine = events.some((e) => e.type === "nicotine");

  if (hasCaffeine && hasNicotine) {
    // Synergy: stronger dopamine + cortisol response
    return {
      cortisol: clamp(cortisol * 1.2),
      dopamine: clamp(dopamine * 1.3), // Amplified synergy
      glucose: glucose,
    };
  }

  // Check for THC + stress (amplifies negative effects)
  const hasThc = events.some((e) => e.type === "thc");
  if (hasThc && compositeValue.stressLevel > 0.5) {
    return {
      cortisol: clamp(cortisol * 1.15),
      dopamine: clamp(dopamine * 0.8), // Reduced dopamine under stress
      glucose: glucose,
    };
  }

  return compositeValue;
}

export { composeEffects, getContextModifiers, getCircadianCortisol, applySynergies };
