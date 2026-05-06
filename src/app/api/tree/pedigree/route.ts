import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { individualLifeYearsFromRow, mapIndividualRow } from "@/lib/individual-mapper";
import { loadParentChildMaps, getAncestorIds } from "@/lib/tree-ancestry";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";

const INDIVIDUAL_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  birthYear: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  deathYear: true,
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

/**
 * GET /api/tree/pedigree?root=@I123@&depth=10
 *
 * Returns people and unions for the ancestor cone (birth parent links) up to `depth` generations.
 */
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const rootParam = searchParams.get("root");
    if (!rootParam) {
      return NextResponse.json({ error: "Missing query parameter: root (individual xref)" }, { status: 400 });
    }
    const rootXref = normalizeXref(rootParam);
    const depthParam = searchParams.get("depth");
    const maxDepth = depthParam ? Math.min(Math.max(1, parseInt(depthParam, 10) || 10), 20) : 10;

    const [root, { childToParents }, allIndividualsXref, families, parentChildRows] = await Promise.all([
      prisma.gedcomIndividual.findFirst({
        where: { fileUuid, xref: rootXref },
        select: { id: true, xref: true },
      }),
      loadParentChildMaps(fileUuid),
      prisma.gedcomIndividual.findMany({
        where: { fileUuid },
        select: { id: true, xref: true },
      }),
      prisma.gedcomFamily.findMany({
        where: { fileUuid },
        select: { id: true, xref: true, husbandXref: true, wifeXref: true },
      }),
      prisma.gedcomParentChild.findMany({
        where: { fileUuid },
        select: { familyId: true, childId: true },
      }),
    ]);

    if (!root) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    const xrefToId = new Map<string, string>(allIndividualsXref.map((r) => [r.xref, r.id]));
    const idToXref = new Map<string, string>(allIndividualsXref.map((r) => [r.id, r.xref]));

    const depthToIds = getAncestorIds(root.id, childToParents, maxDepth);
    const ancestorIds = new Set<string>();
    ancestorIds.add(root.id);
    for (const ids of depthToIds.values()) {
      for (const id of ids) ancestorIds.add(id);
    }

    const familyToChildIds = new Map<string, string[]>();
    for (const r of parentChildRows) {
      if (!r.familyId) continue;
      const list = familyToChildIds.get(r.familyId) ?? [];
      if (!list.includes(r.childId)) list.push(r.childId);
      familyToChildIds.set(r.familyId, list);
    }

    const idForXref = (xref: string | null) => (xref ? xrefToId.get(xref) : undefined);

    const includedFamilyIds = new Set<string>();
    for (const fam of families) {
      const husbId = idForXref(fam.husbandXref);
      const wId = idForXref(fam.wifeXref);
      const childIds = familyToChildIds.get(fam.id) ?? [];
      const husbIn = husbId != null && ancestorIds.has(husbId);
      const wifeIn = wId != null && ancestorIds.has(wId);
      const anyChildIn = childIds.some((c) => ancestorIds.has(c));
      if (husbIn || wifeIn || anyChildIn) includedFamilyIds.add(fam.id);
    }

    const peopleIds = new Set(ancestorIds);
    for (const famId of includedFamilyIds) {
      const fam = families.find((f) => f.id === famId);
      if (!fam) continue;
      const husbId = idForXref(fam.husbandXref);
      const wId = idForXref(fam.wifeXref);
      if (husbId) peopleIds.add(husbId);
      if (wId) peopleIds.add(wId);
      for (const cid of familyToChildIds.get(famId) ?? []) peopleIds.add(cid);
    }

    const individualRows = await prisma.gedcomIndividual.findMany({
      where: { id: { in: Array.from(peopleIds) } },
      select: INDIVIDUAL_SELECT,
    });

    const photoByIndividual = await batchIndividualDisplayPhotoMedia(
      prisma,
      fileUuid,
      individualRows.map((r) => r.id)
    );

    const people = individualRows.map((row) => {
      const mapped = mapIndividualRow(row);
      const { birthYear, deathYear } = individualLifeYearsFromRow(row);
      return {
        ...mapped,
        id: row.xref,
        uuid: row.id,
        firstName: mapped.firstName ?? "",
        lastName: mapped.lastName ?? "",
        birthYear,
        deathYear,
        photoUrl: individualDisplayPhotoMediaToPublicUrl(photoByIndividual.get(row.id)) ?? null,
      };
    });

    const unions = families
      .filter((f) => includedFamilyIds.has(f.id))
      .map((fam) => {
        const childIds = familyToChildIds.get(fam.id) ?? [];
        const husbXref = fam.husbandXref ?? null;
        const wifeXref = fam.wifeXref ?? null;
        const children = childIds.map((childId) => {
          const childXref = idToXref.get(childId);
          return {
            id: childXref ?? childId,
            pedi: "birth" as string,
          };
        });
        return {
          id: fam.xref,
          uuid: fam.id,
          husb: husbXref ?? "",
          wife: wifeXref ?? "",
          children,
        };
      });

    return NextResponse.json({
      rootId: root.xref,
      rootUuid: root.id,
      people,
      unions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
