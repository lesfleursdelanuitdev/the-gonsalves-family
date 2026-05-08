import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { frequencyDistributionFromOccurrences } from "@/lib/analytics-frequency-buckets";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";

const PYTHON_API_URL = (process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");

async function surnamesFromPrisma(fileUuid: string, limit: number) {
  const [topRows, totalUnique, agg, freqOnly] = await Promise.all([
    prisma.gedcomSurname.findMany({
      where: { fileUuid },
      select: { id: true, surname: true, frequency: true },
      orderBy: { frequency: "desc" },
      take: limit,
    }),
    prisma.gedcomSurname.count({ where: { fileUuid } }),
    prisma.gedcomSurname.aggregate({
      where: { fileUuid },
      _sum: { frequency: true },
    }),
    prisma.gedcomSurname.findMany({
      where: { fileUuid },
      select: { frequency: true },
    }),
  ]);

  const freqs = freqOnly.map((r) => r.frequency);
  const once = freqs.filter((f) => f === 1).length;
  const twoToNine = freqs.filter((f) => f >= 2 && f < 10).length;
  const tenPlus = freqs.filter((f) => f >= 10).length;

  const summary = {
    total_unique_surnames: totalUnique,
    total_occurrences: agg._sum.frequency ?? 0,
    surnames_appearing_once: once,
    surnames_2_to_9: twoToNine,
    surnames_10_plus: tenPlus,
  };

  const surnames = topRows.map((r) => ({
    id: r.id,
    surname: r.surname,
    frequency: r.frequency,
  }));

  const top_surnames = topRows.map((r) => ({ name: r.surname, frequency: r.frequency }));
  const frequency_distribution = frequencyDistributionFromOccurrences(freqs);

  return { surnames, summary, top_surnames, frequency_distribution };
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

    try {
      const res = await fetch(
        `${PYTHON_API_URL}/api/research/trees/${encodeURIComponent(treeId)}/analytics/surnames?limit=200`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        top_surnames?: Array<{ id: string; name: string; frequency: number }>;
        summary?: Record<string, number>;
        frequency_distribution?: { bucket: string; count: number }[];
        error?: string;
      };
      if (res.ok && Array.isArray(data.top_surnames) && data.top_surnames.length > 0) {
        const surnames = data.top_surnames.map((name) => ({
          id: name.id,
          surname: name.name,
          frequency: name.frequency,
        }));
        return NextResponse.json({
          surnames,
          summary: data.summary,
          top_surnames: data.top_surnames.map((n) => ({ name: n.name, frequency: n.frequency })),
          frequency_distribution: data.frequency_distribution,
          source: "analytics" as const,
        });
      }
    } catch {
      /* Prisma fallback */
    }

    const fallback = await surnamesFromPrisma(fileUuid, 200);
    return NextResponse.json({ ...fallback, source: "prisma" as const });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
