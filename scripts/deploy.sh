#!/bin/bash
# Deploy gonsalvesfamily.com (public site) — rootless Podman Quadlet container.
#
# Production runs as the `ligneous-public` container under user `svc-ligneous`
# (image localhost/public:prod, published on 127.0.0.1:3039; nginx proxies it).
# The legacy native-systemd unit gonsalves-public.service (`npm run start:prod`)
# is DISABLED — do not restart it.
#
# This script (run as momolig): builds the prod image with prod NEXT_PUBLIC_*
# inlined, loads it into svc-ligneous's rootless image store, and restarts the
# Quadlet unit. Multi-app equivalent that builds public + admin together:
#   /srv/apps/deploy/quadlet/build-prod-images.sh
# See /srv/apps/deploy/quadlet/README.md and /home/momolig/containerization-status.md.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"   # resolves symlinks -> /srv/apps/the-gonsalves-family
APPS_ROOT="$(cd "$REPO_ROOT/.." && pwd -P)"        # -> /srv/apps (podman build context)
REPO="$(basename "$REPO_ROOT")"
IMAGE="public:prod"
UNIT="ligneous-public.service"
RUN_USER="svc-ligneous"
BUILD_ENV="$APPS_ROOT/deploy/quadlet/build/public.env.production"

if [[ "$(id -un)" != "momolig" ]]; then
  echo "Run as momolig (builds images; uses sudo for $RUN_USER)." >&2
  exit 1
fi
if [[ ! -s "$BUILD_ENV" ]]; then
  echo "Missing $BUILD_ENV — copy from ${BUILD_ENV}.example and fill prod NEXT_PUBLIC_* / DATABASE_URL." >&2
  exit 1
fi

echo "==> Building localhost/$IMAGE (prod NEXT_PUBLIC_* inlined) from $APPS_ROOT ..."
cd "$APPS_ROOT"
podman build --no-cache --network host \
  --secret "id=dotenv,src=$BUILD_ENV" \
  -f "$REPO/Dockerfile" \
  --ignorefile "$REPO/.dockerignore" \
  -t "$IMAGE" .

echo "==> Loading localhost/$IMAGE into ${RUN_USER}'s rootless store ..."
podman save "localhost/$IMAGE" | sudo -u "$RUN_USER" podman load

echo "==> Restarting $UNIT ..."
sudo systemctl --user -M "${RUN_USER}@" restart "$UNIT"
sudo systemctl --user -M "${RUN_USER}@" --no-pager --lines=0 status "$UNIT" || true

echo "==> Smoke check (http://127.0.0.1:3039/) ..."
if ! curl -fsS -o /dev/null -w 'public / -> %{http_code}\n' --max-time 15 http://127.0.0.1:3039/; then
  echo "WARN: smoke check failed. Logs: journalctl --user -M ${RUN_USER}@ -u $UNIT -e" >&2
fi

echo "Deploy complete. Site: https://gonsalvesfamily.com"
echo "If assets look stale: hard-refresh (Ctrl+Shift+R); ensure nginx is not caching the HTML response."
