import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@ligneous/prisma";
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

/** Escape regex special chars so the string is treated as literal in PostgreSQL regex. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build PostgreSQL regex pattern for "GEDCOM surname (token between slashes) starts with input".
 * full_name is like "John /Reyes/"; we match "/" + prefix so "R" matches Reyes, Rodrigues.
 */
function surnamePrefixRegexPattern(lastNameInput: string): string {
  const prefix = escapeRegex(lastNameInput.trim().toLowerCase());
  return "\\/" + prefix; // match literal / then prefix (case-insensitive via ~*)
}

/** Escape % and _ for safe use inside a LIKE pattern (user input is the literal part). */
function escapeLike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

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
 * Step 0: Resolve tree file UUID (resolveTreeFileUuid); 404 if not found.
 * Optional query params:
 *   givenName - given name similar to or contains (via GedcomGivenName)
 *   lastName  - surname prefix match (GEDCOM slash-aware; e.g. "R" → Reyes, Rodrigues)
 *   q         - when no givenName/lastName: filter by fullName contains or xref contains
 *   limit     - optional; when set, max results (max 100). Omit to return all.
 *   offset    - when limit is set, number to skip (default 0)
 * Response: { individuals, hasMore?, nextOffset? }
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
    const givenName = searchParams.get("givenName")?.trim() ?? null;
    const lastName = searchParams.get("lastName")?.trim() ?? null;
    const q = searchParams.get("q")?.trim() ?? null;
    const hasNameSearch = !!givenName || !!lastName;

    const limitParam = searchParams.get("limit");
    const limit =
      limitParam != null && limitParam !== ""
        ? Math.min(100, Math.max(1, parseInt(limitParam, 10) || 10))
        : undefined;
    const offsetParam = searchParams.get("offset");
    const offset = limit != null ? Math.max(0, parseInt(offsetParam ?? "0", 10) || 0) : 0;

    let rows: Array<IndividualRowForMapping & { id: string; xref: string }>;

    if (hasNameSearch) {
      const givenLower = givenName ? givenName.toLowerCase() : "";
      const lastNamePattern = lastName ? surnamePrefixRegexPattern(lastName) : null;

      if (givenName && !lastName) {
        // Given name only: Prisma filter on GedcomGivenName (contains)
        const where = {
          fileUuid,
          individualNameForms: {
            some: {
              givenNames: {
                some: {
                  givenName: {
                    givenNameLower: { contains: givenLower },
                  },
                },
              },
            },
          },
        };
        rows = await prisma.gedcomIndividual.findMany({
          where,
          select: INDIVIDUAL_SELECT,
          ...(limit != null && { take: limit, skip: offset }),
        }) as Array<IndividualRowForMapping & { id: string; xref: string }>;
      } else if (lastName && !givenName) {
        // Last name only: raw Postgres regex (surname token prefix, slash-aware)
        const pattern = lastNamePattern!;
        const idRows = await prisma.$queryRaw<[{ id: string }]>(
          Prisma.sql`
            SELECT i.id FROM gedcom_individuals_v2 i
            WHERE i.file_uuid = ${fileUuid}::uuid
              AND i.full_name_lower ~* ${pattern}
            ORDER BY i.full_name_lower
            LIMIT ${limit ?? 10000} OFFSET ${offset}
          `
        );
        const ids = idRows.map((r) => r.id);
        if (ids.length === 0) {
          rows = [];
        } else {
          const byId = await prisma.gedcomIndividual.findMany({
            where: { id: { in: ids } },
            select: INDIVIDUAL_SELECT,
          }) as Array<IndividualRowForMapping & { id: string; xref: string }>;
          const order = new Map(ids.map((id, i) => [id, i]));
          rows = byId.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        }
      } else {
        // Both: one raw query on individuals only – full_name_lower given prefix + surname regex (same as last-only)
        // Avoids depending on name-form tables which may be empty; fullName is "Given /Surname/"
        const givenPrefix = escapeLike(givenLower) + "%";
        const surnamePattern = surnamePrefixRegexPattern(lastName!);
        const idRows = await prisma.$queryRaw<[{ id: string }]>(
          Prisma.sql`
            SELECT i.id
            FROM gedcom_individuals_v2 i
            WHERE i.file_uuid = ${fileUuid}::uuid
              AND i.full_name_lower LIKE ${givenPrefix}
              AND i.full_name_lower ~* ${surnamePattern}
            ORDER BY i.full_name_lower
            LIMIT ${limit ?? 10000} OFFSET ${offset}
          `
        );
        const ids = idRows.map((r) => r.id);
        if (ids.length === 0) {
          rows = [];
        } else {
          const byId = await prisma.gedcomIndividual.findMany({
            where: { id: { in: ids } },
            select: INDIVIDUAL_SELECT,
          }) as Array<IndividualRowForMapping & { id: string; xref: string }>;
          const order = new Map(ids.map((id, i) => [id, i]));
          rows = byId.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        }
      }
    } else if (q) {
      // Legacy: single q param – fullName contains or xref contains
      const firstToken = q.split(/\s+/).filter(Boolean)[0] ?? q;
      const useInMemoryFilter = q.includes(" ");
      const takeLimit =
        limit != null ? (useInMemoryFilter ? offset + limit * 4 : limit) : undefined;
      const skipCount = limit != null && offset > 0 && !useInMemoryFilter ? offset : 0;
      let rawRows = await prisma.gedcomIndividual.findMany({
        where: {
          fileUuid,
          OR: [
            { fullName: { contains: firstToken, mode: "insensitive" } },
            { xref: { contains: q, mode: "insensitive" } },
          ],
        },
        select: INDIVIDUAL_SELECT,
        ...(takeLimit != null && { take: takeLimit }),
        ...(skipCount > 0 && { skip: skipCount }),
      }) as Array<IndividualRowForMapping & { id: string; xref: string }>;
      if (useInMemoryFilter) {
        const normalizedQuery = q.replace(/\s*\/\s*|\s+/g, " ").trim().toLowerCase();
        rawRows = rawRows
          .filter((row) => {
            const fullName = row.fullName ?? "";
            const normalized = fullName.replace(/\s*\/\s*|\s+/g, " ").trim().toLowerCase();
            return normalized.includes(normalizedQuery);
          })
          .slice(offset, offset + (limit ?? rawRows.length));
      }
      rows = rawRows;
    } else {
      rows = await prisma.gedcomIndividual.findMany({
        where: { fileUuid },
        select: INDIVIDUAL_SELECT,
        ...(limit != null && { take: limit, skip: offset }),
      }) as Array<IndividualRowForMapping & { id: string; xref: string }>;
    }

    const individuals = rows.map((row) => toSearchItem(row));
    const hasMore = limit != null && rows.length === limit;
    const nextOffset = limit != null ? offset + rows.length : undefined;

    if (limit != null) {
      return NextResponse.json({ individuals, hasMore, nextOffset });
    }
    return NextResponse.json({ individuals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
