/**
 * Main Simulation Orchestrator
 * Deterministic physiological simulation engine
 */

import { getEventEffect } from "./events.js";
import { composeEffects, applySynergies } from "./interactions.js";

/**
 * Run complete simulation
 * @param {Object} input - {events, context, horizonMinutes, resolution}
 * @returns {Object} Simulation output {timestamps, curves, metrics}
 */
function simulateSession(input) {
  const {
    events = [],
    context = {},
    horizonMinutes = 480,
    resolution = 1,
  } = input;

  // Validate input
  if (!Array.isArray(events)) {
    return { ok: false, error: "events must be array" };
  }
  if (horizonMinutes <= 0 || horizonMinutes > 1440) {
    return { ok: false, error: "horizonMinutes must be 1-1440" };
  }

  // Generate effect curves for each event
  const effectCurves = events
    .map((event) => getEventEffect(event))
    .filter((e) => e !== null);

  // Create composite curve function (with event interference damping)
  const compositeCurve = composeEffects(effectCurves, events, context);

  // Generate time series data
  const timestamps = [];
  const cortisol = [];
  const dopamine = [];
  const glucose = [];

  for (let t = 0; t <= horizonMinutes; t += resolution) {
    const values = compositeCurve(t);

    timestamps.push(t);
    cortisol.push(values.cortisol);
    dopamine.push(values.dopamine);
    glucose.push(values.glucose);
  }

  // Apply synergies to final output
  const synergizedValues = applySynergies(
    {
      cortisol: cortisol[cortisol.length - 1],
      dopamine: dopamine[dopamine.length - 1],
      glucose: glucose[glucose.length - 1],
      stressLevel: context.stressLevel || 0,
    },
    events
  );

  // Calculate metrics
  const metrics = calculateMetrics(cortisol, dopamine, glucose);

  return {
    ok: true,
    timestamps,
    curves: {
      cortisol,
      dopamine,
      glucose,
    },
    metrics,
  };
}

/**
 * Calculate derived metrics
 * @param {number[]} cortisol - Cortisol time series
 * @param {number[]} dopamine - Dopamine time series
 * @param {number[]} glucose - Glucose time series
 * @returns {Object} Metrics object
 */
function calculateMetrics(cortisol, dopamine, glucose) {
  const stabilityIndex = calculateStability(cortisol);
  const volatilityScore = calculateVolatility(cortisol, dopamine, glucose);

  return {
    stabilityIndex: Math.round(stabilityIndex * 100) / 100,
    volatilityScore: Math.round(volatilityScore * 100) / 100,
    peakCortisol: Math.max(...cortisol),
    peakDopamine: Math.max(...dopamine),
    peakGlucose: Math.max(...glucose),
    avgCortisol: (cortisol.reduce((a, b) => a + b) / cortisol.length).toFixed(2),
  };
}

/**
 * Stability = inverse of variance (smoother = higher stability)
 * @param {number[]} series - Time series values
 * @returns {number} 0-1 score
 */
function calculateStability(series) {
  if (series.length < 2) return 1;

  const mean = series.reduce((a, b) => a + b) / series.length;
  const variance =
    series.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    series.length;
  const stdDev = Math.sqrt(variance);

  // Inverse: lower stdDev = higher stability
  return Math.max(0, 1 - stdDev);
}

/**
 * Volatility = peak-to-trough amplitude across all curves
 * @param {number[]} cortisol
 * @param {number[]} dopamine
 * @param {number[]} glucose
 * @returns {number} 0-1 score
 */
function calculateVolatility(cortisol, dopamine, glucose) {
  const cortisolVol = Math.max(...cortisol) - Math.min(...cortisol);
  const dopamineVol = Math.max(...dopamine) - Math.min(...dopamine);
  const glucoseVol = Math.max(...glucose) - Math.min(...glucose);

  // Average amplitude across all hormones
  return (cortisolVol + dopamineVol + glucoseVol) / 3;
}

export { simulateSession, calculateMetrics, calculateStability, calculateVolatility };
