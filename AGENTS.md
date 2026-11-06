# AGENTS.md — Relax

<!-- release-weg:start -->
## Release-Weg und Branches (Relax)

Stand 2026-10-29. Ausführlich: `~/vitalos/docs/DEPLOYMENT.md` (GitHub: nimmsel23/vitalos, `docs/DEPLOYMENT.md`).

**dev → master → vitalos**

| Branch | Rolle | Lokal |
|---|---|---|
| `dev` | Edits und Previews (Preview-Channel `dev`, PR-Channel je PR) | ja — dieser Klon steht fest auf `dev` |
| `master` | **Standalone-Prod** (eigene Hosting-Site (siehe `firebase.json`/`.firebaserc`)); deployt nur per CI (`Live Deploy (Relax master)`) | nein, muss nicht existieren |
| `vitalos` | Stand für die Shell (`~/vitalos/relax-app`); darf hinter `master` liegen | nur als `-app`-Checkout im Meta-Repo |

- Release (automatisch): `dev` committen und pushen ist ausdrücklich erwünscht, nichts bleibt liegen. Nach grünem `Check (Relax)` promotet `.github/workflows/automerge.yml` `dev` per Fast-Forward nach `master` und startet den Live-Deploy per Dispatch (Vorlage und Logik: `~/vitalos-prod/docs/product-dev/ci-auto-promote/`). Kein PR nötig, kein Force-Push. Direkte Pushes auf `master` vermeiden (sie erzeugen Divergenz, der Workflow läuft dann rot): auch Hotfixes über `dev`; ist es doch passiert, `master` per normalem Push nach `dev` mergen.
- Shell: `vos-release relax` merged `origin/master` nach `vitalos` und bumpt den Pointer im Meta-Repo (deployt die Shell).
  Vorher `vos-overview`.
- `master` wird nie lokal ausgecheckt; `git fetch` genügt. Das Meta-Repo `vitalos` deployt nur noch die Shell.
- Nicht auf `dev` im Hauptordner arbeiten, wenn ein Agent-/Feature-Branch nötig ist: Worktree
  (`git worktree add .worktrees/<name> <branch>`).
- Default-Branch des Repos ist `master`; die `.github/workflows/*.yml` auf `master` bestimmen das Live-Verhalten.
<!-- release-weg:end -->
