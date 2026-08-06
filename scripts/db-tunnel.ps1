<#
  db-tunnel.ps1 — open een kale SSH-tunnel naar de persistente brug op de VPS.

  Vereist dat de brug al draait (eenmalig: `pnpm db:bridge`, zie
  scripts/db-bridge-setup.ps1). De brug luistert op VPS 127.0.0.1:$BridgePort
  en overleeft herstarts, dus hier is GEEN socat meer nodig — puur SSH.

  Keten:
    laptop:$LocalPort  →(ssh)→  VPS 127.0.0.1:$BridgePort  →(brug)→  database:5432

  Gebruik:
    pnpm db:tunnel            # laat open; Ctrl-C sluit de tunnel
    In een 2e terminal: pnpm db:migrate / db:studio / db:seed / db:ping

  GUI-clients (DBeaver, TablePlus, VS Code DB Client) hebben dit script niet
  nodig: vul in de SSH-tab je VPS + key in, en als host 127.0.0.1:$BridgePort.
#>

$ErrorActionPreference = "Stop"

# ── Config ───────────────────────────────────────────────────
$VPS        = "root@72.61.21.31"
$BridgePort = 15432    # loopback-poort van de brug op de VPS
$LocalPort  = 5433     # poort op je laptop → moet matchen met .env
# ─────────────────────────────────────────────────────────────

Write-Host "Tunnel : 127.0.0.1:$LocalPort  ->  VPS 127.0.0.1:$BridgePort  (via $VPS)" -ForegroundColor Cyan
Write-Host "Draait de brug niet? Eerst 'pnpm db:bridge'. Ctrl-C sluit de tunnel.`n" -ForegroundColor DarkGray

ssh -N -L "${LocalPort}:127.0.0.1:${BridgePort}" $VPS
