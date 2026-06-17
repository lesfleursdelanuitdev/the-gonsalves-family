import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import {
  getPersonDetailContext,
  isLivingFromPersonRow,
  nlIndividualAddonFromSqlPerson,
  requireFullPersonDetailAccess,
  stripSlashesFromName,
  type Row,
} from "../lib";
import { formatGender } from "@/lib/individual-mapper";
import {
  dateDisplayFromJoinedEventRow,
  placeDisplayFromJoinedEventRow,
} from "@/lib/individual-key-fact-display";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ xref: string }> }
) {
  try {
    const { xref } = await params;
    const ctx = await getPersonDetailContext(xref);
    if (!ctx) {
      const code = !process.env.DATABASE_URL ? 503 : 404;
      return NextResponse.json(
        { error: code === 503 ? "Database not configured" : "Person not found" },
        { status: code }
      );
    }

    const accessDenied = await requireFullPersonDetailAccess(ctx);
    if (accessDenied) return accessDenied;

    const { fileUuid, personId, person } = ctx;

    const [birtRows, deatRows] = await Promise.all([
      prisma.$queryRaw<Row[]>(
        Prisma.sql`
          SELECT e.id, e.event_type, e.custom_type, e.value, e.cause, e.sort_order,
                 e.event_label AS event_label,
                 d.original AS date_original, d.date_type AS date_type, d.year, d.month, d.day,
                 p.original AS place_original, p.name AS place_name
          FROM gedcom_individual_events_v2 ie
          JOIN gedcom_events_v2 e ON e.id = ie.event_id AND e.file_uuid = ie.file_uuid
          LEFT JOIN gedcom_dates_v2 d ON d.id = e.date_id
          LEFT JOIN gedcom_places_v2 p ON p.id = e.place_id
          WHERE ie.file_uuid = ${fileUuid}::uuid AND ie.individual_id = ${personId}::uuid
            AND e.event_type = 'BIRT'
          ORDER BY e.sort_order ASC, e.id ASC
          LIMIT 1
        `
      ),
      prisma.$queryRaw<Row[]>(
        Prisma.sql`
          SELECT e.id, e.event_type, e.custom_type, e.value, e.cause, e.sort_order,
                 e.event_label AS event_label,
                 d.original AS date_original, d.date_type AS date_type, d.year, d.month, d.day,
                 p.original AS place_original, p.name AS place_name
          FROM gedcom_individual_events_v2 ie
          JOIN gedcom_events_v2 e ON e.id = ie.event_id AND e.file_uuid = ie.file_uuid
          LEFT JOIN gedcom_dates_v2 d ON d.id = e.date_id
          LEFT JOIN gedcom_places_v2 p ON p.id = e.place_id
          WHERE ie.file_uuid = ${fileUuid}::uuid AND ie.individual_id = ${personId}::uuid
            AND e.event_type = 'DEAT'
          ORDER BY e.sort_order ASC, e.id ASC
          LIMIT 1
        `
      ),
    ]);

    const birthRow = birtRows[0];
    const deathRow = deatRows[0];
    const birth = {
      date:
        dateDisplayFromJoinedEventRow(birthRow) ??
        ((person.birth_date_display as string | null) ?? null),
      place:
        placeDisplayFromJoinedEventRow(birthRow) ??
        ((person.birth_place_display as string | null) ?? null),
      event: birthRow
        ? {
            eventType: birthRow.event_type,
            customType: birthRow.custom_type ?? null,
            eventLabel: (birthRow.event_label as string | null | undefined) ?? null,
            value: birthRow.value ?? null,
            cause: birthRow.cause ?? null,
            dateOriginal: birthRow.date_original ?? null,
            dateType: (birthRow.date_type as string | null | undefined) ?? null,
            year: birthRow.year ?? null,
            month: birthRow.month ?? null,
            day: birthRow.day ?? null,
            placeOriginal: birthRow.place_original ?? null,
            placeName: birthRow.place_name ?? null,
          }
        : null,
    };

    const death = {
      date:
        dateDisplayFromJoinedEventRow(deathRow) ??
        ((person.death_date_display as string | null) ?? null),
      place:
        placeDisplayFromJoinedEventRow(deathRow) ??
        ((person.death_place_display as string | null) ?? null),
      event: deathRow
        ? {
            eventType: deathRow.event_type,
            customType: deathRow.custom_type ?? null,
            eventLabel: (deathRow.event_label as string | null | undefined) ?? null,
            value: deathRow.value ?? null,
            cause: deathRow.cause ?? null,
            dateOriginal: deathRow.date_original ?? null,
            dateType: (deathRow.date_type as string | null | undefined) ?? null,
            year: deathRow.year ?? null,
            month: deathRow.month ?? null,
            day: deathRow.day ?? null,
            placeOriginal: deathRow.place_original ?? null,
            placeName: deathRow.place_name ?? null,
          }
        : null,
    };

    const isLiving = isLivingFromPersonRow(person);
    return NextResponse.json({
      name: stripSlashesFromName(person.full_name as string) ?? null,
      xref: ctx.normalizedXref,
      uuid: person.id,
      ...nlIndividualAddonFromSqlPerson(person),
      living: isLiving,
      isLiving,
      gender: formatGender((person.sex as string) ?? null, (person.gender as string) ?? null) ?? null,
      birth,
      death,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
