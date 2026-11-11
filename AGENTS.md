# AGENTS.md — Relax

**Simplicity (Owner 2026-11-11):** So simpel wie möglich. Ausnahme nur `vitalos/prod`. CI-Spine: Check → automerge-pr → automerge → Deploy (CI.md §1).

<!-- release-weg:start -->
## Release-Weg und Branches (Relax)

Stand 2026-11-09. Ausführlich: `~/vitalos/docs/DEPLOYMENT.md`.

**dev → master** (+ Shell-Pin auf `origin/master`)

| Branch | Rolle | Lokal |
|---|---|---|
| `dev` | Edits und Previews (Preview-Channel `dev`, PR-Channel je PR) | ja — dieser Klon steht fest auf `dev` |
| `master` | **Standalone-Prod** (eigene Hosting-Site (siehe `firebase.json`/`.firebaserc`)); deployt nur per CI (`Live Deploy (Relax master)`) | nein, lokal nicht nötig |
| `vitalos` | **Legacy** (darf remote noch existieren) — kein Pin-Ziel mehr | nicht für Shell nutzen |

- Release (automatisch): `dev` committen und pushen. Nach grünem Check promotet `automerge.yml` nach `master` und startet den Live-Deploy. Direkte Pushes auf `master` vermeiden; Hotfixes über `dev`.
- Shell: `vos-release` / `vos-ship` pinnt `origin/master` (detached im `*-app`) und bumpt den Meta-Pointer → `deploy-shell.yml`. Vorher `vos-overview`.
- `.gitmodules` im Meta-Repo: `branch = master`. Kein Auto-Vorspulen eines App-Branches `vitalos` mehr.
- Parallel-Branches/Worktrees nur mit Owner-Ausnahme.
- Default-Branch des Repos ist `master`; die Workflows auf `master` bestimmen das Live-Verhalten.
<!-- release-weg:end -->

## Vite 8 / Rolldown

`vite.config.js` enthält `fixRolldownPreloadMarker`. Rolldown hängt sonst an
`__VITE_PRELOAD__` einen Hash; Vite ersetzt nur die Marke und lässt `[]<hash>`
im Bundle (SyntaxError → Blackscreen, wie bei `vos-6pack.web.app`). Plugin nicht
entfernen — Relax nutzt `React.lazy` und hat Capacitor-Deps für Native.
