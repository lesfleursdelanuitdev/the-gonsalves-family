#!/bin/bash
# Deploy script for gonsalvesfamily.com (public site).
# Ensures the production build completes and static files exist before restart.
# The site runs under systemd as gonsalves-public.service
# (WorkingDirectory=this app root, `npm run start:prod` -> port 3039).

set -e
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_ROOT"

SERVICE="gonsalves-public.service"

echo "Building production bundle in $APP_ROOT..."
npm run build

# Verify static files were generated (prevents serving without CSS/JS)
if [ ! -d ".next/static" ]; then
  echo "ERROR: Build failed - .next/static directory missing"
  exit 1
fi
if [ ! -d ".next/static/chunks" ] || [ -z "$(ls -A .next/static/chunks 2>/dev/null)" ]; then
  echo "ERROR: Build failed - .next/static/chunks is missing or empty"
  exit 1
fi

# systemd runs the service from this app root, so it picks up this fresh .next.
echo "Static files OK. Restarting $SERVICE (sudo may prompt for a password)..."
sudo systemctl restart "$SERVICE"
sudo systemctl --no-pager --lines=0 status "$SERVICE" || true

echo "Deploy complete. Site: https://gonsalvesfamily.com"
echo "If CSS/code still stale: hard-refresh (Ctrl+Shift+R) or clear site data; ensure nginx is not caching the HTML response."
