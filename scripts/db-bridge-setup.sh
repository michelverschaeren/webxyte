#!/usr/bin/env bash
# db-bridge-setup.sh — zet ÉÉNMALIG een persistente brug op de VPS neer.
# Zie scripts/db-bridge-setup.ps1 voor de volledige uitleg.
# Een gewone `docker run` (geen Swarm-service) bindt wél aan 127.0.0.1 en
# overleeft een herstart. Loopback-only: onbereikbaar van buiten zonder SSH.
set -euo pipefail

# ── Config (identiek aan db-tunnel.sh) ───────────────────────
VPS="root@72.61.21.31"
NETWORK="dokploy-network"
SERVICE="vleerwaren-vermeir-dbvermeir-f9vchd"
REMOTE_PORT=5432
BRIDGE_PORT=15432
# ─────────────────────────────────────────────────────────────

cmd="docker rm -f pgbridge 2>/dev/null; \
docker run -d --restart=unless-stopped --name pgbridge --network ${NETWORK} \
-p 127.0.0.1:${BRIDGE_PORT}:${BRIDGE_PORT} alpine/socat \
TCP-LISTEN:${BRIDGE_PORT},fork,reuseaddr TCP:${SERVICE}:${REMOTE_PORT} \
&& sleep 1 && docker ps --filter name=pgbridge --format '{{.Names}}  {{.Status}}'"

echo "Brug opzetten op ${VPS} (loopback-only, persistent) ..."
ssh "${VPS}" "${cmd}"
echo "Klaar. Open de tunnel met 'pnpm db:tunnel'."
