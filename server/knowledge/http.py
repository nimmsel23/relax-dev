"""
server.knowledge.http — HTTP-Fallback-Helpers für den relax-Dispatcher.

Wird von relax genutzt wenn kein direkter DB-Zugriff möglich ist.
"""

import json
import os
import urllib.parse
import urllib.request

NODE_PORT = int(os.environ.get("RELAX_NODE_PORT", 9123))
_BASE = f"http://127.0.0.1:{NODE_PORT}"


def api_get(path: str, timeout: float = 5.0) -> dict:
    url = f"{_BASE}{path}"
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read())


def substances(limit: int = 50) -> list:
    return api_get(f"/api/knowledge/substances?limit={limit}").get("substances", [])

def molecules(limit: int = 100) -> list:
    return api_get(f"/api/knowledge/molecules?limit={limit}").get("molecules", [])

def substance_detail(key: str) -> dict:
    return api_get(f"/api/knowledge/substance/{urllib.parse.quote(key)}")

def molecule_detail(key: str) -> dict:
    return api_get(f"/api/knowledge/molecule/{urllib.parse.quote(key)}")

def interactions(key: str) -> list:
    return api_get(f"/api/knowledge/interactions/{urllib.parse.quote(key)}").get("interactions", [])

def search(query: str) -> list:
    q = urllib.parse.quote(query)
    return api_get(f"/api/knowledge/search?q={q}").get("results", [])
