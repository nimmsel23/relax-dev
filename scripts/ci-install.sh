#!/usr/bin/env bash
# Abhängigkeiten installieren — gemeinsamer Einstieg für CI, Devcontainer und frische Cloud-Checkouts.
#
# pnpm 11 bricht bei nicht freigegebenen Build-Skripten ab (ERR_PNPM_IGNORED_BUILDS). Die Freigabe
# (wie im vitalos-Workspace) wird nur flüchtig geschrieben und nur, wenn kein Workspace existiert:
# ein eingechecktes pnpm-workspace.yaml würde relax-app im vitalos-Workspace zum eigenen Root machen.
# Standalone gilt pnpm-lock.yaml strikt (--frozen-lockfile, reproduzierbar). Im vitalos-Workspace
# bestimmt dessen Root-Lockfile die Versionen, die von relax-app wird dort ignoriert.
set -euo pipefail
cd "$(dirname "$0")/.."

# Liegt irgendwo oberhalb schon ein Workspace (relax-app im vitalos-Meta-Repo), gilt dessen allowBuilds.
in_workspace() {
  local d
  d="$(dirname "$(pwd)")"  # Repo-Verzeichnis selbst zählt nicht (flüchtige Datei vom letzten Lauf)
  while [ "$d" != "/" ]; do
    [ -f "$d/pnpm-workspace.yaml" ] && return 0
    d="$(dirname "$d")"
  done
  return 1
}

if in_workspace; then
  pnpm install
  exit 0
fi

printf "allowBuilds:\n  '@firebase/util': true\n  esbuild: true\n  protobufjs: true\n" > pnpm-workspace.yaml

pnpm install --frozen-lockfile
