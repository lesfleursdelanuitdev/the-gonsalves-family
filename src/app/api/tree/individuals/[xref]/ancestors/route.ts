import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { mapIndividualRow } from "@/lib/individual-mapper";
import {
  loadParentChildMaps,
  loadSiblingMap,
  getAncestorIds,
} from "@/lib/tree-ancestry";

function normalizeXref(xref: string): string {
  const s = xref.trim();
  if (!s.startsWith("@")) return `@${s}@`;
  return s;
}

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

export async function GET(
  req: NextRequest,
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

    const { xref } = await params;
    const normalized = normalizeXref(xref);

    const url = new URL(req.url);
    const depthParam = url.searchParams.get("depth");
    const maxDepth = depthParam ? Math.min(Math.max(0, parseInt(depthParam, 10) || 10), 20) : 10;
    const includeSelf = url.searchParams.get("includeSelf") === "true";
    const includeAuntsUncles = url.searchParams.get("includeAuntsUncles") === "true";

    const [root, { childToParents }, siblingMapResult] = await Promise.all([
      prisma.gedcomIndividual.findFirst({
        where: { fileUuid, xref: normalized },
        select: { id: true },
      }),
      loadParentChildMaps(fileUuid),
      includeAuntsUncles ? loadSiblingMap(fileUuid) : Promise.resolve(null),
    ]);

    if (!root) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    const siblingMap = siblingMapResult ?? undefined;

    const depthToIds = getAncestorIds(root.id, childToParents, maxDepth, siblingMap);

    const allIds = new Set<string>();
    if (includeSelf) allIds.add(root.id);
    for (const ids of depthToIds.values()) {
      for (const id of ids) allIds.add(id);
    }

    if (allIds.size === 0) {
      return NextResponse.json({
        ancestors: [],
        meta: { total: 0, maxDepth: 0 },
      });
    }

    const rows = await prisma.gedcomIndividual.findMany({
      where: { id: { in: Array.from(allIds) } },
      select: INDIVIDUAL_SELECT,
    });

    const byId = new Map(rows.map((r) => [r.id, r]));
    const result: Array<ReturnType<typeof mapIndividualRow> & { depth: number }> = [];

    if (includeSelf && byId.has(root.id)) {
      result.push({ ...mapIndividualRow(byId.get(root.id)!), depth: 0 });
    }
    for (const [d, ids] of depthToIds.entries()) {
      for (const id of ids) {
        const row = byId.get(id);
        if (row) result.push({ ...mapIndividualRow(row), depth: d });
      }
    }

    result.sort((a, b) => a.depth - b.depth || (a.lastName ?? "").localeCompare(b.lastName ?? ""));

    return NextResponse.json({
      ancestors: result,
      meta: { total: result.length, maxDepth: result.length ? Math.max(...result.map((r) => r.depth)) : 0 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
