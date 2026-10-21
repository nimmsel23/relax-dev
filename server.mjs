import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { handlePhysioSimulate } from "./server/routes/physio.js";
import { handleKnowledgeAPI } from "./server/routes/knowledge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const DIST_DIR = path.join(__dirname, "dist");
const STATIC_DIR = process.env.RELAX_STATIC_DIR
  ? path.resolve(process.env.RELAX_STATIC_DIR)
  : (fs.existsSync(DIST_DIR) ? DIST_DIR : PUBLIC_DIR);

const PORT = Number(process.env.PORT || 9123);
const HOST = process.env.HOST || "127.0.0.1";
const BRIDGE_URL = process.env.BRIDGE_URL || "http://127.0.0.1:9080";

for (const d of ["sessions", "journal"]) fs.mkdirSync(path.join(DATA_DIR, d), { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────────

function firestoreSync(date) {
  const url = `${BRIDGE_URL}/api/relax-firestore/sync?date=${date}`;
  http.request(url, { method: "POST" }, (r) => r.resume())
    .on("error", () => {})
    .end();
}

function readJson(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return fallback; }
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lastDates(days) {
  const out = [];
  const base = new Date(localToday() + "T12:00:00");
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return out;
}

function sumMinutes(session) {
  return (session?.items || []).reduce((a, it) => a + (Number(it.minutes) || 0), 0);
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

function computeSummary(days) {
  const dates = lastDates(days);
  const byTechnique = {};
  const perDay = [];
  let moodDeltaSum = 0, moodDeltaCount = 0, daysWithSessions = 0;

  for (const date of dates) {
    const sess = readJson(path.join(DATA_DIR, "sessions", `${date}.json`));
    const minutes = sumMinutes(sess);
    if (minutes > 0) daysWithSessions++;
    perDay.push({ date, minutes });

    for (const it of (sess?.items || [])) {
      const technique = String(it.technique || "").trim() || "—";
      byTechnique[technique] = (byTechnique[technique] || 0) + (Number(it.minutes) || 0);
      const before = Number(it.mood_before), after = Number(it.mood_after);
      if (Number.isFinite(before) && Number.isFinite(after)) { moodDeltaSum += after - before; moodDeltaCount++; }
    }
  }

  let streak = 0;
  for (const { minutes } of perDay) { if (minutes > 0) streak++; else break; }

  return {
    days,
    total_minutes: perDay.reduce((a, d) => a + (d.minutes || 0), 0),
    days_with_sessions: daysWithSessions,
    streak_days: streak,
    avg_mood_delta: moodDeltaCount ? (moodDeltaSum / moodDeltaCount) : 0,
    by_technique: byTechnique,
    per_day: perDay,
  };
}

function escapeCsvValue(v) { return String(v ?? "").replaceAll('"', '""'); }

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  return (dx && dy) ? num / Math.sqrt(dx * dy) : 0;
}

function computeTrends(days) {
  const dates = lastDates(days).reverse();
  const perDay = [];
  const techniqueStats = {};

  for (const date of dates) {
    const sess = readJson(path.join(DATA_DIR, "sessions", date + ".json"));
    const items = sess?.items || [];
    const minutes = sumMinutes(sess);
    let deltaSum = 0, deltaCount = 0;

    for (const it of items) {
      const before = Number(it.mood_before), after = Number(it.mood_after);
      if (Number.isFinite(before) && Number.isFinite(after)) { deltaSum += after - before; deltaCount++; }
      const technique = String(it.technique || "").trim() || "—";
      const t = (techniqueStats[technique] ||= { minutes: 0, sessions: 0, delta_sum: 0, delta_count: 0 });
      t.minutes += Number(it.minutes) || 0;
      t.sessions += 1;
      if (Number.isFinite(before) && Number.isFinite(after)) { t.delta_sum += after - before; t.delta_count++; }
    }

    perDay.push({ date, minutes, avg_mood_delta: deltaCount ? +(deltaSum / deltaCount).toFixed(2) : null });
  }

  const rolling = perDay.map((d, i) => {
    const slice = perDay.slice(Math.max(0, i - 6), i + 1);
    return { date: d.date, avg_minutes_7d: +(slice.reduce((a, s) => a + s.minutes, 0) / slice.length).toFixed(1) };
  });

  const active = perDay.filter((d) => d.avg_mood_delta !== null);
  const correlation = pearson(active.map((d) => d.minutes), active.map((d) => d.avg_mood_delta));

  const techniqueRanking = Object.entries(techniqueStats)
    .map(([technique, t]) => ({
      technique,
      minutes: t.minutes,
      sessions: t.sessions,
      avg_mood_delta: t.delta_count ? +(t.delta_sum / t.delta_count).toFixed(2) : null,
    }))
    .sort((a, b) => (b.avg_mood_delta ?? -99) - (a.avg_mood_delta ?? -99));

  const weeks = {};
  for (const d of perDay) {
    const [y, m, day] = d.date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, day));
    dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
    const key = dt.toISOString().slice(0, 10);
    const w = (weeks[key] ||= { week_start: key, minutes: 0, days_active: 0 });
    w.minutes += d.minutes;
    if (d.minutes > 0) w.days_active += 1;
  }

  return {
    days,
    per_day: perDay,
    rolling_7d_minutes: rolling,
    correlation_minutes_vs_mood_delta: +correlation.toFixed(3),
    technique_ranking: techniqueRanking,
    weekly: Object.values(weeks),
  };
}

// ── Fastify

const app = Fastify({ logger: false });

app.addHook("onRequest", (_req, reply, done) => {
  reply.header("Access-Control-Allow-Origin", "*");
  done();
});

app.options("*", (_req, reply) => reply.code(204).send());

// Static files (SPA fallback handled by setNotFoundHandler)
if (fs.existsSync(STATIC_DIR)) {
  app.register(fastifyStatic, { root: STATIC_DIR, wildcard: false, index: "index.html" });
}

// ── API Routes ─────────────────────────────────────────────────────────────────

app.get("/health", (_req, reply) =>
  reply.send({ ok: true, service: "relax-dev", port: PORT, uptime: Math.floor(process.uptime()) })
);

app.get("/techniques", (_req, reply) =>
  reply.send({
    ok: true,
    techniques: [
      { id: "breath-4-7-8", name: "Atemübung 4-7-8" },
      { id: "box-breath",   name: "Box Breathing (4-4-4-4)" },
      { id: "nsdr",         name: "NSDR / Yoga Nidra" },
      { id: "bodyscan",     name: "Body Scan" },
      { id: "pmr",          name: "Progressive Muskelrelaxation (PMR)" },
      { id: "meditation",   name: "Meditation (Achtsamkeit)" },
      { id: "stretch",      name: "Stretching / Mobility" },
      { id: "walk",         name: "Spaziergang (low stress)" },
      { id: "music",        name: "Musik + Atmung" },
    ],
  })
);

app.get("/stats/summary", (req, reply) => {
  const days = clamp(Number(req.query.days || 14), 1, 365);
  return reply.send({ ok: true, summary: computeSummary(days) });
});

app.get("/stats/trends", (req, reply) => {
  const days = clamp(Number(req.query.days || 30), 2, 365);
  return reply.send({ ok: true, trends: computeTrends(days) });
});

app.get("/export/csv", (req, reply) => {
  const days = clamp(Number(req.query.days || 14), 1, 365);
  const dates = lastDates(days).reverse();
  const rows = [["date", "technique", "minutes", "mood_before", "mood_after", "note"]];

  for (const date of dates) {
    const sess = readJson(path.join(DATA_DIR, "sessions", `${date}.json`));
    for (const it of (sess?.items || [])) {
      rows.push([
        date,
        escapeCsvValue(it.technique),
        String(Number(it.minutes) || 0),
        String(Number(it.mood_before) || ""),
        String(Number(it.mood_after) || ""),
        escapeCsvValue(it.note),
      ]);
    }
  }

  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n") + "\n";
  return reply.send({ ok: true, filename: `relax-${days}d-${localToday()}.csv`, csv });
});

// ── Session ────────────────────────────────────────────────────────────────────

app.get("/session", (req, reply) => {
  const date = req.query.date || localToday();
  const data = readJson(path.join(DATA_DIR, "sessions", `${date}.json`));
  return data ? reply.send({ ok: true, data }) : reply.code(404).send({ ok: false });
});

app.post("/session", (req, reply) => {
  const date = req.query.date || localToday();
  const file = path.join(DATA_DIR, "sessions", `${date}.json`);
  const itemsIn = Array.isArray(req.body?.items) ? req.body.items : [];
  const items = itemsIn.map((it) => ({
    id: String(it.id || ""),
    technique: String(it.technique || "").trim(),
    minutes: clamp(Number(it.minutes) || 0, 0, 240),
    mood_before: clamp(Number(it.mood_before) || 3, 1, 5),
    mood_after: clamp(Number(it.mood_after) || 3, 1, 5),
    note: String(it.note || "").slice(0, 2000),
  }));
  writeJson(file, { date, items, saved_at: new Date().toISOString() });
  firestoreSync(date);
  return reply.send({ ok: true });
});

app.get("/session/history", (req, reply) => {
  const limit = clamp(Number(req.query.limit || 10), 1, 365);
  const dir = path.join(DATA_DIR, "sessions");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, limit);
  const sessions = files.map((f) => ({ date: f.replace(".json", ""), ...readJson(path.join(dir, f)) }));
  return reply.send({ ok: true, sessions });
});

app.get("/session/latest", (_, reply) => {
  const dir = path.join(DATA_DIR, "sessions");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
  if (!files.length) return reply.code(404).send({ ok: false });
  const data = readJson(path.join(dir, files[0]));
  return reply.send({ ok: true, session: { date: files[0].replace(".json", ""), data } });
});

// ── Journal ────────────────────────────────────────────────────────────────────

app.get("/journal", (req, reply) => {
  const date = req.query.date || localToday();
  const file = path.join(DATA_DIR, "journal", `${date}.md`);
  if (!fs.existsSync(file)) return reply.code(404).send({ ok: false });
  const content = fs.readFileSync(file, "utf8");
  const mtime = fs.statSync(file).mtime.toISOString().slice(0, 10);
  return reply.send({ ok: true, content, mtime });
});

app.post("/journal", (req, reply) => {
  const date = req.query.date || localToday();
  const file = path.join(DATA_DIR, "journal", `${date}.md`);
  fs.writeFileSync(file, req.body?.content || "");
  firestoreSync(date);
  return reply.send({ ok: true });
});

app.get("/journal/list", (_, reply) => {
  const dir = path.join(DATA_DIR, "journal");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse().slice(0, 50);
  const entries = files.map((f) => ({
    date: f.replace(".md", ""),
    mtime: fs.statSync(path.join(dir, f)).mtime.toISOString(),
  }));
  return reply.send({ ok: true, entries });
});

// ── Theme ──────────────────────────────────────────────────────────────────────

const themeFile = path.join(DATA_DIR, "theme.json");

app.get("/theme", (_req, reply) => reply.send(readJson(themeFile, { theme: "mocha" })));

app.post("/theme", (req, reply) => {
  writeJson(themeFile, req.body);
  return reply.send({ ok: true });
});

// ── Relaxation Session Logger Endpoints ────────────────────────────────────────

app.get("/relaxation/sessions/progress", (_req, reply) => {
  const dir = path.join(DATA_DIR, "sessions");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return reply.send({ total: files.length });
});

app.post("/relaxation/session", (req, reply) => {
  const { datum, methode, dauer, ort, tageszeit, notizen } = req.body || {};
  const date = datum || localToday();
  const file = path.join(DATA_DIR, "sessions", `${date}.json`);
  
  let session = readJson(file, { date, items: [] });
  
  let minutes = 30;
  if (dauer) {
    const m = String(dauer).match(/^(\d+)/);
    if (m) minutes = parseInt(m[1], 10);
  }
  
  let note = notizen || "";
  let meta = [];
  if (ort) meta.push(`Ort: ${ort}`);
  if (tageszeit) meta.push(`Tageszeit: ${tageszeit}`);
  if (meta.length > 0) {
    note = `[${meta.join(", ")}] ${note}`.trim();
  }
  
  const newItem = {
    id: crypto.randomUUID?.() || String(Date.now()),
    technique: methode || "Progressive Muskelrelaxation (PMR)",
    minutes: clamp(minutes, 0, 240),
    mood_before: 3,
    mood_after: 4,
    note: note.slice(0, 2000),
  };
  
  session.items.push(newItem);
  writeJson(file, session);
  firestoreSync(date);
  
  const dir = path.join(DATA_DIR, "sessions");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const total = files.length;
  
  return reply.send({
    session_nr: total,
    total: total,
    remaining: Math.max(0, 30 - total)
  });
});

// ── Legacy raw handlers (Knowledge + Physio) ──────────────────────────────────
// These write directly to reply.raw — hijack tells Fastify not to touch the response.

app.all("/api/knowledge/*", (req, reply) => {
  reply.hijack();
  return handleKnowledgeAPI(req.raw, reply.raw, req.url, req.body ?? {});
});

app.all("/api/physio/*", (req, reply) => {
  reply.hijack();
  return handlePhysioSimulate(req.raw, reply.raw, req.body ?? {});
});

// ── SPA Fallback ───────────────────────────────────────────────────────────────

app.setNotFoundHandler((_req, reply) => {
  const idx = path.join(STATIC_DIR, "index.html");
  if (fs.existsSync(idx)) {
    reply.type("text/html").send(fs.readFileSync(idx));
  } else {
    reply.code(404).send("Not Found");
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`🧘 relax-dev on http://${HOST}:${PORT}`);
});
