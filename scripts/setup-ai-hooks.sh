#!/usr/bin/env bash
# Activa hooks y template en este repo de frontend. Idempotente.
set -e

git config --local core.hooksPath .githooks
git config --local commit.template .gitmessage.txt

[ ! -f "AGENTS.md" ]     && { echo "ERROR: falta AGENTS.md en la raíz" >&2; exit 1; }
[ ! -f "TECH_DEBT.md" ] && { echo "ERROR: falta TECH_DEBT.md en la raíz" >&2; exit 1; }

chmod +x .githooks/* 2>/dev/null || true

echo "OK: hooks en .githooks, template en .gitmessage.txt (Barberia-Frontend)"
echo "Reglas: AGENTS.md · Deuda: TECH_DEBT.md"
echo "Recuerda exportar AI_TOOL, AI_MODEL y AI_SESSION antes de commitear:"
echo '  export AI_TOOL="Antigravity" AI_MODEL="gemini-2.5-pro" AI_SESSION="2026-11-03T16:55:00-05:00"'

