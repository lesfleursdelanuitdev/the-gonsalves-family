import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { authRequiredResponse } from "@/lib/auth/auth-required-response";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { isAuthenticatedViewer } from "@/lib/auth/public-viewer";
import { loadIndividualLivingStatus } from "@/lib/individuals/load-individual-living-status";

const PYTHON_API_URL = (process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let fileUuid: string | null;
  try {
    fileUuid = await resolveTreeFileUuid();
  } catch (e) {
    console.error("[relationship-between] resolveTreeFileUuid error:", e);
    return NextResponse.json({ error: "Tree not available" }, { status: 503 });
  }

  if (!fileUuid) {
    return NextResponse.json({ error: "Tree not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const viewer = await resolvePublicViewer();
  if (!isAuthenticatedViewer(viewer)) {
    const sourceId = String(body.source_id ?? "").trim();
    const targetId = String(body.target_id ?? "").trim();
    if (sourceId && targetId) {
      const [sourceStatus, targetStatus] = await Promise.all([
        loadIndividualLivingStatus(sourceId),
        loadIndividualLivingStatus(targetId),
      ]);
      if (sourceStatus?.isLiving || targetStatus?.isLiving) {
        return authRequiredResponse("/research/relationship-calculator");
      }
    }
  }

  try {
    const res = await fetch(`${PYTHON_API_URL}/api/relationship/between`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...body, file_uuid: fileUuid }),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[relationship-between] Python API error:", e);
    return NextResponse.json({ error: "Relationship service unavailable" }, { status: 503 });
  }
}
