/**
 * Physio Simulation API Route Handler
 * POST /api/physio/simulate
 */

import { simulateSession } from "../engine/simulate.js";

/**
 * Validate simulation input
 * @param {Object} body - Request body
 * @returns {Object} {valid, error} or {valid, data}
 */
function validateInput(body) {
  if (!body) {
    return { valid: false, error: "Request body required" };
  }

  const { events, context, horizonMinutes, resolution } = body;

  // Validate events
  if (events !== undefined && !Array.isArray(events)) {
    return { valid: false, error: "events must be array" };
  }

  if (events && events.length > 0) {
    for (const event of events) {
      if (!event.type) {
        return {
          valid: false,
          error: 'each event must have type ("coffee"|"nicotine"|"thc"|"meal")',
        };
      }
      if (!["coffee", "nicotine", "thc", "meal"].includes(event.type)) {
        return { valid: false, error: `unknown event type: ${event.type}` };
      }
      if (typeof event.time !== "number" || event.time < 0) {
        return { valid: false, error: "event.time must be non-negative number" };
      }
    }
  }

  // Validate context
  if (context !== undefined && typeof context !== "object") {
    return { valid: false, error: "context must be object" };
  }

  if (context && context.sleepDebt !== undefined) {
    if (typeof context.sleepDebt !== "number" || context.sleepDebt < 0 || context.sleepDebt > 1) {
      return { valid: false, error: "context.sleepDebt must be 0-1" };
    }
  }

  if (context && context.stressLevel !== undefined) {
    if (typeof context.stressLevel !== "number" || context.stressLevel < 0 || context.stressLevel > 1) {
      return { valid: false, error: "context.stressLevel must be 0-1" };
    }
  }

  // Validate horizonMinutes
  if (horizonMinutes !== undefined) {
    if (typeof horizonMinutes !== "number" || horizonMinutes <= 0 || horizonMinutes > 1440) {
      return { valid: false, error: "horizonMinutes must be 1-1440" };
    }
  }

  // Validate resolution
  if (resolution !== undefined) {
    if (typeof resolution !== "number" || resolution <= 0 || resolution > horizonMinutes) {
      return { valid: false, error: "resolution must be positive number <= horizonMinutes" };
    }
  }

  return {
    valid: true,
    data: {
      events: events || [],
      context: context || {},
      horizonMinutes: horizonMinutes || 480,
      resolution: resolution || 1,
    },
  };
}

/**
 * POST /api/physio/simulate handler
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 */
export async function handlePhysioSimulate(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "method not allowed" }));
    return;
  }

  // Parse body
  let body = "";
  await new Promise((resolve) => {
    req.on("data", (chunk) => (body += chunk));
    req.on("end", resolve);
  });

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "invalid JSON" }));
    return;
  }

  // Validate input
  const validation = validateInput(parsedBody);
  if (!validation.valid) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: validation.error }));
    return;
  }

  // Run simulation
  const result = simulateSession(validation.data);

  if (!result.ok) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: result.error }));
    return;
  }

  // Return success
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result));
}
