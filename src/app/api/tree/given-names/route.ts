import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { frequencyDistributionFromOccurrences } from "@/lib/analytics-frequency-buckets";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";

const PYTHON_API_URL = (process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");

async function givenNamesFromPrisma(fileUuid: string, limit: number) {
  const [topRows, totalUnique, agg, freqOnly] = await Promise.all([
    prisma.gedcomGivenName.findMany({
      where: { fileUuid },
      select: { id: true, givenName: true, frequency: true },
      orderBy: { frequency: "desc" },
      take: limit,
    }),
    prisma.gedcomGivenName.count({ where: { fileUuid } }),
    prisma.gedcomGivenName.aggregate({
      where: { fileUuid },
      _sum: { frequency: true },
    }),
    prisma.gedcomGivenName.findMany({
      where: { fileUuid },
      select: { frequency: true },
    }),
  ]);

  const freqs = freqOnly.map((r) => r.frequency);
  const namesOnce = freqs.filter((f) => f === 1).length;
  const names2to9 = freqs.filter((f) => f >= 2 && f < 10).length;
  const names10plus = freqs.filter((f) => f >= 10).length;

  const summary = {
    total_unique_names: totalUnique,
    total_individuals_with_names: agg._sum.frequency ?? 0,
    names_appearing_once: namesOnce,
    names_2_to_9: names2to9,
    names_10_plus: names10plus,
  };

  const givenNames = topRows.map((r) => ({
    id: r.id,
    givenName: r.givenName,
    frequency: r.frequency,
  }));

  const top_names = topRows.map((r) => ({ name: r.givenName, frequency: r.frequency }));
  const frequency_distribution = frequencyDistributionFromOccurrences(freqs);

  return {
    givenNames,
    summary,
    top_names,
    frequency_distribution,
  };
}

export async function GET() {
  try {
    const treeId = await resolveTreeId();
    if (!treeId) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree file not found" }, { status: 404 });
    }

    const limit = 200;

    try {
      const res = await fetch(
        `${PYTHON_API_URL}/api/research/trees/${encodeURIComponent(treeId)}/analytics/given-names?limit=${limit}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        top_names?: Array<{ id: string; name: string; frequency: number }>;
        summary?: Record<string, number>;
        frequency_distribution?: { bucket: string; count: number }[];
        error?: string;
      };
      if (res.ok && Array.isArray(data.top_names) && data.top_names.length > 0) {
        const givenNames = data.top_names.map((name) => ({
          id: name.id,
          givenName: name.name,
          frequency: name.frequency,
        }));
        return NextResponse.json({
          givenNames,
          summary: data.summary,
          top_names: data.top_names.map((n) => ({ name: n.name, frequency: n.frequency })),
          frequency_distribution: data.frequency_distribution,
          source: "analytics" as const,
        });
      }
    } catch {
      /* Prisma fallback */
    }

    const fallback = await givenNamesFromPrisma(fileUuid, limit);
    return NextResponse.json({ ...fallback, source: "prisma" as const });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
