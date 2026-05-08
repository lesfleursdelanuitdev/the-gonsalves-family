import { NextResponse } from "next/server";
import { resolveTreeId } from "@/lib/tree";

const PYTHON_API_URL = (process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");

export async function GET() {
  try {
    const treeId = await resolveTreeId();
    if (!treeId) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const res = await fetch(
      `${PYTHON_API_URL}/api/research/trees/${encodeURIComponent(treeId)}/analytics/given-names?limit=200`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      top_names?: Array<{ id: string; name: string; frequency: number }>;
      error?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch given-name analytics" },
        { status: res.status },
      );
    }

    const givenNames = (data.top_names ?? []).map((name) => ({
      id: name.id,
      givenName: name.name,
      frequency: name.frequency,
    }));

    return NextResponse.json({ givenNames });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research API unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
