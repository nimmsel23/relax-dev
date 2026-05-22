"""KB Enricher — Gemini-gestützte Anreicherung von molecule_details in SQLite.

Public API:
  enrich_molecule(key, dry_run=False) → dict   # async
  enrich_batch(keys, dry_run=False) → list[dict]  # async
  db.stats() → dict
  db.list_needing_enrichment() → list[dict]
"""

from .enricher import enrich_batch, enrich_molecule

__all__ = ["enrich_molecule", "enrich_batch"]
