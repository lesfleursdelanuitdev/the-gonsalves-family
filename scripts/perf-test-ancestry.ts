/**
 * Performance test for ancestors and descendants API endpoints.
 * Calls route handlers directly (no server needed). Requires DATABASE_URL.
 *
 * Run: npx tsx --require tsconfig-paths/register scripts/perf-test-ancestry.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { NextRequest } from "next/server";
import { GET as getIndividuals } from "../src/app/api/tree/individuals/route";
import { GET as getAncestors } from "../src/app/api/tree/individuals/[xref]/ancestors/route";
import { GET as getDescendants } from "../src/app/api/tree/individuals/[xref]/descendants/route";

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(times: number[]): { min: number; max: number; avg: number; p50: number; p95: number } {
  if (times.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0 };
  const sum = times.reduce((a, b) => a + b, 0);
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: sum / times.length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
  };
}

async function measure(
  name: string,
  fn: () => Promise<Response>,
  iterations: number
): Promise<void> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const res = await fn();
    const elapsed = performance.now() - start;
    times.push(elapsed);
    if (res.status !== 200) {
      console.warn(`  [${name}] iteration ${i + 1} returned ${res.status}`);
    }
  }
  const s = stats(times);
  console.log(`\n${name} (${iterations} iterations):`);
  console.log(`  min: ${s.min.toFixed(1)}ms  max: ${s.max.toFixed(1)}ms  avg: ${s.avg.toFixed(1)}ms`);
  console.log(`  p50: ${s.p50.toFixed(1)}ms  p95: ${s.p95.toFixed(1)}ms`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Use .env.local");
    process.exit(1);
  }

  const iterations = parseInt(process.env.PERF_ITERATIONS ?? "30", 10);

  // Get a valid xref
  const indRes = await getIndividuals(new NextRequest("http://localhost/api/tree/individuals"));
  if (indRes.status !== 200) {
    console.error("Failed to fetch individuals:", indRes.status);
    process.exit(1);
  }
  const json = await indRes.json();
  const xref = json.individuals?.[0]?.xref ?? "@I0145@";
  console.log(`Using xref: ${xref}`);
  console.log(`Iterations: ${iterations}`);

  await measure(
    "Ancestors (depth=10, includeSelf=true)",
    () => {
      const req = new NextRequest(
        `http://localhost/api/tree/individuals/${xref}/ancestors?depth=10&includeSelf=true`
      );
      return getAncestors(req, { params: Promise.resolve({ xref }) });
    },
    iterations
  );

  await measure(
    "Ancestors (depth=3, includeSelf=false)",
    () => {
      const req = new NextRequest(
        `http://localhost/api/tree/individuals/${xref}/ancestors?depth=3&includeSelf=false`
      );
      return getAncestors(req, { params: Promise.resolve({ xref }) });
    },
    iterations
  );

  await measure(
    "Ancestors (depth=10, includeAuntsUncles=true)",
    () => {
      const req = new NextRequest(
        `http://localhost/api/tree/individuals/${xref}/ancestors?depth=10&includeAuntsUncles=true`
      );
      return getAncestors(req, { params: Promise.resolve({ xref }) });
    },
    iterations
  );

  await measure(
    "Descendants (depth=10, includeSelf=true)",
    () => {
      const req = new NextRequest(
        `http://localhost/api/tree/individuals/${xref}/descendants?depth=10&includeSelf=true`
      );
      return getDescendants(req, { params: Promise.resolve({ xref }) });
    },
    iterations
  );

  await measure(
    "Descendants (depth=3, includeSpouses=true)",
    () => {
      const req = new NextRequest(
        `http://localhost/api/tree/individuals/${xref}/descendants?depth=3&includeSpouses=true`
      );
      return getDescendants(req, { params: Promise.resolve({ xref }) });
    },
    iterations
  );

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
