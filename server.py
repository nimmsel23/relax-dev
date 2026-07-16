import os
import json
import csv
import time
import uuid
import re
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Request, Response, Query, HTTPException, BackgroundTasks, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

app = FastAPI(title="Relax Dev API (FastAPI)", version="0.2.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PUBLIC_DIR = BASE_DIR / "public"
DIST_DIR = BASE_DIR / "dist"
STATIC_DIR = Path(os.getenv("RELAX_STATIC_DIR", str(DIST_DIR if DIST_DIR.exists() else PUBLIC_DIR)))

BRIDGE_URL = os.getenv("BRIDGE_URL", "http://127.0.0.1:9080")
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://127.0.0.1:9123")

# Ensure data directories exist
(DATA_DIR / "sessions").mkdir(parents=True, exist_ok=True)
(DATA_DIR / "journal").mkdir(parents=True, exist_ok=True)

# Start time for uptime
start_time = time.time()

# ── Helpers ────────────────────────────────────────────────────────────────────

def firestore_sync(date_str: str):
    url = f"{BRIDGE_URL}/api/relax-firestore/sync?date={date_str}"
    try:
        # Fire-and-forget sync request
        with httpx.Client() as client:
            client.post(url, timeout=2.0)
    except Exception:
        # Ignore connectivity/sync errors just like original node backend
        pass

def read_json(p: Path, default=None):
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default

def write_json(p: Path, data: Any):
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"Error writing json to {p}: {e}")

def local_today() -> str:
    return datetime.now().strftime("%Y-%m-%d")

def last_dates(days: int) -> List[str]:
    today = datetime.now()
    dates = []
    for i in range(days):
        d = today - timedelta(days=i)
        dates.append(d.strftime("%Y-%m-%d"))
    return dates

def sum_minutes(session: Optional[Dict[str, Any]]) -> int:
    if not session or "items" not in session:
        return 0
    return sum(int(it.get("minutes") or 0) for it in session["items"])

def compute_summary(days: int) -> Dict[str, Any]:
    dates = last_dates(days)
    by_technique = {}
    per_day = []
    mood_delta_sum = 0.0
    mood_delta_count = 0
    days_with_sessions = 0

    for date in dates:
        session_file = DATA_DIR / "sessions" / f"{date}.json"
        sess = read_json(session_file)
        minutes = sum_minutes(sess)
        if minutes > 0:
            days_with_sessions += 1
        per_day.append({"date": date, "minutes": minutes})

        if sess and "items" in sess:
            for it in sess["items"]:
                tech = str(it.get("technique") or "").strip() or "—"
                by_technique[tech] = by_technique.get(tech, 0) + int(it.get("minutes") or 0)
                before = it.get("mood_before")
                after = it.get("mood_after")
                if before is not None and after is not None:
                    try:
                        mood_delta_sum += float(after) - float(before)
                        mood_delta_count += 1
                    except (ValueError, TypeError):
                        pass

    # Streak calculation
    streak = 0
    for day in per_day:
        if day["minutes"] > 0:
            streak += 1
        else:
            break

    return {
        "days": days,
        "total_minutes": sum(d["minutes"] for d in per_day),
        "days_with_sessions": days_with_sessions,
        "streak_days": streak,
        "avg_mood_delta": (mood_delta_sum / mood_delta_count) if mood_delta_count > 0 else 0.0,
        "by_technique": by_technique,
        "per_day": per_day,
    }

# ── API Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "relax-dev",
        "port": 9123,
        "uptime": int(time.time() - start_time)
    }

@app.get("/techniques")
def get_techniques():
    return {
        "ok": True,
        "techniques": [
            { "id": "breath-4-7-8", "name": "Atemübung 4-7-8" },
            { "id": "box-breath",   "name": "Box Breathing (4-4-4-4)" },
            { "id": "nsdr",         "name": "NSDR / Yoga Nidra" },
            { "id": "bodyscan",     "name": "Body Scan" },
            { "id": "pmr",          "name": "Progressive Muskelrelaxation (PMR)" },
            { "id": "meditation",   "name": "Meditation (Achtsamkeit)" },
            { "id": "stretch",      "name": "Stretching / Mobility" },
            { "id": "walk",         "name": "Spaziergang (low stress)" },
            { "id": "music",        "name": "Musik + Atmung" }
        ]
    }

@app.get("/stats/summary")
def get_stats_summary(days: int = Query(14, ge=1, le=365)):
    return { "ok": True, "summary": compute_summary(days) }

@app.get("/export/csv")
def export_csv(days: int = Query(14, ge=1, le=365)):
    dates = last_dates(days)
    dates.reverse() # chronologically sorted
    
    import io
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    writer.writerow(["date", "technique", "minutes", "mood_before", "mood_after", "note"])
    
    for date in dates:
        session_file = DATA_DIR / "sessions" / f"{date}.json"
        sess = read_json(session_file)
        if sess and "items" in sess:
            for it in sess["items"]:
                writer.writerow([
                    date,
                    it.get("technique", ""),
                    str(int(it.get("minutes") or 0)),
                    str(it.get("mood_before") or ""),
                    str(it.get("mood_after") or ""),
                    it.get("note", "")
                ])
                
    csv_content = output.getvalue()
    filename = f"relax-{days}d-{local_today()}.csv"
    return { "ok": True, "filename": filename, "csv": csv_content }

# ── Session ────────────────────────────────────────────────────────────────────

@app.get("/session")
def get_session(date: Optional[str] = Query(None)):
    date_str = date or local_today()
    session_file = DATA_DIR / "sessions" / f"{date_str}.json"
    data = read_json(session_file)
    if data:
        return { "ok": True, "data": data }
    raise HTTPException(status_code=404, detail={ "ok": False })

@app.post("/session")
def save_session(background_tasks: BackgroundTasks, payload: Dict[str, Any], date: Optional[str] = Query(None)):
    date_str = date or local_today()
    session_file = DATA_DIR / "sessions" / f"{date_str}.json"
    
    items_in = payload.get("items")
    if not isinstance(items_in, list):
        items_in = []
        
    items = []
    for it in items_in:
        try:
            minutes = min(240, max(0, int(it.get("minutes") or 0)))
            mood_before = min(5, max(1, int(it.get("mood_before") or 3)))
            mood_after = min(5, max(1, int(it.get("mood_after") or 3)))
        except (ValueError, TypeError):
            minutes = 0
            mood_before = 3
            mood_after = 3
            
        items.append({
            "id": str(it.get("id") or ""),
            "technique": str(it.get("technique") or "").strip(),
            "minutes": minutes,
            "mood_before": mood_before,
            "mood_after": mood_after,
            "note": str(it.get("note") or "")[:2000]
        })
        
    write_json(session_file, {
        "date": date_str,
        "items": items,
        "saved_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    })
    
    background_tasks.add_task(firestore_sync, date_str)
    return { "ok": True }

@app.get("/session/history")
def get_session_history(limit: int = Query(10, ge=1, le=365)):
    sessions_dir = DATA_DIR / "sessions"
    files = sorted([f for f in sessions_dir.glob("*.json")], key=lambda x: x.name, reverse=True)[:limit]
    sessions = []
    for f in files:
        data = read_json(f)
        if data:
            sessions.append({ "date": f.stem, **data })
    return { "ok": True, "sessions": sessions }

@app.get("/session/latest")
def get_session_latest():
    sessions_dir = DATA_DIR / "sessions"
    files = sorted([f for f in sessions_dir.glob("*.json")], key=lambda x: x.name, reverse=True)
    if not files:
        raise HTTPException(status_code=404, detail={ "ok": False })
    data = read_json(files[0])
    return { "ok": True, "session": { "date": files[0].stem, "data": data } }

# ── Journal ────────────────────────────────────────────────────────────────────

@app.get("/journal")
def get_journal(date: Optional[str] = Query(None)):
    date_str = date or local_today()
    journal_file = DATA_DIR / "journal" / f"{date_str}.md"
    if not journal_file.exists():
        raise HTTPException(status_code=404, detail={ "ok": False })
    
    content = journal_file.read_text(encoding="utf-8")
    mtime = datetime.fromtimestamp(journal_file.stat().st_mtime).strftime("%Y-%m-%d")
    return { "ok": True, "content": content, "mtime": mtime }

@app.post("/journal")
def save_journal(background_tasks: BackgroundTasks, payload: Dict[str, Any], date: Optional[str] = Query(None)):
    date_str = date or local_today()
    journal_file = DATA_DIR / "journal" / f"{date_str}.md"
    content = payload.get("content", "")
    
    journal_file.parent.mkdir(parents=True, exist_ok=True)
    journal_file.write_text(content, encoding="utf-8")
    
    background_tasks.add_task(firestore_sync, date_str)
    return { "ok": True }

@app.get("/journal/list")
def get_journal_list():
    journal_dir = DATA_DIR / "journal"
    files = sorted([f for f in journal_dir.glob("*.md")], key=lambda x: x.name, reverse=True)[:50]
    entries = []
    for f in files:
        mtime = datetime.fromtimestamp(f.stat().st_mtime).isoformat()
        entries.append({ "date": f.stem, "mtime": mtime })
    return { "ok": True, "entries": entries }

# ── Theme ──────────────────────────────────────────────────────────────────────

@app.get("/theme")
def get_theme():
    theme_file = DATA_DIR / "theme.json"
    return read_json(theme_file, { "theme": "mocha" })

@app.post("/theme")
def save_theme(payload: Dict[str, Any]):
    theme_file = DATA_DIR / "theme.json"
    write_json(theme_file, payload)
    return { "ok": True }

# ── Relaxation CLI Logger Endpoints ───────────────────────────────────────────

@app.get("/relaxation/sessions/progress")
def get_relaxation_progress():
    sessions_dir = DATA_DIR / "sessions"
    files = [f for f in sessions_dir.glob("*.json")]
    return { "total": len(files) }

@app.post("/relaxation/session")
def post_relaxation_session(background_tasks: BackgroundTasks, payload: Dict[str, Any]):
    datum = payload.get("datum") or local_today()
    methode = payload.get("methode") or "Progressive Muskelrelaxation (PMR)"
    dauer = payload.get("dauer")
    ort = payload.get("ort")
    tageszeit = payload.get("tageszeit")
    notizen = payload.get("notizen") or ""
    
    session_file = DATA_DIR / "sessions" / f"{datum}.json"
    session = read_json(session_file, { "date": datum, "items": [] })
    
    minutes = 30
    if dauer:
        match = re.search(r"^(\d+)", str(dauer))
        if match:
            minutes = int(match.group(1))
            
    meta = []
    if ort:
        meta.append(f"Ort: {ort}")
    if tageszeit:
        meta.append(f"Tageszeit: {tageszeit}")
        
    compiled_note = notizen
    if meta:
        prefix = f"[{', '.join(meta)}] "
        compiled_note = prefix + compiled_note
        
    new_item = {
        "id": str(uuid.uuid4()),
        "technique": methode,
        "minutes": min(240, max(0, minutes)),
        "mood_before": 3,
        "mood_after": 4,
        "note": compiled_note[:2000]
    }
    
    session.setdefault("items", []).append(new_item)
    write_json(session_file, session)
    background_tasks.add_task(firestore_sync, datum)
    
    sessions_dir = DATA_DIR / "sessions"
    files = [f for f in sessions_dir.glob("*.json")]
    total = len(files)
    
    return {
        "session_nr": total,
        "total": total,
        "remaining": max(0, 30 - total)
    }

# ── Proxy Router (Knowledge Base & Physio Sim) ──────────────────────────────────
# Routes to Node server for biochemistry KB logic & PNI simulation engine.

@app.api_route("/api/knowledge/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_knowledge(path: str, request: Request):
    return await handle_reverse_proxy(request, f"/api/knowledge/{path}")

@app.api_route("/api/physio/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def proxy_physio(path: str, request: Request):
    return await handle_reverse_proxy(request, f"/api/physio/{path}")

async def handle_reverse_proxy(request: Request, path: str):
    target_url = f"{NODE_BACKEND_URL}{path}"
    
    query_params = request.url.query
    if query_params:
        target_url = f"{target_url}?{query_params}"
        
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
    body = await request.body()
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                timeout=15.0
            )
            resp_headers = {k: v for k, v in resp.headers.items() if k.lower() not in ("transfer-encoding", "content-encoding")}
            return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)
        except httpx.RequestError as e:
            raise HTTPException(status_code=status.HTTP_524_A_TIMEOUT, detail=f"Node API backend unreachable: {e}")

# ── SPA / Static Serving ──────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h3>Frontend not built. Run 'npm run build'</h3>", status_code=404)

if (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
def spa_fallback(path: str, request: Request):
    if request.method == "GET":
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
             return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
    raise HTTPException(status_code=404, detail="Not Found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 9123))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("server:app", host=host, port=port, reload=True)
