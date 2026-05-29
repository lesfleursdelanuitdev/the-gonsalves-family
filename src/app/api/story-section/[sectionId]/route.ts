import { NextRequest, NextResponse } from "next/server";
import { fetchPublishedSectionBlocks } from "@/lib/stories/story-queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  const { sectionId } = await params;
  if (!sectionId?.trim()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const blocks = await fetchPublishedSectionBlocks(sectionId.trim());
    if (blocks === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ blocks });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
