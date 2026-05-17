import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handlePhysioSimulate } from "./server/routes/physio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const DIST_DIR = path.join(__dirname, "dist");
const STATIC_DIR = process.env.RELAX_STATIC_DIR
  ? path.resolve(process.env.RELAX_STATIC_DIR)
  : (fs.existsSync(DIST_DIR) ? DIST_DIR : PUBLIC_DIR);

const PORT = Number(process.env.PORT || 9004);
const HOST = process.env.HOST || "127.0.0.1";

for (const d of ["sessions", "journal"]) fs.mkdirSync(path.join(DATA_DIR, d), { recursive: true });

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".js": "application/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
};

function mime(p) {
  return MIME[path.extname(p)] || "application/octet-stream";
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
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

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function computeSummary(days) {
  const dates = lastDates(days);
  const byTechnique = {};
  const perDay = [];

  let moodDeltaSum = 0;
  let moodDeltaCount = 0;
  let daysWithSessions = 0;

  for (const date of dates) {
    const sess = readJson(path.join(DATA_DIR, "sessions", `${date}.json`));
    const minutes = sumMinutes(sess);
    if (minutes > 0) daysWithSessions++;
    perDay.push({ date, minutes });

    for (const it of (sess?.items || [])) {
      const technique = String(it.technique || "").trim() || "—";
      byTechnique[technique] = (byTechnique[technique] || 0) + (Number(it.minutes) || 0);

      const before = Number(it.mood_before);
      const after = Number(it.mood_after);
      if (Number.isFinite(before) && Number.isFinite(after)) {
        moodDeltaSum += after - before;
        moodDeltaCount++;
      }
    }
  }

  let streak = 0;
  for (const { minutes } of perDay) {
    if (minutes > 0) streak++;
    else break;
  }

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

function parseJsonBody(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function escapeCsvValue(v) {
  return String(v ?? "").replaceAll('"', '""');
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname.replace(/\/$/, "") || "/";

  let rawBody = "";
  if (req.method !== "GET") {
    await new Promise((resolve) => {
      req.on("data", (c) => (rawBody += c));
      req.on("end", resolve);
    });
  }
  const B = () => parseJsonBody(rawBody);

  if (p === "/health") return json(res, 200, { ok: true, service: "relax-dev", port: PORT, uptime: Math.floor(process.uptime()) });

  if (p === "/api/physio/simulate") return handlePhysioSimulate(req, res);

  if (p === "/techniques") {
    return json(res, 200, {
      ok: true,
      techniques: [
        { id: "breath-4-7-8", name: "Atemübung 4-7-8" },
        { id: "box-breath", name: "Box Breathing (4-4-4-4)" },
        { id: "nsdr", name: "NSDR / Yoga Nidra" },
        { id: "bodyscan", name: "Body Scan" },
        { id: "pmr", name: "Progressive Muskelrelaxation (PMR)" },
        { id: "meditation", name: "Meditation (Achtsamkeit)" },
        { id: "stretch", name: "Stretching / Mobility" },
        { id: "walk", name: "Spaziergang (low stress)" },
        { id: "music", name: "Musik + Atmung" },
      ],
    });
  }

  if (p === "/stats/summary") {
    const days = clamp(Number(url.searchParams.get("days") || 14), 1, 365);
    return json(res, 200, { ok: true, summary: computeSummary(days) });
  }

  if (p === "/export/csv") {
    const days = clamp(Number(url.searchParams.get("days") || 14), 1, 365);
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
    return json(res, 200, { ok: true, filename: `relax-${days}d-${localToday()}.csv`, csv });
  }

  if (p === "/session") {
    const date = url.searchParams.get("date") || localToday();
    const file = path.join(DATA_DIR, "sessions", `${date}.json`);

    if (req.method === "GET") {
      const data = readJson(file);
      return data ? json(res, 200, { ok: true, data }) : json(res, 404, { ok: false });
    }

    if (req.method === "POST") {
      const data = B();
      const itemsIn = Array.isArray(data.items) ? data.items : [];
      const items = itemsIn.map((it) => ({
        id: String(it.id || ""),
        technique: String(it.technique || "").trim(),
        minutes: clamp(Number(it.minutes) || 0, 0, 240),
        mood_before: clamp(Number(it.mood_before) || 3, 1, 5),
        mood_after: clamp(Number(it.mood_after) || 3, 1, 5),
        note: String(it.note || "").slice(0, 2000),
      }));
      writeJson(file, { date, items, saved_at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { ok: false, error: "method not allowed" });
  }

  if (p === "/session/history") {
    const limit = clamp(Number(url.searchParams.get("limit") || 10), 1, 365);
    const dir = path.join(DATA_DIR, "sessions");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, limit);
    const sessions = files.map((f) => {
      const d = readJson(path.join(dir, f));
      return { date: f.replace(".json", ""), ...d };
    });
    return json(res, 200, { ok: true, sessions });
  }

  if (p === "/session/latest") {
    const dir = path.join(DATA_DIR, "sessions");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (!files.length) return json(res, 404, { ok: false });
    const data = readJson(path.join(dir, files[0]));
    return json(res, 200, { ok: true, session: { date: files[0].replace(".json", ""), data } });
  }

  if (p === "/journal") {
    const date = url.searchParams.get("date") || localToday();
    const file = path.join(DATA_DIR, "journal", `${date}.md`);

    if (req.method === "GET") {
      if (!fs.existsSync(file)) return json(res, 404, { ok: false });
      const content = fs.readFileSync(file, "utf8");
      const mtime = fs.statSync(file).mtime.toISOString().slice(0, 10);
      return json(res, 200, { ok: true, content, mtime });
    }

    if (req.method === "POST") {
      const { content } = B();
      fs.writeFileSync(file, content || "");
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { ok: false, error: "method not allowed" });
  }

  if (p === "/journal/list") {
    const dir = path.join(DATA_DIR, "journal");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse().slice(0, 50);
    const entries = files.map((f) => {
      const date = f.replace(".md", "");
      const mtime = fs.statSync(path.join(dir, f)).mtime.toISOString();
      return { date, mtime };
    });
    return json(res, 200, { ok: true, entries });
  }

  const themeFile = path.join(DATA_DIR, "theme.json");
  if (p === "/theme") {
    if (req.method === "GET") return json(res, 200, readJson(themeFile, { theme: "mocha" }));
    if (req.method === "POST") {
      writeJson(themeFile, B());
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { ok: false, error: "method not allowed" });
  }

  // ── Static ──
  let file = p === "/" ? "/index.html" : p;
  const abs = path.join(STATIC_DIR, file);
  if (!abs.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  if (!fs.existsSync(abs)) {
    const idx = path.join(STATIC_DIR, "index.html");
    if (fs.existsSync(idx)) {
      res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
      fs.createReadStream(idx).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  res.writeHead(200, { "Content-Type": mime(abs) });
  fs.createReadStream(abs).pipe(res);
});

server.listen(PORT, HOST, () => console.log(`🧘 relax-dev on http://${HOST}:${PORT}`));

