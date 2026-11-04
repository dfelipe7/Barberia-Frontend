# Activa hooks y template en este repo de frontend. Idempotente.
git config --local core.hooksPath .githooks
git config --local commit.template .gitmessage.txt

if (-not (Test-Path "AGENTS.md"))     { Write-Error "Falta AGENTS.md en la raíz"; exit 1 }
if (-not (Test-Path "TECH_DEBT.md")) { Write-Error "Falta TECH_DEBT.md en la raíz"; exit 1 }

Write-Host "OK: hooks en .githooks, template en .gitmessage.txt (Barberia-Frontend)"
Write-Host "Reglas: AGENTS.md · Deuda: TECH_DEBT.md"
Write-Host "Recuerda exportar AI_TOOL, AI_MODEL y AI_SESSION antes de commitear:"
Write-Host '  $env:AI_TOOL="Antigravity"; $env:AI_MODEL="gemini-2.5-pro"; $env:AI_SESSION="2026-11-03T16:55:00-05:00"'

