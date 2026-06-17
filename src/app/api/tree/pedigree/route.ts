import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { redactTreePeopleForViewer } from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { individualLifeYearsFromRow, mapIndividualRow } from "@/lib/individual-mapper";
import { loadParentChildMaps, getAncestorIds } from "@/lib/tree-ancestry";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";
import { chartPediByFamilyAndChildId } from "@/lib/tree/parents-label-for-family";
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
 * GET /api/tree/pedigree?root=@I123@&depth=10&famc=@F456@&famcOverrides=...
 *
 * Returns people and unions for the ancestor cone up to `depth` generations.
 * Optional `famc` is the GEDCOM family xref in which `root` is a child — use when the person has
 * multiple families as a child so the first generation of ancestors follows that FAMC only, and other
 * families where the proband is a child are omitted from the union list (so birth FAMC is not drawn alongside adoptive).
 *
 * Optional `famcOverrides` is a JSON object encoded as a query param: individual xref → family xref for **any**
 * person in the chart who should climb ancestors through a chosen child-family without becoming root (per-person FAMC).
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
    const famcParam = searchParams.get("famc");
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
        select: { familyId: true, childId: true, parentId: true, pedigree: true, relationshipType: true },
      }),
    ]);

    if (!root) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    const xrefToId = new Map<string, string>(allIndividualsXref.map((r) => [r.xref, r.id]));
    const idToXref = new Map<string, string>(allIndividualsXref.map((r) => [r.id, r.xref]));

    const chartPediMap = chartPediByFamilyAndChildId(
      parentChildRows.map((r) => ({
        familyId: r.familyId,
        childId: r.childId,
        pedigree: r.pedigree,
        relationshipType: r.relationshipType,
      }))
    );

    /** Child DB id → chosen family DB id when that child appears in multiple families (union exclusion + parent list). */
    const famcChoices = new Map<string, string>();
    let effectiveChildToParents: Map<string, string[]> = childToParents;

    const ensureMutableChildToParents = (): Map<string, string[]> => {
      if (effectiveChildToParents === childToParents) {
        effectiveChildToParents = new Map(childToParents);
      }
      return effectiveChildToParents;
    };

    const applyFamcForChild = (childDbId: string, familyRow: { id: string }): boolean => {
      const parentIdsForFam = [
        ...new Set(
          parentChildRows
            .filter((r) => r.childId === childDbId && r.familyId === familyRow.id && r.parentId)
            .map((r) => r.parentId)
        ),
      ];
      if (parentIdsForFam.length === 0) return false;
      ensureMutableChildToParents().set(childDbId, parentIdsForFam);
      famcChoices.set(childDbId, familyRow.id);
      return true;
    };

    if (famcParam) {
      const famXref = normalizeXref(famcParam);
      const familyRow = families.find((f) => f.xref === famXref);
      if (familyRow?.id) {
        applyFamcForChild(root.id, familyRow);
      }
    }

    const famcOverridesParam = searchParams.get("famcOverrides");
    if (famcOverridesParam) {
      try {
        const raw = JSON.parse(famcOverridesParam) as Record<string, string>;
        for (const [personXref, famXref] of Object.entries(raw)) {
          if (typeof personXref !== "string" || typeof famXref !== "string") continue;
          const ix = normalizeXref(personXref);
          const childId = xrefToId.get(ix);
          const familyRow = families.find((f) => f.xref === normalizeXref(famXref));
          if (childId && familyRow?.id) {
            applyFamcForChild(childId, familyRow);
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }

    const depthToIds = getAncestorIds(root.id, effectiveChildToParents, maxDepth);
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
      const childIds = familyToChildIds.get(fam.id) ?? [];
      let skipForChosenFamc = false;
      for (const cid of childIds) {
        const chosenFamId = famcChoices.get(cid);
        if (chosenFamId != null && fam.id !== chosenFamId) {
          skipForChosenFamc = true;
          break;
        }
      }
      if (skipForChosenFamc) continue;
      const husbId = idForXref(fam.husbandXref);
      const wId = idForXref(fam.wifeXref);
      const husbIn = husbId != null && ancestorIds.has(husbId);
      const wifeIn = wId != null && ancestorIds.has(wId);
      const anyChildIn = childIds.some((c) => ancestorIds.has(c));
      if (husbIn || wifeIn || anyChildIn) includedFamilyIds.add(fam.id);
    }

    const peopleIds = new Set(ancestorIds);

    const distinctFamiliesByChild = new Map<string, Set<string>>();
    for (const r of parentChildRows) {
      if (!r.familyId) continue;
      if (!peopleIds.has(r.childId)) continue;
      const set = distinctFamiliesByChild.get(r.childId) ?? new Set<string>();
      set.add(r.familyId);
      distinctFamiliesByChild.set(r.childId, set);
    }
    const multiFamilyChildXrefs: string[] = [];
    for (const [childId, famSet] of distinctFamiliesByChild) {
      if (famSet.size > 1) {
        const x = idToXref.get(childId);
        if (x) multiFamilyChildXrefs.push(x);
      }
    }

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

    const viewer = await resolvePublicViewer();

    return NextResponse.json({
      rootId: root.xref,
      rootUuid: root.id,
      people: redactTreePeopleForViewer(people, viewer),
      unions,
      multiFamilyChildXrefs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
