import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@ligneous/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import {
  dateDisplayFromJoinedEventRow,
  placeDisplayFromJoinedEventRow,
} from "@/lib/individual-key-fact-display";
import { parentsHeaderLabelFromPedigreeRows } from "@/lib/tree/parents-label-for-family";
import { nlIndividualAddonFromSqlPerson, stripSlashesFromName } from "./lib";

function normalizeXref(xref: string): string {
  const s = xref.trim();
  return s.startsWith("@") ? s : `@${s}@`;
}

type Row = Record<string, unknown>;

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
    const normalizedXref = normalizeXref(xref);

    const personRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT id, full_name, birth_date_display, birth_place_display,
               death_date_display, death_place_display,
               primary_surname_lower, birth_country, birth_country_lower,
               death_country, death_country_lower, age_at_death, generation_depth
        FROM gedcom_individuals_v2
        WHERE file_uuid = ${fileUuid}::uuid AND xref = ${normalizedXref}
        LIMIT 1
      `
    );
    const person = personRows[0];
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }
    const personId = person.id as string;

    const [birtRows, deatRows, famOriginRows, famSpouseRows, notesRows, sourcesRows, indEventRows] =
      await Promise.all([
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
        prisma.$queryRaw<Row[]>(
          Prisma.sql`
            SELECT fc.family_id, f.xref AS family_xref,
                   husb.id AS husband_id, husb.xref AS husband_xref, husb.full_name AS husband_name,
                   wife.id AS wife_id, wife.xref AS wife_xref, wife.full_name AS wife_name,
                   ch.id AS child_id, ch.xref AS child_xref, ch.full_name AS child_name,
                   ch_birth_d.year AS child_birth_year, ch_birth_d.month AS child_birth_month, ch_birth_d.day AS child_birth_day
            FROM gedcom_family_children_v2 fc
            JOIN gedcom_families_v2 f ON f.id = fc.family_id AND f.file_uuid = fc.file_uuid
            LEFT JOIN gedcom_individuals_v2 husb ON husb.id = f.husband_id
            LEFT JOIN gedcom_individuals_v2 wife ON wife.id = f.wife_id
            LEFT JOIN gedcom_family_children_v2 fc2 ON fc2.family_id = fc.family_id AND fc2.file_uuid = fc.file_uuid
            LEFT JOIN gedcom_individuals_v2 ch ON ch.id = fc2.child_id
            LEFT JOIN gedcom_dates_v2 ch_birth_d ON ch_birth_d.id = ch.birth_date_id
            WHERE fc.file_uuid = ${fileUuid}::uuid AND fc.child_id = ${personId}::uuid
          `
        ),
        prisma.$queryRaw<Row[]>(
          Prisma.sql`
            SELECT f.id AS family_id, f.xref AS family_xref,
                   spouse.id AS spouse_id, spouse.xref AS spouse_xref, spouse.full_name AS spouse_name,
                   ch.id AS child_id, ch.xref AS child_xref, ch.full_name AS child_name,
                   ch.birth_date_display AS child_birth_date, ch.birth_place_display AS child_birth_place,
                   ch_birth_d.year AS child_birth_year, ch_birth_d.month AS child_birth_month, ch_birth_d.day AS child_birth_day,
                   ch_birth_d.date_type AS child_birth_date_type
            FROM gedcom_families_v2 f
            LEFT JOIN gedcom_individuals_v2 spouse ON (spouse.id = f.wife_id AND f.husband_id = ${personId}::uuid)
              OR (spouse.id = f.husband_id AND f.wife_id = ${personId}::uuid)
            LEFT JOIN gedcom_family_children_v2 fch ON fch.family_id = f.id AND fch.file_uuid = f.file_uuid
            LEFT JOIN gedcom_individuals_v2 ch ON ch.id = fch.child_id
            LEFT JOIN gedcom_dates_v2 ch_birth_d ON ch_birth_d.id = ch.birth_date_id
            WHERE f.file_uuid = ${fileUuid}::uuid
              AND (f.husband_id = ${personId}::uuid OR f.wife_id = ${personId}::uuid)
          `
        ),
        prisma.$queryRaw<Row[]>(
          Prisma.sql`
            SELECT n.id, n.xref, n.content
            FROM gedcom_individual_notes_v2 in_
            JOIN gedcom_notes_v2 n ON n.id = in_.note_id AND n.file_uuid = in_.file_uuid
            WHERE in_.file_uuid = ${fileUuid}::uuid AND in_.individual_id = ${personId}::uuid
          `
        ),
        prisma.$queryRaw<Row[]>(
          Prisma.sql`
            SELECT s.id, s.xref, s.title, s.author, s.publication, s.text,
                   ins.page, ins.quality, ins.citation_text
            FROM gedcom_individual_sources_v2 ins
            JOIN gedcom_sources_v2 s ON s.id = ins.source_id AND s.file_uuid = ins.file_uuid
            WHERE ins.file_uuid = ${fileUuid}::uuid AND ins.individual_id = ${personId}::uuid
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
            ORDER BY e.sort_order ASC, e.event_type
          `
        ),
      ]);

    const spouseFamilyIds = [...new Set((famSpouseRows.map((r: Row) => r.family_id).filter(Boolean) as string[]))];
    const familyEventRows: Row[] =
      spouseFamilyIds.length > 0
        ? await prisma.$queryRaw<Row[]>(
            Prisma.sql`
              SELECT fe.family_id, e.id AS event_id, e.event_type, e.custom_type, e.value, e.cause, e.sort_order,
                     e.event_label AS event_label,
                     d.original AS date_original, d.date_type AS date_type, d.year, d.month, d.day,
                     p.original AS place_original, p.name AS place_name
              FROM gedcom_family_events_v2 fe
              JOIN gedcom_events_v2 e ON e.id = fe.event_id AND e.file_uuid = fe.file_uuid
              LEFT JOIN gedcom_dates_v2 d ON d.id = e.date_id
              LEFT JOIN gedcom_places_v2 p ON p.id = e.place_id
              WHERE fe.file_uuid = ${fileUuid}::uuid
                AND fe.family_id IN (${Prisma.join(spouseFamilyIds.map((id) => Prisma.sql`${id}::uuid`), ", ")})
              ORDER BY fe.family_id, e.sort_order
            `
          )
        : [];

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

    type OriginChild = { name: string | null; xref: string; birthYear?: number | null; birthMonth?: number | null; birthDay?: number | null };
    const familyOriginByKey = new Map<
      string,
      { family: { id: string; xref: string }; parents: { role: string; name: string | null; xref: string }[]; children: OriginChild[] }
    >();
    for (const r of famOriginRows) {
      const fid = r.family_id as string;
      if (!familyOriginByKey.has(fid)) {
        const parents: { role: string; name: string | null; xref: string }[] = [];
        if (r.husband_id) parents.push({ role: "husband", name: stripSlashesFromName(r.husband_name as string) ?? null, xref: (r.husband_xref as string) ?? "" });
        if (r.wife_id) parents.push({ role: "wife", name: stripSlashesFromName(r.wife_name as string) ?? null, xref: (r.wife_xref as string) ?? "" });
        familyOriginByKey.set(fid, {
          family: { id: fid, xref: (r.family_xref as string) ?? "" },
          parents,
          children: [],
        });
      }
      const entry = familyOriginByKey.get(fid)!;
      const childXref = (r.child_xref as string) ?? "";
      if (r.child_id && childXref !== normalizedXref && !entry.children.some((c) => c.xref === childXref)) {
        entry.children.push({
          name: stripSlashesFromName(r.child_name as string) ?? null,
          xref: childXref,
          birthYear: r.child_birth_year != null ? Number(r.child_birth_year) : null,
          birthMonth: r.child_birth_month != null ? Number(r.child_birth_month) : null,
          birthDay: r.child_birth_day != null ? Number(r.child_birth_day) : null,
        });
      }
    }
    const sortChildrenByBirth = (a: { birthYear?: number | null; birthMonth?: number | null; birthDay?: number | null }, b: typeof a) => {
      const yA = Number(a.birthYear ?? Infinity);
      const yB = Number(b.birthYear ?? Infinity);
      if (yA !== yB) return yA - yB;
      const mA = Number(a.birthMonth ?? 13);
      const mB = Number(b.birthMonth ?? 13);
      if (mA !== mB) return mA - mB;
      const dA = Number(a.birthDay ?? 32);
      const dB = Number(b.birthDay ?? 32);
      return dA - dB;
    };

    const pcPedigreeRows = await prisma.$queryRaw<Row[]>(
      Prisma.sql`
        SELECT family_id, relationship_type, pedigree
        FROM gedcom_parent_child_v2
        WHERE file_uuid = ${fileUuid}::uuid
          AND child_id = ${personId}::uuid
          AND family_id IS NOT NULL
      `
    );
    const pedigreeByFamilyId = new Map<string, { relationshipType: string | null; pedigree: string | null }[]>();
    for (const r of pcPedigreeRows) {
      const fid = r.family_id as string | undefined;
      if (!fid) continue;
      const list = pedigreeByFamilyId.get(fid) ?? [];
      list.push({
        relationshipType: (r.relationship_type as string | null | undefined) ?? null,
        pedigree: (r.pedigree as string | null | undefined) ?? null,
      });
      pedigreeByFamilyId.set(fid, list);
    }

    const familiesOfOrigin = Array.from(familyOriginByKey.values()).map((fam) => ({
      family: fam.family,
      parents: fam.parents,
      parentsLabel: parentsHeaderLabelFromPedigreeRows(pedigreeByFamilyId.get(fam.family.id) ?? []),
      children: fam.children.slice().sort(sortChildrenByBirth).map((c) => ({ name: c.name, xref: c.xref })),
    }));

    const spouseFamilyByKey = new Map<
      string,
      {
        family: { id: string; xref: string };
        spouse: { name: string | null; xref: string };
        children: {
          name: string | null;
          xref: string;
          birth?: {
            date: string | null;
            place: string | null;
            dateType?: string | null;
            year?: number | null;
            month?: number | null;
            day?: number | null;
          };
        }[];
      }
    >();
    for (const r of famSpouseRows) {
      const fid = r.family_id as string;
      if (!spouseFamilyByKey.has(fid)) {
        spouseFamilyByKey.set(fid, {
          family: { id: fid, xref: (r.family_xref as string) ?? "" },
          spouse: { name: stripSlashesFromName(r.spouse_name as string) ?? null, xref: (r.spouse_xref as string) ?? "" },
          children: [],
        });
      }
      const entry = spouseFamilyByKey.get(fid)!;
      if (r.child_id && !entry.children.some((c) => c.xref === (r.child_xref as string))) {
        const hasBirth = r.child_birth_date != null || r.child_birth_place != null ||
          r.child_birth_year != null || r.child_birth_month != null || r.child_birth_day != null;
        entry.children.push({
          name: stripSlashesFromName(r.child_name as string) ?? null,
          xref: (r.child_xref as string) ?? "",
          birth: hasBirth
            ? {
                date: (r.child_birth_date as string) ?? null,
                place: (r.child_birth_place as string) ?? null,
                dateType: (r.child_birth_date_type as string) ?? null,
                year: r.child_birth_year != null ? Number(r.child_birth_year) : null,
                month: r.child_birth_month != null ? Number(r.child_birth_month) : null,
                day: r.child_birth_day != null ? Number(r.child_birth_day) : null,
              }
            : undefined,
        });
      }
    }
    const sortSpouseChildrenByBirth = (
      a: { birth?: { year?: number | null; month?: number | null; day?: number | null } },
      b: typeof a
    ) => {
      const yA = Number(a.birth?.year ?? Infinity);
      const yB = Number(b.birth?.year ?? Infinity);
      if (yA !== yB) return yA - yB;
      const mA = Number(a.birth?.month ?? 13);
      const mB = Number(b.birth?.month ?? 13);
      if (mA !== mB) return mA - mB;
      const dA = Number(a.birth?.day ?? 32);
      const dB = Number(b.birth?.day ?? 32);
      return dA - dB;
    };
    const familiesAsSpouse = Array.from(spouseFamilyByKey.values()).map((fam) => ({
      ...fam,
      children: fam.children.slice().sort(sortSpouseChildrenByBirth),
    }));

    const notes = notesRows.map((r: Row) => ({
      id: r.id,
      xref: r.xref ?? null,
      content: r.content,
    }));

    const sources = sourcesRows.map((r: Row) => ({
      source: {
        id: r.id,
        xref: r.xref,
        title: r.title ?? null,
        author: r.author ?? null,
        publication: r.publication ?? null,
        text: r.text ?? null,
      },
      page: r.page ?? null,
      quality: r.quality ?? null,
      citationText: r.citation_text ?? null,
    }));

    const spouseByFamilyId = new Map(familiesAsSpouse.map((f) => [f.family.id, f.spouse]));

    const eventItem = (
      r: Row,
      source: string,
      opts?: { familyId?: string; childXref?: string; childName?: string | null; spouseName?: string | null; spouseXref?: string }
    ) => ({
      eventType: r.event_type,
      customType: r.custom_type ?? null,
      eventLabel: (r.event_label as string | null | undefined) ?? null,
      value: r.value ?? null,
      cause: r.cause ?? null,
      dateOriginal: r.date_original ?? null,
      dateType: (r.date_type as string | null | undefined) ?? null,
      year: r.year ?? null,
      month: r.month ?? null,
      day: r.day ?? null,
      placeOriginal: r.place_original ?? null,
      placeName: r.place_name ?? null,
      sortOrder: r.sort_order ?? 0,
      source,
      familyId: opts?.familyId ?? null,
      childXref: opts?.childXref ?? null,
      childName: opts?.childName ?? null,
      spouseName: opts?.spouseName ?? null,
      spouseXref: opts?.spouseXref ?? null,
    });

    const events: ReturnType<typeof eventItem>[] = [];
    for (const r of indEventRows) {
      events.push(eventItem(r, "individual"));
    }
    for (const r of familyEventRows) {
      const familyId = r.family_id as string;
      const spouse = spouseByFamilyId.get(familyId);
      events.push(
        eventItem(r, "family", {
          familyId,
          spouseName: spouse?.name ?? null,
          spouseXref: spouse?.xref ?? "",
        })
      );
    }
    for (const fam of familiesAsSpouse) {
      for (const ch of fam.children) {
        if (ch.birth?.date || ch.birth?.place || ch.birth?.year != null || ch.birth?.month != null || ch.birth?.day != null) {
          events.push(
            eventItem(
              {
                event_type: "BIRT",
                date_original: ch.birth.date,
                date_type: ch.birth.dateType ?? null,
                place_original: ch.birth.place,
                place_name: ch.birth.place,
                year: ch.birth.year ?? undefined,
                month: ch.birth.month ?? undefined,
                day: ch.birth.day ?? undefined,
                sort_order: 0,
              } as Row,
              "childBirth",
              { familyId: fam.family.id, childXref: ch.xref, childName: ch.name ?? null }
            )
          );
        }
      }
    }
    events.sort((a, b) => {
      const yA = Number(a.year ?? Infinity);
      const yB = Number(b.year ?? Infinity);
      if (yA !== yB) return yA - yB;
      const mA = Number(a.month ?? 13);
      const mB = Number(b.month ?? 13);
      if (mA !== mB) return mA - mB;
      const dA = Number(a.day ?? 32);
      const dB = Number(b.day ?? 32);
      if (dA !== dB) return dA - dB;
      return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0);
    });

    return NextResponse.json({
      name: stripSlashesFromName(person.full_name as string) ?? null,
      xref: normalizedXref,
      uuid: person.id,
      ...nlIndividualAddonFromSqlPerson(person),
      birth,
      death,
      familiesOfOrigin,
      familiesAsSpouse,
      notes,
      sources,
      events,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
