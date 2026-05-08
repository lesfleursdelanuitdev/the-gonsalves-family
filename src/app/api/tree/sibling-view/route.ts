import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { individualLifeYearsFromRow, mapIndividualRow } from "@/lib/individual-mapper";
import {
  loadParentChildMaps,
  loadSpouseMap,
  getDescendantIds,
} from "@/lib/tree-ancestry";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";
import {
  chartPediByFamilyAndChildId,
  selectBirthFamilyIdForChild,
} from "@/lib/tree/parents-label-for-family";
import { individualBirthDeathPlaceSelect } from "@/lib/gedcom-place-display";
import { gedcomIndividualNlDenormSelect } from "@/lib/gedcom-individual-nl-select";

const INDIVIDUAL_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  birthYear: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  ...individualBirthDeathPlaceSelect,
  ...gedcomIndividualNlDenormSelect,
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
 * GET /api/tree/sibling-view?person=@I123@&depth=10
 *
 * Returns the same shape as descendancy (people, unions, rootId, rootUuid) for
 * the "Show parents & siblings" view: birth union, full-sibling trees (recursed), and
 * other unions where the person is a child (children only, no recursion).
 * Root is the birth father (X) of the birth union.
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
    const personParam = searchParams.get("person");
    if (!personParam) {
      return NextResponse.json(
        { error: "Missing query parameter: person (individual xref)" },
        { status: 400 }
      );
    }
    const personXref = normalizeXref(personParam);
    const depthParam = searchParams.get("depth");
    const maxDepth = depthParam ? Math.min(Math.max(1, parseInt(depthParam, 10) || 10), 20) : 10;

    const [p, { parentToChildren }, spouseMap, parentChildRows, allIndividualsXref, allFamilies] =
      await Promise.all([
        prisma.gedcomIndividual.findFirst({
          where: { fileUuid, xref: personXref },
          select: { id: true, xref: true },
        }),
        loadParentChildMaps(fileUuid),
        loadSpouseMap(fileUuid),
        prisma.gedcomParentChild.findMany({
          where: { fileUuid },
          select: { familyId: true, childId: true, pedigree: true, relationshipType: true },
        }),
        prisma.gedcomIndividual.findMany({
          where: { fileUuid },
          select: { id: true, xref: true },
        }),
        prisma.gedcomFamily.findMany({
          where: { fileUuid },
          select: { id: true, xref: true, husbandXref: true, wifeXref: true },
        }),
      ]);

    if (!p) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    const pAsChildRows = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, childId: p.id },
      select: { familyId: true, pedigree: true, relationshipType: true },
    });

    const xrefToId = new Map<string, string>(allIndividualsXref.map((r) => [r.xref, r.id]));
    const idToXref = new Map<string, string>(allIndividualsXref.map((r) => [r.id, r.xref]));
    const idForXref = (xref: string | null) => (xref ? xrefToId.get(xref) : undefined);

    const chartPediMap = chartPediByFamilyAndChildId(
      parentChildRows.map((r) => ({
        familyId: r.familyId,
        childId: r.childId,
        pedigree: r.pedigree,
        relationshipType: r.relationshipType,
      }))
    );

    const familyToChildIds = new Map<string, string[]>();
    for (const r of parentChildRows) {
      if (!r.familyId) continue;
      const list = familyToChildIds.get(r.familyId) ?? [];
      if (!list.includes(r.childId)) list.push(r.childId);
      familyToChildIds.set(r.familyId, list);
    }

    const unionsWherePIsChild = new Set<string>();
    for (const r of pAsChildRows) {
      if (!r.familyId) continue;
      unionsWherePIsChild.add(r.familyId);
    }
    const birthFamilyId = selectBirthFamilyIdForChild(
      pAsChildRows.map((r) => ({
        familyId: r.familyId,
        pedigree: r.pedigree,
        relationshipType: r.relationshipType,
      }))
    );
    const birthFamilyRow = birthFamilyId ? allFamilies.find((f) => f.id === birthFamilyId) : null;
    const birthSpouseKey = birthFamilyRow
      ? `${birthFamilyRow.husbandXref ?? ""}\t${birthFamilyRow.wifeXref ?? ""}`
      : null;
    const otherUnionFamilyIds = Array.from(unionsWherePIsChild).filter((id) => id !== birthFamilyId);
    /** Same couple as birth FAM must not appear again as "adoptive" (duplicate FAM records in GEDCOM). */
    const otherUnionFamilyIdsDeduped = otherUnionFamilyIds.filter((id) => {
      if (!birthSpouseKey) return true;
      const fam = allFamilies.find((f) => f.id === id);
      if (!fam) return false;
      const key = `${fam.husbandXref ?? ""}\t${fam.wifeXref ?? ""}`;
      return key !== birthSpouseKey;
    });

    const peopleIds = new Set<string>([p.id]);
    const includedFamilyIds = new Set<string>();

    let rootXref = p.xref;
    let rootUuid = p.id;

    let xOtherFamilyIds: string[] = [];
    let yOtherFamilyIds: string[] = [];

    if (birthFamilyId) {
      const birthFamily = allFamilies.find((f) => f.id === birthFamilyId);
      if (birthFamily) {
        const xId = idForXref(birthFamily.husbandXref);
        const yId = idForXref(birthFamily.wifeXref);
        if (xId) {
          rootXref = birthFamily.husbandXref ?? p.xref;
          rootUuid = xId;
          peopleIds.add(xId);
        }
        if (yId) peopleIds.add(yId);
        includedFamilyIds.add(birthFamilyId);
        const birthChildIds = familyToChildIds.get(birthFamilyId) ?? [];
        for (const cid of birthChildIds) {
          peopleIds.add(cid);
          const depthToIds = getDescendantIds(cid, parentToChildren, maxDepth, spouseMap);
          for (const ids of depthToIds.values()) {
            for (const id of ids) peopleIds.add(id);
          }
        }

        xOtherFamilyIds = await getFamilyIdsWherePersonIsSpouse(fileUuid, xId);
        yOtherFamilyIds = await getFamilyIdsWherePersonIsSpouse(fileUuid, yId);
        const otherFamilyIdsExcludingBirth = new Set<string>([
          ...xOtherFamilyIds.filter((id) => id !== birthFamilyId),
          ...yOtherFamilyIds.filter((id) => id !== birthFamilyId),
        ]);

        for (const famId of otherFamilyIdsExcludingBirth) {
          includedFamilyIds.add(famId);
          const fam = allFamilies.find((f) => f.id === famId);
          if (fam) {
            const husbId = idForXref(fam.husbandXref);
            const wifeId = idForXref(fam.wifeXref);
            if (husbId) peopleIds.add(husbId);
            if (wifeId) peopleIds.add(wifeId);
          }
          const childIds = familyToChildIds.get(famId) ?? [];
          for (const cid of childIds) {
            peopleIds.add(cid);
            const depthToIds = getDescendantIds(cid, parentToChildren, maxDepth, spouseMap);
            for (const ids of depthToIds.values()) {
              for (const id of ids) peopleIds.add(id);
            }
          }
        }
      }
    }

    for (const famId of otherUnionFamilyIds) {
      includedFamilyIds.add(famId);
      const fam = allFamilies.find((f) => f.id === famId);
      if (fam) {
        const husbId = idForXref(fam.husbandXref);
        const wifeId = idForXref(fam.wifeXref);
        if (husbId) peopleIds.add(husbId);
        if (wifeId) peopleIds.add(wifeId);
      }
      const childIds = familyToChildIds.get(famId) ?? [];
      for (const cid of childIds) peopleIds.add(cid);
    }

    for (const famId of includedFamilyIds) {
      const fam = allFamilies.find((f) => f.id === famId);
      if (!fam) continue;
      const husbId = idForXref(fam.husbandXref);
      const wifeId = idForXref(fam.wifeXref);
      if (husbId) peopleIds.add(husbId);
      if (wifeId) peopleIds.add(wifeId);
      for (const cid of familyToChildIds.get(famId) ?? []) peopleIds.add(cid);
    }

    // Include every family where husband, wife, or any child is in peopleIds (sibling subtrees need their unions)
    for (const fam of allFamilies) {
      const husbId = idForXref(fam.husbandXref);
      const wifeId = idForXref(fam.wifeXref);
      const childIds = familyToChildIds.get(fam.id) ?? [];
      const husbIn = husbId != null && peopleIds.has(husbId);
      const wifeIn = wifeId != null && peopleIds.has(wifeId);
      const anyChildIn = childIds.some((c) => peopleIds.has(c));
      if (husbIn || wifeIn || anyChildIn) includedFamilyIds.add(fam.id);
    }

    for (const famId of includedFamilyIds) {
      const fam = allFamilies.find((f) => f.id === famId);
      if (!fam) continue;
      const husbId = idForXref(fam.husbandXref);
      const wifeId = idForXref(fam.wifeXref);
      if (husbId) peopleIds.add(husbId);
      if (wifeId) peopleIds.add(wifeId);
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

    const unions = allFamilies
      .filter((f) => includedFamilyIds.has(f.id))
      .map((fam) => {
        const childIds = familyToChildIds.get(fam.id) ?? [];
        const husbXref = fam.husbandXref ?? null;
        const wifeXref = fam.wifeXref ?? null;
        const children = childIds.map((childId) => {
          const childXref = idToXref.get(childId);
          const pediKey = `${fam.id}\t${childId}`;
          return {
            id: childXref ?? childId,
            pedi: chartPediMap.get(pediKey) ?? "birth",
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

    const birthFamily = birthFamilyId ? allFamilies.find((f) => f.id === birthFamilyId) : null;
    const xXref = birthFamily?.husbandXref ?? null;
    const yXref = birthFamily?.wifeXref ?? null;
    const spouseCatchAlls: string[] = [];
    if (xXref && xOtherFamilyIds.some((id) => id !== birthFamilyId)) spouseCatchAlls.push(xXref);
    if (yXref && yOtherFamilyIds.some((id) => id !== birthFamilyId)) spouseCatchAlls.push(yXref);

    const adoptiveUnions = otherUnionFamilyIdsDeduped
      .map((id) => allFamilies.find((f) => f.id === id)?.xref)
      .filter((xref): xref is string => xref != null);

    const adoptiveCatchAlls: string[] = [];
    const includedFamilies = allFamilies.filter((f) => includedFamilyIds.has(f.id));
    for (const famId of otherUnionFamilyIdsDeduped) {
      const fam = allFamilies.find((f) => f.id === famId);
      if (!fam) continue;
      const husbXref = fam.husbandXref ?? "";
      const wifeXref = fam.wifeXref ?? "";
      for (const personXref of [husbXref, wifeXref]) {
        if (!personXref || adoptiveCatchAlls.includes(personXref)) continue;
        const otherUnionsForPerson = includedFamilies.filter(
          (f) => f.husbandXref === personXref || f.wifeXref === personXref
        );
        if (otherUnionsForPerson.length > 1) adoptiveCatchAlls.push(personXref);
      }
    }

    const siblingView = {
      personId: personXref,
      spouseCatchAlls,
      adoptiveUnions,
      adoptiveCatchAlls,
      birthFatherPersonId: birthFamily?.husbandXref?.trim() || null,
      birthMotherPersonId: birthFamily?.wifeXref?.trim() || null,
    };

    return NextResponse.json({
      rootId: rootXref,
      rootUuid,
      people,
      unions,
      siblingView,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getFamilyIdsWherePersonIsSpouse(
  fileUuid: string,
  personId: string | undefined
): Promise<string[]> {
  if (!personId) return [];
  const rows = await prisma.gedcomSpouse.findMany({
    where: {
      fileUuid,
      OR: [{ individualId: personId }, { spouseId: personId }],
    },
    select: { familyId: true },
  });
  const ids: string[] = [];
  for (const r of rows) {
    if (r.familyId && !ids.includes(r.familyId)) ids.push(r.familyId);
  }
  return ids;
}
