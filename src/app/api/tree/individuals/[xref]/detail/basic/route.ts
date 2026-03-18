import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@ligneous/prisma";
import { prisma } from "@/lib/database/prisma";
import {
  getPersonDetailContext,
  stripSlashesFromName,
  type Row,
} from "../lib";
import { formatGender } from "@/lib/individual-mapper";

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

    const { fileUuid, personId, person } = ctx;

    const [birtRows, deatRows] = await Promise.all([
      prisma.$queryRaw<Row[]>(
        Prisma.sql`
          SELECT e.id, e.event_type, e.custom_type, e.value, e.cause, e.sort_order,
                 d.original AS date_original, d.year, d.month, d.day,
                 p.original AS place_original, p.name AS place_name
          FROM gedcom_individual_events_v2 ie
          JOIN gedcom_events_v2 e ON e.id = ie.event_id AND e.file_uuid = ie.file_uuid
          LEFT JOIN gedcom_dates_v2 d ON d.id = e.date_id
          LEFT JOIN gedcom_places_v2 p ON p.id = e.place_id
          WHERE ie.file_uuid = ${fileUuid}::uuid AND ie.individual_id = ${personId}::uuid
            AND e.event_type = 'BIRT'
          LIMIT 1
        `
      ),
      prisma.$queryRaw<Row[]>(
        Prisma.sql`
          SELECT e.id, e.event_type, e.custom_type, e.value, e.cause, e.sort_order,
                 d.original AS date_original, d.year, d.month, d.day,
                 p.original AS place_original, p.name AS place_name
          FROM gedcom_individual_events_v2 ie
          JOIN gedcom_events_v2 e ON e.id = ie.event_id AND e.file_uuid = ie.file_uuid
          LEFT JOIN gedcom_dates_v2 d ON d.id = e.date_id
          LEFT JOIN gedcom_places_v2 p ON p.id = e.place_id
          WHERE ie.file_uuid = ${fileUuid}::uuid AND ie.individual_id = ${personId}::uuid
            AND e.event_type = 'DEAT'
          LIMIT 1
        `
      ),
    ]);

    const birth = {
      date: person.birth_date_display ?? null,
      place: person.birth_place_display ?? null,
      event: birtRows[0]
        ? {
            eventType: birtRows[0].event_type,
            customType: birtRows[0].custom_type ?? null,
            value: birtRows[0].value ?? null,
            cause: birtRows[0].cause ?? null,
            dateOriginal: birtRows[0].date_original ?? null,
            year: birtRows[0].year ?? null,
            month: birtRows[0].month ?? null,
            day: birtRows[0].day ?? null,
            placeOriginal: birtRows[0].place_original ?? null,
            placeName: birtRows[0].place_name ?? null,
          }
        : null,
    };

    const death = {
      date: person.death_date_display ?? null,
      place: person.death_place_display ?? null,
      event: deatRows[0]
        ? {
            eventType: deatRows[0].event_type,
            customType: deatRows[0].custom_type ?? null,
            value: deatRows[0].value ?? null,
            cause: deatRows[0].cause ?? null,
            dateOriginal: deatRows[0].date_original ?? null,
            year: deatRows[0].year ?? null,
            month: deatRows[0].month ?? null,
            day: deatRows[0].day ?? null,
            placeOriginal: deatRows[0].place_original ?? null,
            placeName: deatRows[0].place_name ?? null,
          }
        : null,
    };

    const hasDeathEvent = deatRows.length > 0 && deatRows[0] != null;
    return NextResponse.json({
      name: stripSlashesFromName(person.full_name as string) ?? null,
      xref: ctx.normalizedXref,
      uuid: person.id,
      living: !hasDeathEvent,
      gender: formatGender((person.sex as string) ?? null, (person.gender as string) ?? null) ?? null,
      birth,
      death,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
