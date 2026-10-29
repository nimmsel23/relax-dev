# NEXT.md

Next work priorities for relax-dev.

## Active Work (Max 5)

1. **Browser-test graph visualization** — Open SubstanceCatalog in browser, toggle to Graph view, search Mulungu/Caffeine, verify Reactflow renders correctly, check node interactivity + zoom/pan

2. **Explore Physiology Obsidian Vault** — Review existing physiological models/HPA-Axis timing/cortisol patterns in user's Obsidian vault, determine integration points with current mood/session tracking

3. **Implement Physio Timeline Graph Engine** (if starting) — Backend simulation engine for cortisol/dopamine/glucose curves in response to lifestyle events (coffee, meals, sleep), frontend event input UI + Nivo chart

4. Update project documentation (CLAUDE.md, README) with dual-catalog architecture, graph visualization, and Physio Timeline feature spec

5. _Reserved for emerging tasks_

## Offen aus Atem-/Build-Session (2026-10-29)

- **Echt-Check vor Push:** Atem-Tab und Dashboard-Karte wurden nur gegen einen Mock getestet — kurz auf :5904 mit echtem Setup und gegen Firestore/Emulator prüfen. Release-PR `dev` → `master` (#1) ist gemergt und per CI deployt (siehe RESULTS.md); das Echt-Setup wurde dabei nicht geprüft.
- **`origin/dev` nachziehen:** lokales `dev` ist nach dem Fast-Forward auf `origin/master` 7 Commits vor `origin/dev` (nichts gepusht). Push wäre nur Kosmetik und löst einen Preview-Lauf aus — bei Bedarf pushen.
- **CI unverifiziert:** `pnpm/action-setup@v4` mit pnpm 11 und der Devcontainer wurden nicht gegen echtes GitHub Actions bzw. Container getestet — nach dem ersten Lauf ansehen.
- **`data/kb.db`** hat lokal 11 Substanzen, die YAML 12: `node scripts/migrate-yaml-to-sqlite.mjs --force` (noch nicht ausgeführt), danach CLAUDE.md-Bestandszahlen angleichen.
- **Firestore-Details Atem:** Dashboard-Karte liest 60 Tage Verlauf (bis zu 60 Reads pro Öffnen) — ggf. auf 30 Tage kürzen (Rekord wird dann 30-Tage-Rekord). Speichern überschreibt das Tagesdokument komplett (offline auf zwei Geräten am selben Tag Datenverlust möglich; betrifft auch den Session-Tab).
- **`.bak`-Dateien** im Repo (per `.gitignore` ignoriert) nicht angefasst; Aufräumen nur mit Bedacht, nie blind restoren.

## Parking Lot (Not Now)

- Data migration script (if substance/molecule scales change)
- Service worker / offline queue (not critical yet)
- Component library refactor (keep Tailwind + CSS vars)

**Gemini-Review (potenzielle blinde Flecken, 2026-10-29):**
*   **Push-Scheduler-Logik:** Die Begründung für das Deaktivieren des Push-Schedulers auf Staging ("teilt Datenordner mit Prod") wurde nicht neu bewertet, obwohl Staging nun der *einzige* Firestore-Sync-Besitzer sein soll. Es bleibt unklar, ob das Deaktivieren weiterhin notwendig ist oder ob es andere Gründe gibt, die nicht explizit genannt wurden.
*   **`fitness-dev` Testausführung:** Die Behauptung, dass der Regressionstest `test_sync_owner.py` in `fitness-dev` "4/4 grün" läuft, wird in diesem Transkriptausschnitt nicht durch eine entsprechende Testausgabe verifiziert. Es wird lediglich der Commit gezeigt.

**Gemini-Review (potenzielle blinde Flecken, 2026-10-29):**
*   **Ungeprüfte Annahme beim Deploy:** Bei beiden Staging-Deploys (Fitness und Fuel) wurde explizit gemeldet: „Kein frischer Build — bestehende dist/ wird übernommen“. Wenn die „staging fixes“ Frontend-Änderungen enthielten, wurden diese nicht deployt, da kein neuer Build erstellt wurde. Claude hat dies nicht hinterfragt oder einen Build erzwungen.
*   **Inkonsistenz in der Selbstzusammenfassung:** Die Selbstzusammenfassung behauptet, „`dev` ist 7 Commits vor `origin/dev`, nichts gepusht“, obwohl die `git status`-Ausgaben nach den `git merge --ff-only origin/dev`-Befehlen für
