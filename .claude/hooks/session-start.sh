#!/bin/bash
# Instala as dependências do Nexus em sessões do Claude Code na nuvem, para tsc, vite build, oxlint e o servidor de desenvolvimento funcionarem.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

if ! command -v pnpm >/dev/null; then
  npm install -g pnpm@10
fi

# Só reinstala se o lockfile, o package.json ou este script mudaram desde a última instalação bem-sucedida
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  pnpm install --frozen-lockfile
  sha256sum .claude/hooks/session-start.sh package.json pnpm-lock.yaml > "$hashes"
fi
