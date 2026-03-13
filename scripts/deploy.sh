#!/bin/bash
# Deploy script for temp.gonsalvesfamily.com
# Ensures production build completes and static files exist before restart.
# Run from app root so PM2 (started from same root) serves this .next.

set -e
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_ROOT"

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

# Ensure PM2 was started with cwd = this app root so it uses this .next
echo "Static files OK. Restarting PM2..."
pm2 restart temp-gonsalvesfamily

echo "Deploy complete. Site: https://temp.gonsalvesfamily.com"
echo "If CSS/code still stale: hard-refresh (Ctrl+Shift+R) or clear site data; ensure nginx is not caching the HTML response."
