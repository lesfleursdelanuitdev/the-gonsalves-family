import { Prisma } from "@ligneous/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";

export function normalizeXref(xref: string): string {
  const s = xref.trim();
  return s.startsWith("@") ? s : `@${s}@`;
}

/** Strip GEDCOM slashes from last names for display (e.g. "John /Reyes/" → "John Reyes"). */
export function stripSlashesFromName(s: string | null | undefined): string | null {
  if (s == null || s === "") return null;
  const t = s.replace(/\//g, "").trim();
  return t === "" ? null : t;
}

export type Row = Record<string, unknown>;

export interface PersonDetailContext {
  fileUuid: string;
  personId: string;
  person: Row;
  normalizedXref: string;
}

export async function getPersonDetailContext(
  xref: string
): Promise<PersonDetailContext | null> {
  if (!process.env.DATABASE_URL) return null;
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const normalizedXref = normalizeXref(xref);
  const personRows = await prisma.$queryRaw<Row[]>(
    Prisma.sql`
      SELECT id, full_name, birth_date_display, birth_place_display,
             death_date_display, death_place_display, sex, gender
      FROM gedcom_individuals_v2
      WHERE file_uuid = ${fileUuid}::uuid AND xref = ${normalizedXref}
      LIMIT 1
    `
  );
  const person = personRows[0];
  if (!person) return null;

  return {
    fileUuid,
    personId: person.id as string,
    person,
    normalizedXref,
  };
}
