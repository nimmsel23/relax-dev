#!/usr/bin/env bash
# Abhängigkeiten installieren — gemeinsamer Einstieg für CI, Devcontainer und frische Cloud-Checkouts.
#
# pnpm 11 bricht bei nicht freigegebenen Build-Skripten ab (ERR_PNPM_IGNORED_BUILDS). Die Freigabe
# (wie im vitalos-Workspace) wird nur flüchtig geschrieben und nur, wenn kein Workspace existiert:
# ein eingechecktes pnpm-workspace.yaml würde relax-app im vitalos-Workspace zum eigenen Root machen.
# Das Repo hat bewusst kein Lockfile (liegt im vitalos-Workspace), daher --no-frozen-lockfile.
set -euo pipefail
cd "$(dirname "$0")/.."

# Liegt irgendwo oberhalb schon ein Workspace (relax-app im vitalos-Meta-Repo), gilt dessen allowBuilds.
in_workspace() {
  local d
  d="$(pwd)"
  while [ "$d" != "/" ]; do
    [ -f "$d/pnpm-workspace.yaml" ] && return 0
    d="$(dirname "$d")"
  done
  return 1
}

if ! in_workspace; then
  printf "allowBuilds:\n  '@firebase/util': true\n  esbuild: true\n  protobufjs: true\n" > pnpm-workspace.yaml
fi

pnpm install --no-frozen-lockfile
