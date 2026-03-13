import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { mapIndividualRow } from "@/lib/individual-mapper";
import {
  loadParentChildMaps,
  loadSpouseMap,
  getDescendantIds,
} from "@/lib/tree-ancestry";

const INDIVIDUAL_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  isLiving: true,
  sex: true,
  gender: true,
  individualNameForms: {
    where: { isPrimary: true },
    take: 1,
    include: {
      givenNames: { include: { givenName: true }, orderBy: { position: "asc" as const } },
      surnames: { include: { surname: true }, orderBy: { position: "asc" as const } },
    },
  },
} as const;

function normalizeXref(xref: string): string {
  const s = xref.trim();
  return s.startsWith("@") ? s : `@${s}@`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ xref: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const { xref: xrefParam } = await params;
    const xref = normalizeXref(xrefParam);

    const searchParams = _req.nextUrl.searchParams;
    const depthParam = searchParams.get("depth");
    const maxDepth = depthParam ? Math.min(Math.max(0, parseInt(depthParam, 10) || 10), 20) : 10;
    const includeSelf = searchParams.get("includeSelf") === "true";
    const includeSpouses = searchParams.get("includeSpouses") === "true";

    const [root, { parentToChildren }, spouseMapResult] = await Promise.all([
      prisma.gedcomIndividual.findFirst({
        where: { fileUuid, xref },
        select: { id: true },
      }),
      loadParentChildMaps(fileUuid),
      includeSpouses ? loadSpouseMap(fileUuid) : Promise.resolve(null),
    ]);

    if (!root) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    const spouseMap = spouseMapResult ?? undefined;

    const depthToIds = getDescendantIds(root.id, parentToChildren, maxDepth, spouseMap);

    const allIds = new Set<string>();
    if (includeSelf) allIds.add(root.id);
    for (const ids of depthToIds.values()) {
      for (const id of ids) allIds.add(id);
    }

    if (allIds.size === 0) {
      return NextResponse.json({
        descendants: [],
        meta: { total: 0, maxDepth: 0 },
      });
    }

    const rows = await prisma.gedcomIndividual.findMany({
      where: { id: { in: Array.from(allIds) } },
      select: INDIVIDUAL_SELECT,
    });

    const byId = new Map(rows.map((r) => [r.id, r]));
    const depthByKey = new Map<string, number>();
    if (includeSelf) depthByKey.set(root.id, 0);
    for (const [d, ids] of depthToIds) {
      for (const id of ids) depthByKey.set(id, d);
    }

    const items = rows
      .map((row) => {
        const depth = depthByKey.get(row.id);
        if (depth === undefined) return null;
        return { ...mapIndividualRow(row), depth };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.depth - b.depth || (a.lastName ?? "").localeCompare(b.lastName ?? ""));

    const maxDepthFound = items.length > 0 ? Math.max(...items.map((i) => i.depth)) : 0;

    return NextResponse.json({
      descendants: items,
      meta: { total: items.length, maxDepth: maxDepthFound },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
