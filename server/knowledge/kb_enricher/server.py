"""aiohttp HTTP-Server für den KB Enricher (:9124).

Routen:
  GET  /health        — Service-Status + DB-Stats
  GET  /status        — DB-Stats + Liste unangereichter Moleküle
  GET  /molecules     — Moleküle ohne enriched_at
  POST /enrich        — Einzelnes Molekül anreichern  {key, dry_run?}
  POST /batch-enrich  — Mehrere Moleküle             {keys?, dry_run?}
"""

from __future__ import annotations

from aiohttp import web
from loguru import logger

from . import db, enricher
from .config import DEFAULT_HOST, DEFAULT_PORT, GEMINI_API_KEY, GEMINI_MODEL, DB_PATH


# ── Handler ───────────────────────────────────────────────────────────────────


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({
        "status": "ok",
        "db": str(DB_PATH),
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL,
        "stats": db.stats(),
    })


async def handle_status(request: web.Request) -> web.Response:
    return web.json_response({
        "db_stats": db.stats(),
        "needing_enrichment": db.list_needing_enrichment(),
    })


async def handle_molecules(request: web.Request) -> web.Response:
    return web.json_response({"needing_enrichment": db.list_needing_enrichment()})


async def handle_enrich(request: web.Request) -> web.Response:
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    key = body.get("key")
    if not key:
        return web.json_response({"error": "'key' required"}, status=400)

    result = await enricher.enrich_molecule(key, dry_run=bool(body.get("dry_run", False)))
    return web.json_response(result, status=200 if result.get("ok") else 422)


async def handle_batch(request: web.Request) -> web.Response:
    try:
        body = await request.json()
    except Exception:
        body = {}

    keys: list[str] = body.get("keys") or [
        m["key"] for m in db.list_needing_enrichment()
    ]
    dry_run = bool(body.get("dry_run", False))

    results = await enricher.enrich_batch(keys, dry_run)
    ok_count = sum(1 for r in results if r.get("ok"))
    return web.json_response({"total": len(results), "ok": ok_count, "results": results})


# ── App ───────────────────────────────────────────────────────────────────────


def make_app() -> web.Application:
    app = web.Application()
    app.router.add_get("/health", handle_health)
    app.router.add_get("/status", handle_status)
    app.router.add_get("/molecules", handle_molecules)
    app.router.add_post("/enrich", handle_enrich)
    app.router.add_post("/batch-enrich", handle_batch)
    return app


def run(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> None:
    logger.info(f"KB Enricher startet auf {host}:{port}")
    logger.info(f"DB: {DB_PATH}")
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY fehlt — Enrichment deaktiviert")
    web.run_app(make_app(), host=host, port=port, access_log=None)
