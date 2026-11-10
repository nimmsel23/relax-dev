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

cat > pnpm-workspace.yaml <<'YAML'
allowBuilds:
  '@firebase/util': true
  esbuild: true
  protobufjs: true
overrides:
  rollup: 4.68.0
  rolldown: 1.3.0
  vite: 8.3.6
  '@vitejs/plugin-react': 6.2.1
  '@firebase/util': '^1.12.1'
  '@grpc/grpc-js@<1.13.6': '^1.14.6'
  'minimatch@>=7 <11.0.1': '11.0.5'
YAML

pnpm install --frozen-lockfile
