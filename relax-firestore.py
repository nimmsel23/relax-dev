#!/usr/bin/env python3
"""
relax-firestore.py — Bidirektionaler Sync: relax-dev (lokal) ↔ Firebase Firestore

Use Case: Laptop offline → relax-dev läuft als lokaler API-Server.
Wenn Laptop wieder online: Sync mit Firestore, damit Mobile-PWA aktuell bleibt.

Firestore-Struktur:
  relax/default/sessions/{date}  → {date, items:[...], saved_at}
  relax/default/journal/{date}   → {date, content:""}

Lokal (RELAX_DATA_DIR, default ~/relax-dev/data/):
  sessions/YYYY-MM-DD.json  → {date, items:[...], saved_at}
  journal/YYYY-MM-DD.md     → markdown text

Endpoints:
  GET  /api/relax-firestore/status          Verbindungsstatus
  POST /api/relax-firestore/ping            Sync heute
  POST /api/relax-firestore/sync?date=      Bisync ein Datum
  POST /api/relax-firestore/push?date=      Lokal → Firestore
  POST /api/relax-firestore/pull?date=      Firestore → Lokal

Service Account: ~/.config/relax-pwa/service-account.json
                 (oder env RELAX_FIRESTORE_SA)
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date as dt_date
from pathlib import Path
from typing import Any

from aiohttp import web
from loguru import logger

# ── Config ─────────────────────────────────────────────────────────────────────

RELAX_DATA_DIR = Path(
    os.getenv("RELAX_DATA_DIR", str(Path.home() / "relax-dev" / "data"))
).expanduser()

SA_PATH = Path(
    os.getenv("RELAX_FIRESTORE_SA", str(Path.home() / ".config" / "relax-pwa" / "service-account.json"))
).expanduser()

UID = "default"
PREFIX = "/api/relax-firestore"

# ── Firestore (lazy init) ──────────────────────────────────────────────────────

_fs = None


def _get_fs():
    global _fs
    if _fs is not None:
        return _fs
    if not SA_PATH.exists():
        raise FileNotFoundError(
            f"Service Account nicht gefunden: {SA_PATH}\n"
            "Firebase Console → Projekteinstellungen → Service Accounts → Schlüssel generieren"
        )
    import firebase_admin
    from firebase_admin import credentials, firestore as fb_firestore

    if not firebase_admin._apps:
        cred = credentials.Certificate(str(SA_PATH))
        firebase_admin.initialize_app(cred)
    _fs = fb_firestore.client()
    logger.info("relax-firestore: Firestore verbunden")
    return _fs


# ── Lokale Pfade ───────────────────────────────────────────────────────────────

def _session_path(d: str) -> Path:
    return RELAX_DATA_DIR / "sessions" / f"{d}.json"


def _journal_path(d: str) -> Path:
    return RELAX_DATA_DIR / "journal" / f"{d}.md"


# ── Datei-Helfer ───────────────────────────────────────────────────────────────

def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except Exception as e:
        logger.warning(f"Lesen fehlgeschlagen {path}: {e}")
        return default


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def _strip_meta(obj: dict) -> dict:
    return {k: v for k, v in obj.items() if k not in ("updated_at", "_firestore_updated")}


# ── Firestore Refs ─────────────────────────────────────────────────────────────

def _session_ref(fs, d: str):
    return fs.collection("relax").document(UID).collection("sessions").document(d)


def _journal_ref(fs, d: str):
    return fs.collection("relax").document(UID).collection("journal").document(d)


# ── Push (Lokal → Firestore) ───────────────────────────────────────────────────

def _push_session(fs, d: str) -> dict:
    local = _read_json(_session_path(d), None)
    if local is None:
        return {"skipped": True, "reason": "no_local_data"}
    _session_ref(fs, d).set({**local, "updated_at": _now_iso()})
    return {"pushed": True}


def _push_journal(fs, d: str) -> dict:
    path = _journal_path(d)
    if not path.exists():
        return {"skipped": True, "reason": "no_local_data"}
    content = path.read_text(encoding="utf-8")
    _journal_ref(fs, d).set({"date": d, "content": content, "updated_at": _now_iso()})
    return {"pushed": True}


# ── Pull (Firestore → Lokal) ───────────────────────────────────────────────────

def _pull_session(fs, d: str) -> dict:
    doc = _session_ref(fs, d).get()
    if not doc.exists:
        return {"skipped": True, "reason": "no_firestore_data"}
    data = _strip_meta(doc.to_dict())
    _write_json(_session_path(d), data)
    return {"pulled": True}


def _pull_journal(fs, d: str) -> dict:
    doc = _journal_ref(fs, d).get()
    if not doc.exists:
        return {"skipped": True, "reason": "no_firestore_data"}
    data = doc.to_dict()
    content = data.get("content", "")
    path = _journal_path(d)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return {"pulled": True}


# ── Bisync ─────────────────────────────────────────────────────────────────────

def _bisync(fs, d: str) -> dict:
    """
    Einfache Bisync-Strategie: lokal gewinnt wenn vorhanden, sonst pull.
    Keine Conflict-Resolution — last-write-wins per Datum.
    """
    session_local = _session_path(d).exists()
    journal_local = _journal_path(d).exists()

    session_r = _push_session(fs, d) if session_local else _pull_session(fs, d)
    journal_r = _push_journal(fs, d) if journal_local else _pull_journal(fs, d)

    return {"session": session_r, "journal": journal_r}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _date_param(request: web.Request) -> str:
    return request.rel_url.query.get("date", dt_date.today().isoformat())


def _json(data: dict, status: int = 200) -> web.Response:
    return web.Response(
        text=json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


# ── Handlers ───────────────────────────────────────────────────────────────────

async def handle_status(request: web.Request) -> web.Response:
    try:
        fs = _get_fs()
        fs.collection("relax").document(UID).get()
        return _json({"ok": True, "connected": True, "sa": str(SA_PATH), "data_dir": str(RELAX_DATA_DIR)})
    except Exception as e:
        return _json({"ok": False, "connected": False, "error": str(e)}, 503)


async def handle_ping(request: web.Request) -> web.Response:
    d = dt_date.today().isoformat()
    try:
        fs = _get_fs()
        result = _bisync(fs, d)
        return _json({"ok": True, "date": d, **result})
    except Exception as e:
        logger.error(f"relax-firestore ping fehlgeschlagen: {e}")
        return _json({"ok": False, "error": str(e)}, 503)


async def handle_sync(request: web.Request) -> web.Response:
    d = _date_param(request)
    try:
        fs = _get_fs()
        result = _bisync(fs, d)
        return _json({"ok": True, "date": d, **result})
    except Exception as e:
        logger.error(f"relax-firestore sync {d} fehlgeschlagen: {e}")
        return _json({"ok": False, "error": str(e)}, 503)


async def handle_push(request: web.Request) -> web.Response:
    d = _date_param(request)
    try:
        fs = _get_fs()
        session_r = _push_session(fs, d)
        journal_r = _push_journal(fs, d)
        return _json({"ok": True, "date": d, "session": session_r, "journal": journal_r})
    except Exception as e:
        logger.error(f"relax-firestore push {d} fehlgeschlagen: {e}")
        return _json({"ok": False, "error": str(e)}, 503)


async def handle_pull(request: web.Request) -> web.Response:
    d = _date_param(request)
    try:
        fs = _get_fs()
        session_r = _pull_session(fs, d)
        journal_r = _pull_journal(fs, d)
        return _json({"ok": True, "date": d, "session": session_r, "journal": journal_r})
    except Exception as e:
        logger.error(f"relax-firestore pull {d} fehlgeschlagen: {e}")
        return _json({"ok": False, "error": str(e)}, 503)


# ── Route-Registration ─────────────────────────────────────────────────────────

def register_routes(app: web.Application) -> None:
    app.router.add_get(f"{PREFIX}/status", handle_status)
    app.router.add_post(f"{PREFIX}/ping",   handle_ping)
    app.router.add_post(f"{PREFIX}/sync",   handle_sync)
    app.router.add_post(f"{PREFIX}/push",   handle_push)
    app.router.add_post(f"{PREFIX}/pull",   handle_pull)
    logger.info(f"relax-firestore: Routes registriert unter {PREFIX}")


# ── Standalone ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="relax-firestore standalone")
    parser.add_argument("--port", type=int, default=9125)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    app = web.Application()
    register_routes(app)
    logger.info(f"relax-firestore standalone auf {args.host}:{args.port}")
    web.run_app(app, host=args.host, port=args.port)
