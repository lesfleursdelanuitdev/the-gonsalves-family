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
      `${PYTHON_API_URL}/api/research/trees/${encodeURIComponent(treeId)}/analytics/surnames?limit=200`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      top_surnames?: Array<{ id: string; name: string; frequency: number }>;
      error?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch surname analytics" },
        { status: res.status },
      );
    }

    const surnames = (data.top_surnames ?? []).map((name) => ({
      id: name.id,
      surname: name.name,
      frequency: name.frequency,
    }));

    return NextResponse.json({ surnames });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research API unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
