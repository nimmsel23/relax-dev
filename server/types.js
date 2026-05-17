/**
 * Shared Types for Physio Simulation Engine
 * Pure type definitions (JSDoc comments)
 */

/**
 * @typedef {Object} Event
 * @property {string} type - "coffee" | "nicotine" | "thc" | "meal"
 * @property {number} time - Minutes from start
 * @property {number} [dose] - Dose (1-10 scale)
 * @property {string} [strength] - "low" | "high" (for THC)
 * @property {string} [macro] - "carbs" | "protein" | "fat" (for meal)
 */

/**
 * @typedef {Object} ContextModifiers
 * @property {boolean} fasted - Is fasted state?
 * @property {number} sleepDebt - 0-1 (0=well rested, 1=severe debt)
 * @property {number} stressLevel - 0-1 (0=calm, 1=high stress)
 * @property {string} [circadianPhase] - "morning" | "afternoon" | "evening"
 */

/**
 * @typedef {Object} SimulationInput
 * @property {Event[]} events - Lifestyle events
 * @property {ContextModifiers} context - Environmental context
 * @property {number} horizonMinutes - Total simulation duration
 * @property {number} [resolution] - Sample rate (default 1 min)
 */

/**
 * @typedef {Object} CurvePoint
 * @property {number} t - Time (minutes)
 * @property {number} v - Value (0-1 normalized)
 */

/**
 * @typedef {Object} SimulationOutput
 * @property {boolean} ok - Success flag
 * @property {number[]} timestamps - Time points
 * @property {Object} curves - Physiological curves
 * @property {number[]} curves.cortisol - Cortisol time series
 * @property {number[]} curves.dopamine - Dopamine time series
 * @property {number[]} curves.glucose - Glucose time series
 * @property {Object} metrics - Derived metrics
 * @property {number} metrics.stabilityIndex - Inverse variance (0-1)
 * @property {number} metrics.volatilityScore - Peak-trough amplitude
 * @property {number} [metrics.peakCortisol] - Max cortisol value
 * @property {number} [metrics.peakDopamine] - Max dopamine value
 */

// Type definitions are exported as JSDoc for IDE support
// Runtime validation happens in route handler
export {};
