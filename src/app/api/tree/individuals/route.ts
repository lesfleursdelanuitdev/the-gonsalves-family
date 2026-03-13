import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { mapIndividualRow, type IndividualRowForMapping } from "@/lib/individual-mapper";

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
      givenNames: {
        include: { givenName: true },
        orderBy: { position: "asc" as const },
      },
      surnames: {
        include: { surname: true },
        orderBy: { position: "asc" as const },
      },
    },
  },
} as const;

/** Build response item: uuid, names (givenNames + lastName), xref */
function toSearchItem(row: IndividualRowForMapping & { id: string; xref: string }) {
  const mapped = mapIndividualRow(row);
  return {
    uuid: row.id,
    names: {
      givenNames: mapped.givenNames,
      lastName: mapped.lastName ?? null,
    },
    xref: row.xref,
  };
}

/**
 * GET /api/tree/individuals
 * Optional query params:
 *   q         - single query: filter by name (fullName) or xref (case-insensitive contains)
 *   givenName - filter by given name (fullName contains, case-insensitive)
 *   lastName  - filter by surname; we add "/" around it to match GEDCOM format (e.g. /Gonsalves/)
 *   limit     - when filtering, max results per page (default 10, max 100)
 *   offset    - when filtering, number of results to skip (default 0) for pagination
 * When limit is used, response includes hasMore and nextOffset for "load more".
 * Response: { individuals, hasMore?, nextOffset? } (hasMore/nextOffset only when limit is set)
 */
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() ?? null;
    const givenName = searchParams.get("givenName")?.trim() ?? null;
    const lastName = searchParams.get("lastName")?.trim() ?? null;
    const hasNameSearch = givenName || lastName;
    const limitParam = searchParams.get("limit");
    const limit = q || hasNameSearch
      ? Math.min(100, Math.max(1, parseInt(limitParam ?? "10", 10) || 10))
      : undefined;
    const offsetParam = searchParams.get("offset");
    const offset = limit != null ? Math.max(0, parseInt(offsetParam ?? "0", 10) || 0) : 0;

    const where: {
      fileUuid: string;
      AND?: Array<{ fullName: { contains: string; mode: "insensitive" } }>;
      OR?: Array<{ fullName?: { contains: string; mode: "insensitive" }; xref?: { contains: string; mode: "insensitive" } }>;
    } = { fileUuid };

    if (hasNameSearch) {
      const and: Array<{ fullName: { contains: string; mode: "insensitive" } }> = [];
      if (givenName) and.push({ fullName: { contains: givenName, mode: "insensitive" } });
      if (lastName) and.push({ fullName: { contains: `/${lastName}/`, mode: "insensitive" } });
      where.AND = and;
    } else if (q) {
      const firstToken = q.split(/\s+/).filter(Boolean)[0] ?? q;
      where.OR = [
        { fullName: { contains: firstToken, mode: "insensitive" } },
        { xref: { contains: q, mode: "insensitive" } },
      ];
    }

    const useInMemoryFilter = q && q.includes(" ") && !hasNameSearch;
    const takeLimit = limit != null
      ? (useInMemoryFilter ? offset + limit * 4 : limit)
      : undefined;
    const skipCount = limit != null && offset > 0 && !useInMemoryFilter ? offset : 0;
    let rows = await prisma.gedcomIndividual.findMany({
      where,
      select: INDIVIDUAL_SELECT,
      ...(takeLimit != null && { take: takeLimit }),
      ...(skipCount > 0 && { skip: skipCount }),
    });

    if (useInMemoryFilter) {
      const normalizedQuery = q!.replace(/\s*\/\s*|\s+/g, " ").trim().toLowerCase();
      rows = rows.filter((row) => {
        const fullName = row.fullName ?? "";
        const normalized = fullName.replace(/\s*\/\s*|\s+/g, " ").trim().toLowerCase();
        return normalized.includes(normalizedQuery);
      }).slice(offset, offset + (limit ?? rows.length));
    }

    const individuals = rows.map((row) => toSearchItem(row));
    const hasMore = limit != null && individuals.length === limit;
    const nextOffset = limit != null ? offset + individuals.length : undefined;

    if (limit != null) {
      return NextResponse.json({ individuals, hasMore, nextOffset });
    }
    return NextResponse.json({ individuals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
