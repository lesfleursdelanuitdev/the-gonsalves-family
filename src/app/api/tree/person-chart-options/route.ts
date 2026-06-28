import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { loadParentChildMaps, loadSpouseMap, getAncestorIds, getDescendantIds } from "@/lib/tree-ancestry";
import { DEFAULT_MAX_DEPTH } from "@/genealogy-visualization-engine";
import { formatMinimalLivingLabel } from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { canViewFullIndividual } from "@/lib/auth/public-viewer";

export type PersonChartOptionKey = "pedigree" | "vertical_pedigree" | "fan_chart" | "descendancy";

function countAncestorConePeople(rootId: string, childToParents: Map<string, string[]>, maxDepth: number): number {
  const depthToIds = getAncestorIds(rootId, childToParents, maxDepth);
  let n = 1;
  for (const set of depthToIds.values()) {
    n += set.size;
  }
  return n;
}

function countDescendancyPeople(
  rootId: string,
  parentToChildren: Map<string, string[]>,
  spouseMap: Map<string, Set<string>>,
  maxDepth: number,
): number {
  const depthToIds = getDescendantIds(rootId, parentToChildren, maxDepth, spouseMap);
  const seen = new Set<string>([rootId]);
  for (const ids of depthToIds.values()) {
    for (const id of ids) seen.add(id);
  }
  return seen.size;
}

/**
 * GET /api/tree/person-chart-options?personId=<gedcom_individual.uuid>
 *
 * Returns tree viewer chart choices with approximate headcounts for the individuals directory modal.
 */
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const personId = req.nextUrl.searchParams.get("personId")?.trim();
  if (!personId) {
    return NextResponse.json({ error: "Missing query parameter: personId" }, { status: 400 });
  }

  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const row = await prisma.gedcomIndividual.findFirst({
      where: { fileUuid, id: personId },
      select: { id: true, xref: true, fullName: true, isLiving: true, birthYear: true },
    });
    if (!row) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    const viewer = await resolvePublicViewer();
    const rawName = row.fullName?.trim() || row.xref;
    const displayName = canViewFullIndividual(viewer, row.isLiving)
      ? rawName
      : formatMinimalLivingLabel(rawName, row.birthYear ?? null);

    const maxDepth = DEFAULT_MAX_DEPTH;
    const [{ childToParents, parentToChildren }, spouseMap] = await Promise.all([
      loadParentChildMaps(fileUuid),
      loadSpouseMap(fileUuid),
    ]);

    const ancestorCount = countAncestorConePeople(row.id, childToParents, maxDepth);
    const descendancyCount = countDescendancyPeople(row.id, parentToChildren, spouseMap, maxDepth);

    const options: Array<{
      chart: PersonChartOptionKey;
      label: string;
      description: string;
      count: number;
    }> = [
      {
        chart: "pedigree",
        label: "Pedigree",
        description: "Ancestors above this person (classic layout).",
        count: ancestorCount,
      },
      {
        chart: "vertical_pedigree",
        label: "Vertical pedigree",
        description: "Ancestor cone, top-to-bottom.",
        count: ancestorCount,
      },
      {
        chart: "fan_chart",
        label: "Fan chart",
        description: "Ancestor cone as a fan.",
        count: ancestorCount,
      },
      {
        chart: "descendancy",
        label: "Descendancy",
        description: "Descendants and linked spouses within depth.",
        count: descendancyCount,
      },
    ];

    return NextResponse.json({
      personId: row.id,
      xref: row.xref,
      displayName,
      depth: maxDepth,
      options,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
