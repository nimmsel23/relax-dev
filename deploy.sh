#!/usr/bin/env bash
# deploy.sh — Deployment für Relax nach ~/.local/relax (rsync + Build, kein sudo)
set -euo pipefail

DEST="${RELAX_DEPLOY_DIR:-$HOME/.local/relax}"
SOURCE="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")" && pwd)"

msg() { printf '\033[1;32m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*" >&2; }
die() { printf '\033[1;31m%s\033[0m\n' "$*" >&2; exit 1; }

msg "🚀 Starting Relax Deployment → $DEST"

# 1. Zielordner
mkdir -p "$DEST"

# 2. Sync (data/ und .git des Ziels bleiben unangetastet)
msg "📦 Syncing files..."
rsync -av --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "data" \
  --exclude ".archiv" \
  --exclude ".bak" \
  "$SOURCE/" "$DEST/"

# 3. Dependencies + UI-Build im Ziel
msg "📦 Installing dependencies and building UI"
(
  cd "$DEST"
  npm install --silent
  npm run build > /dev/null
)

msg "✅ Deployment to $DEST complete."
