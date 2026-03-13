#!/usr/bin/env bash
# Load test ancestors and descendants endpoints with autocannon.
# Start the dev server first: npm run dev
# Run: ./scripts/perf-load-test.sh [base_url]
# Example: ./scripts/perf-load-test.sh http://localhost:3000

BASE="${1:-http://localhost:3000}"
XREF="I0145"  # Aaron Peter Gonsalves (works with or without @)

echo "Load testing $BASE (10 connections, 10s duration)"
echo ""

echo "=== Ancestors (depth=10, includeSelf=true) ==="
npx autocannon -c 10 -d 10 "$BASE/api/tree/individuals/$XREF/ancestors?depth=10&includeSelf=true"
echo ""

echo "=== Descendants (depth=10, includeSelf=true) ==="
npx autocannon -c 10 -d 10 "$BASE/api/tree/individuals/$XREF/descendants?depth=10&includeSelf=true"
