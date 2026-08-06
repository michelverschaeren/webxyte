#!/usr/bin/env bash
# db-tunnel.sh — open een kale SSH-tunnel naar de persistente brug op de VPS.
# Vereist dat de brug draait (eenmalig: scripts/db-bridge-setup.sh).
# Keten: laptop:$LOCAL_PORT -> (ssh) -> VPS 127.0.0.1:$BRIDGE_PORT -> database:5432
set -euo pipefail

# ── Config ───────────────────────────────────────────────────
VPS="root@72.61.21.31"
BRIDGE_PORT=15432
LOCAL_PORT=5433
# ─────────────────────────────────────────────────────────────

echo "Tunnel: 127.0.0.1:${LOCAL_PORT} -> VPS 127.0.0.1:${BRIDGE_PORT} (via ${VPS})"
echo "Draait de brug niet? Eerst scripts/db-bridge-setup.sh. Ctrl-C sluit de tunnel."
exec ssh -N -L "${LOCAL_PORT}:127.0.0.1:${BRIDGE_PORT}" "${VPS}"
