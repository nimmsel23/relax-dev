"""typer CLI für den KB Enricher.

Befehle:
  serve   — HTTP-Server starten
  enrich  — Einzelnes Molekül anreichern
  batch   — Alle unangereicherten Moleküle verarbeiten
  status  — DB-Stats + Enrichment-Übersicht
  list    — Moleküle ohne enriched_at auflisten
"""

from __future__ import annotations

import asyncio
import json

import typer
from loguru import logger

from . import db, enricher, server
from .config import DEFAULT_PORT, GEMINI_API_KEY, GEMINI_MODEL

cli = typer.Typer(
    name="kb-enricher",
    help="KB Enrichment Engine — Gemini → molecule_details in SQLite",
    no_args_is_help=True,
)


@cli.command()
def serve(
    port: int = typer.Option(DEFAULT_PORT, "--port", "-p", help="Port"),
    host: str = typer.Option("127.0.0.1", "--host", help="Bind-Adresse"),
) -> None:
    """HTTP-Server auf :9124 starten."""
    server.run(host=host, port=port)


@cli.command()
def enrich(
    key: str = typer.Argument(..., help="Molekülschlüssel (z.B. cortisol)"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Nicht in DB schreiben"),
) -> None:
    """Einzelnes Molekül mit Gemini anreichern."""
    result = asyncio.run(enricher.enrich_molecule(key, dry_run))
    if result.get("ok"):
        if dry_run:
            typer.echo(json.dumps(result["result"], indent=2, ensure_ascii=False))
        else:
            fields = ", ".join(result.get("fields_written", []))
            typer.echo(f"✓ {key}: {fields}")
    else:
        typer.echo(f"✗ {result.get('error', 'Unbekannter Fehler')}", err=True)
        raise typer.Exit(1)


@cli.command()
def batch(
    dry_run: bool = typer.Option(False, "--dry-run", "-n"),
    limit: int = typer.Option(0, "--limit", "-l", help="Max. Anzahl (0 = alle)"),
) -> None:
    """Alle Moleküle ohne enriched_at mit Gemini verarbeiten."""
    candidates = db.list_needing_enrichment()
    if limit:
        candidates = candidates[:limit]
    if not candidates:
        typer.echo("Alle Moleküle sind bereits angereichert.")
        return

    suffix = "  [dry-run]" if dry_run else ""
    typer.echo(f"Batch: {len(candidates)} Moleküle{suffix}")

    async def _run() -> list[dict]:
        results = []
        for m in candidates:
            r = await enricher.enrich_molecule(m["key"], dry_run)
            marker = "✓" if r.get("ok") else "✗"
            typer.echo(f"  {marker} {m['key']}")
            results.append(r)
        return results

    results = asyncio.run(_run())
    ok_count = sum(1 for r in results if r.get("ok"))
    typer.echo(f"\n{ok_count}/{len(results)} erfolgreich")


@cli.command()
def status() -> None:
    """DB-Stats und Enrichment-Übersicht anzeigen."""
    s = db.stats()
    typer.echo("\nDB-Status:")
    for k, v in s.items():
        typer.echo(f"  {k:<28} {v}")

    candidates = db.list_needing_enrichment()
    if candidates:
        typer.echo(f"\nNoch nicht angereichert ({len(candidates)}):")
        for m in candidates:
            curated = "★" if m.get("curated") else " "
            typer.echo(f"  [{curated}] {m['key']:<32} {m.get('category', '')}")
    else:
        typer.echo("\n✓ Alle Moleküle sind angereichert.")

    gemini_ok = "✓ konfiguriert" if GEMINI_API_KEY else "✗ GEMINI_API_KEY fehlt"
    typer.echo(f"\nGemini: {gemini_ok}  Modell: {GEMINI_MODEL}")


@cli.command(name="list")
def list_cmd() -> None:
    """Moleküle ohne enriched_at auflisten."""
    candidates = db.list_needing_enrichment()
    if not candidates:
        typer.echo("Alle Moleküle sind angereichert.")
        return
    for m in candidates:
        curated = "★" if m.get("curated") else " "
        label = m.get("de_name") or m.get("name") or ""
        typer.echo(
            f"[{curated}] {m['key']:<32} {m.get('category', '?'):<22} {label}"
        )
