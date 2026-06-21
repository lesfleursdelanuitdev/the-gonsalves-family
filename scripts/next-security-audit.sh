#!/bin/bash
# Next.js security/version audit for all our Next.js apps.
# For each app: compares the installed `next` version against npm's `latest`
# stable dist-tag, and runs `npm audit` against the production tree.
#
# Exit code: 0 = all current and clean, 1 = an app is behind latest stable
# or has a production advisory (so cron/CI can alert on it).
#
# Run: scripts/next-security-audit.sh
set -u

# Apps to check (absolute paths). Add new Next.js apps here.
APPS=(
  "/srv/apps/the-gonsalves-family"
  "/srv/apps/the-gonsalves-family-admin"
)

# Latest stable Next.js on npm (queried once, shared across apps).
LATEST="$(npm view next dist-tags.latest 2>/dev/null)"
if [ -z "$LATEST" ]; then
  echo "ERROR: could not reach npm to resolve next@latest (offline?)."
  exit 1
fi
echo "npm next@latest (stable): $LATEST"
echo

PROBLEM=0

for APP in "${APPS[@]}"; do
  NAME="$(basename "$APP")"
  if [ ! -d "$APP" ]; then
    echo "[$NAME] SKIP - directory not found: $APP"
    echo
    continue
  fi

  INSTALLED="$(node -p "require('$APP/node_modules/next/package.json').version" 2>/dev/null)"
  if [ -z "$INSTALLED" ]; then
    echo "[$NAME] WARN - next not installed (run npm install)"
    PROBLEM=1
    echo
    continue
  fi

  # Version comparison: if the highest of {installed, latest} is not installed,
  # then installed < latest and the app is behind.
  HIGHEST="$(printf '%s\n%s\n' "$INSTALLED" "$LATEST" | sort -V | tail -1)"
  if [ "$HIGHEST" != "$INSTALLED" ]; then
    echo "[$NAME] BEHIND - installed $INSTALLED, latest stable $LATEST -> bump recommended"
    PROBLEM=1
  else
    echo "[$NAME] OK - on latest stable ($INSTALLED)"
  fi

  # Production-dependency advisories only (dev tooling noise excluded).
  AUDIT="$(cd "$APP" && npm audit --omit=dev --json 2>/dev/null)"
  if [ -n "$AUDIT" ]; then
    TOTAL="$(printf '%s' "$AUDIT" | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null)"
    if [ "${TOTAL:-0}" -gt 0 ]; then
      echo "[$NAME] ADVISORIES - $TOTAL in production deps:"
      printf '%s' "$AUDIT" | jq -r \
        '.vulnerabilities | to_entries[] | "    - \(.key): \(.value.severity)"' 2>/dev/null
      PROBLEM=1
    else
      echo "[$NAME] audit clean (0 production advisories)"
    fi
  fi
  echo
done

if [ "$PROBLEM" -ne 0 ]; then
  echo "RESULT: action needed - see entries above."
  exit 1
fi
echo "RESULT: all apps on latest stable, no production advisories."
exit 0
