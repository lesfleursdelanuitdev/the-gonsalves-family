import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { mapIndividualRow } from "@/lib/individual-mapper";
import { redactMappedIndividualForViewer } from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { individualBirthDeathPlaceSelect } from "@/lib/gedcom-place-display";
import { gedcomIndividualNlDenormSelect } from "@/lib/gedcom-individual-nl-select";
import { loadParentChildMaps } from "@/lib/tree-ancestry";

function normalizeXref(xref: string): string {
  const s = xref.trim();
  return s.startsWith("@") ? s : `@${s}@`;
}

const INDIVIDUAL_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  ...individualBirthDeathPlaceSelect,
  ...gedcomIndividualNlDenormSelect,
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
  { params }: { params: Promise<{ xref: string }> },
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
    const maxDepth = depthParam ? Math.min(Math.max(1, parseInt(depthParam, 10) || 4), 20) : 4;

    const [root, { childToParents }] = await Promise.all([
      prisma.gedcomIndividual.findFirst({
        where: { fileUuid, xref: normalized },
        select: { id: true },
      }),
      loadParentChildMaps(fileUuid),
    ]);

    if (!root) {
      return NextResponse.json({ error: "Individual not found" }, { status: 404 });
    }

    // ── Collect candidate ancestor IDs for the sex lookup ────────────────────
    // Simple BFS to gather all IDs reachable within maxDepth, without numbering.
    const candidateIds = new Set<string>();
    let frontier = new Set<string>([root.id]);
    for (let d = 0; d < maxDepth; d++) {
      const next = new Set<string>();
      for (const id of frontier) {
        for (const pid of childToParents.get(id) ?? []) {
          if (!candidateIds.has(pid)) next.add(pid);
        }
      }
      for (const id of next) candidateIds.add(id);
      frontier = next;
      if (frontier.size === 0) break;
    }

    // ── Load sex for all candidates ───────────────────────────────────────────
    const sexRows =
      candidateIds.size > 0
        ? await prisma.gedcomIndividual.findMany({
            where: { id: { in: Array.from(candidateIds) } },
            select: { id: true, sex: true },
          })
        : [];
    const sexMap = new Map(sexRows.map((r) => [r.id, r.sex]));

    // ── Ahnentafel BFS ────────────────────────────────────────────────────────
    // Root = 1. For each person n, father = 2n, mother = 2n+1.
    // Sex field distinguishes father from mother; falls back to insertion order.
    type QueueEntry = { id: string; num: number; depth: number };
    const queue: QueueEntry[] = [{ id: root.id, num: 1, depth: 0 }];
    const numToId = new Map<number, string>([[1, root.id]]);

    let qi = 0;
    while (qi < queue.length) {
      const { id, num, depth } = queue[qi++];
      if (depth >= maxDepth) continue;

      const parents = childToParents.get(id) ?? [];
      if (parents.length === 0) continue;

      let father: string | undefined;
      let mother: string | undefined;

      for (const pid of parents) {
        const sex = sexMap.get(pid);
        if (sex === "M" && !father) father = pid;
        else if (sex === "F" && !mother) mother = pid;
      }

      // Fallback when sex is unrecorded on either or both parents
      if (!father && !mother) {
        [father, mother] = parents;
      } else if (father && !mother) {
        mother = parents.find((p) => p !== father);
      } else if (!father && mother) {
        father = parents.find((p) => p !== mother);
      }

      const nextDepth = depth + 1;
      if (father && !numToId.has(2 * num)) {
        numToId.set(2 * num, father);
        queue.push({ id: father, num: 2 * num, depth: nextDepth });
      }
      if (mother && !numToId.has(2 * num + 1)) {
        numToId.set(2 * num + 1, mother);
        queue.push({ id: mother, num: 2 * num + 1, depth: nextDepth });
      }
    }

    // ── hasMore: any deepest-generation person has recorded parents ───────────
    const hasMore = queue
      .filter((e) => e.depth === maxDepth)
      .some((e) => (childToParents.get(e.id) ?? []).length > 0);

    // ── Load full individual details ──────────────────────────────────────────
    const allIds = Array.from(numToId.values());
    const rows = await prisma.gedcomIndividual.findMany({
      where: { id: { in: allIds } },
      select: INDIVIDUAL_SELECT,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));

    // ── Build sorted entry list ───────────────────────────────────────────────
    const entries: Array<ReturnType<typeof mapIndividualRow> & { num: number; generation: number }> = [];
    for (const [num, id] of numToId.entries()) {
      const row = byId.get(id);
      if (!row) continue;
      const generation = Math.floor(Math.log2(num)) + 1;
      entries.push({ ...mapIndividualRow(row), num, generation });
    }
    entries.sort((a, b) => a.num - b.num);

    const viewer = await resolvePublicViewer();

    return NextResponse.json({
      entries: entries.map((entry) => redactMappedIndividualForViewer(entry, viewer)),
      loadedDepth: maxDepth,
      hasMore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
