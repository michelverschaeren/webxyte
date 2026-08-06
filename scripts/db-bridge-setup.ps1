<#
  db-bridge-setup.ps1 — zet ÉÉNMALIG een persistente brug op de VPS neer.

  Achtergrond:
  Dokploy draait op Docker Swarm; de database zit op het overlay-netwerk
  dokploy-network en is onbereikbaar vanaf de host. Swarm kan een poort niet
  aan 127.0.0.1 binden (elke gepubliceerde poort zou publiek zijn). Een GEWONE
  `docker run` (geen Swarm-service) kan dat wél — die publiceert via docker-proxy
  en honoreert de `127.0.0.1:`-bind.

  Deze brug:
    - hangt aan dokploy-network en bereikt de database bij naam,
    - luistert ENKEL op 127.0.0.1 van de VPS (onbereikbaar van buiten),
    - overleeft een VPS-herstart (--restart=unless-stopped).

  Daardoor volstaat lokaal een kale SSH-tunnel (scripts/db-tunnel.ps1), en
  GUI-clients (DBeaver, TablePlus, VS Code DB Client) kunnen de tunnel zelf
  openen naar VPS 127.0.0.1:$BridgePort.

  Draai dit één keer, en opnieuw als je de servicenaam/poort wijzigt:
    pnpm db:bridge
#>

$ErrorActionPreference = "Stop"

# ── Config (identiek aan db-tunnel.ps1) ──────────────────────
$VPS        = "root@72.61.21.31"
$Network    = "dokploy-network"
$Service    = "vleerwaren-vermeir-dbvermeir-f9vchd"
$RemotePort = 5432
$BridgePort = 15432
# ─────────────────────────────────────────────────────────────

$cmd = "docker rm -f pgbridge 2>/dev/null; " +
       "docker run -d --restart=unless-stopped --name pgbridge --network $Network " +
       "-p 127.0.0.1:${BridgePort}:${BridgePort} alpine/socat " +
       "TCP-LISTEN:${BridgePort},fork,reuseaddr TCP:${Service}:${RemotePort} " +
       "&& sleep 1 && docker ps --filter name=pgbridge --format '{{.Names}}  {{.Status}}'"

Write-Host "Brug opzetten op $VPS ..." -ForegroundColor Cyan
Write-Host "  $Service`:$RemotePort  ->  VPS 127.0.0.1:$BridgePort (loopback-only, persistent)`n" -ForegroundColor DarkGray

ssh $VPS $cmd

Write-Host "`nKlaar. Open nu de tunnel met 'pnpm db:tunnel' (of laat je DB-client de SSH-tunnel regelen)." -ForegroundColor Green
