import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { fullPlaceLabelFromGedcomPlace, GEDCOM_PLACE_DISPLAY_SELECT } from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";

const LIMIT = 5;

function esc(s: string) { return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_"); }
function pct(s: string) { return `%${esc(s)}%`; }
type P = unknown[];
function qp(p: P, v: unknown): string { p.push(v); return `$${p.length}`; }

/** Build a match condition for a column given the match type. Appends the needed param(s) to `p`. */
function mc(p: P, col: string, q: string, mt: string): string {
  if (mt === "exact")   return `LOWER(${col}) = ${qp(p, q.toLowerCase())}`;
  if (mt === "soundex") return `left(soundex(${col}), 3) = left(soundex(${qp(p, q)}), 3)`;
  return `${col} ILIKE ${qp(p, pct(q.toLowerCase()))}`;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Born", DEAT: "Died", BURI: "Buried", CHR: "Christened",
  BAPM: "Baptised", CONF: "Confirmed", OCCU: "Occupation", RESI: "Residence",
  EMIG: "Emigrated", IMMI: "Immigrated", NATU: "Naturalized", CENS: "Census",
  GRAD: "Graduated", RETI: "Retired", WILL: "Will", PROB: "Probate",
  ORDN: "Ordained", ADOP: "Adopted", MARR: "Married", DIV: "Divorced",
  MARL: "Marriage licence", ENGA: "Engaged", EVEN: "Event",
};

function normalizeMediaType(source: string, form: string | null): string {
  if (source === "story") return "story";
  const f = (form ?? "").toLowerCase();
  if (["jpeg","jpg","png","gif","tiff","tif","bmp","webp"].includes(f) || f === "image" || f.startsWith("image/")) return "image";
  if (["mp3","wav","ogg","aac","flac","m4a"].includes(f) || f === "audio" || f.startsWith("audio/")) return "audio";
  if (["mp4","avi","mov","wmv","mkv","webm","mpg","mpeg"].includes(f) || f === "video" || f.startsWith("video/")) return "video";
  if (["pdf","doc","docx","txt","text","rtf","html"].includes(f) || f === "document" || f.startsWith("text/") || f.startsWith("application/")) return "document";
  return "other";
}

const EMPTY = {
  people:     { items: [], total: 0 },
  families:   { items: [], total: 0 },
  events:     { items: [], total: 0 },
  media:      { items: [], total: 0 },
  surnames:   { items: [], total: 0 },
  givenNames: { items: [], total: 0 },
};

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() || null;
    if (!q) return NextResponse.json(EMPTY);

    const matchType = sp.get("matchType") ?? "contains"; // "contains" | "exact" | "soundex"

    const [fileUuid, treeId] = await Promise.all([resolveTreeFileUuid(), resolveTreeId()]);
    if (!fileUuid || !treeId) return NextResponse.json({ error: "Tree not found" }, { status: 404 });

    // ---------------------------------------------------------------------------
    // Build all query param arrays independently so each query is self-contained
    // ---------------------------------------------------------------------------

    // PEOPLE
    const pPpl: P = [fileUuid];
    const pplNameCond = mc(pPpl, "full_name_lower", q, matchType);

    // FAMILIES
    const pFam: P = [fileUuid];
    const famHCond = mc(pFam, "hi.full_name_lower", q, matchType);
    const famWCond = mc(pFam, "wi.full_name_lower", q, matchType);

    // EVENTS
    const pEv: P = [fileUuid];
    const evValCond   = mc(pEv, "ev.value",           q, matchType);
    const evLabCond   = mc(pEv, "ev.event_label",     q, matchType);
    const evPlNmCond  = mc(pEv, "pl.name",            q, matchType);
    const evPlOrCond  = mc(pEv, "pl.original",        q, matchType);
    const evIndCond   = mc(pEv, "ind.full_name_lower", q, matchType);

    // SURNAMES
    const pSur: P = [fileUuid];
    const surCond = mc(pSur, "s.surname_lower", q, matchType);

    // GIVEN NAMES
    const pGiv: P = [fileUuid];
    const givCond = mc(pGiv, "gn.given_name_lower", q, matchType);

    // MEDIA — tag expansion: search tag names with same match type, then pull in tagged media
    // The tag match condition is embedded as a subquery within each UNION fragment so everything
    // runs in a single query without a separate tag-lookup round-trip.
    const pMed: P = [fileUuid, treeId];
    const gedTitleCond = mc(pMed, "gm.title",  q, matchType);
    const gedTagCond   = mc(pMed, "t.name",    q, matchType);
    const strTitleCond = mc(pMed, "s.title",   q, matchType);
    const strTagCond   = mc(pMed, "t2.name",   q, matchType);

    const mediaSql = `
      WITH res AS (
        SELECT gm.id::text, 'gedcom'::text AS source, gm.title, gm.form,
          NULL::text AS slug, NULL::text AS kind
        FROM gedcom_media_v2 gm
        WHERE gm.file_uuid = $1::uuid
          AND (
            ${gedTitleCond}
            OR EXISTS (
              SELECT 1 FROM gedcom_media_app_tags x
              JOIN tags t ON t.id = x.tag_id
              WHERE x.gedcom_media_id = gm.id AND ${gedTagCond}
            )
          )
        UNION ALL
        SELECT s.id::text, 'story'::text AS source, s.title, 'story'::text AS form,
          s.slug::text AS slug, s.kind::text AS kind
        FROM stories s
        WHERE s.tree_id = $2::uuid AND s.deleted_at IS NULL AND s.is_published = true
          AND (
            ${strTitleCond}
            OR EXISTS (
              SELECT 1 FROM story_tags x
              JOIN tags t2 ON t2.id = x.tag_id
              WHERE x.story_id = s.id AND ${strTagCond}
            )
          )
      )
      SELECT *, COUNT(*) OVER() AS total FROM res ORDER BY LOWER(title) NULLS LAST LIMIT ${LIMIT}
    `;

    // All ID/count queries run in parallel
    const [
      [personCountRows, personIdRows],
      [familyCountRows, familyIdRows],
      [eventCountRows, eventIdRows],
      mediaRows,
      [surnameCountRows, surnameDataRows],
      [givenNameCountRows, givenNameDataRows],
    ] = await Promise.all([
      // PEOPLE ----------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(*) AS n FROM gedcom_individuals_v2 WHERE file_uuid = $1::uuid AND ${pplNameCond}`,
          ...pPpl,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM gedcom_individuals_v2 WHERE file_uuid = $1::uuid AND ${pplNameCond} ORDER BY full_name_lower NULLS LAST LIMIT ${LIMIT}`,
          ...pPpl,
        ),
      ]),
      // FAMILIES --------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(*) AS n FROM gedcom_families_v2 f
           LEFT JOIN gedcom_individuals_v2 hi ON hi.id = f.husband_id
           LEFT JOIN gedcom_individuals_v2 wi ON wi.id = f.wife_id
           WHERE f.file_uuid = $1::uuid AND (${famHCond} OR ${famWCond})`,
          ...pFam,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT f.id FROM gedcom_families_v2 f
           LEFT JOIN gedcom_individuals_v2 hi ON hi.id = f.husband_id
           LEFT JOIN gedcom_individuals_v2 wi ON wi.id = f.wife_id
           WHERE f.file_uuid = $1::uuid AND (${famHCond} OR ${famWCond})
           ORDER BY COALESCE(hi.full_name_lower, wi.full_name_lower) NULLS LAST LIMIT ${LIMIT}`,
          ...pFam,
        ),
      ]),
      // EVENTS ----------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(DISTINCT ev.id) AS n FROM gedcom_events_v2 ev
           LEFT JOIN gedcom_places_v2 pl ON pl.id = ev.place_id
           WHERE ev.file_uuid = $1::uuid
             AND (
               ${evValCond} OR ${evLabCond}
               OR ${evPlNmCond} OR ${evPlOrCond}
               OR EXISTS (
                 SELECT 1 FROM gedcom_individual_events_v2 ie
                 JOIN gedcom_individuals_v2 ind ON ind.id = ie.individual_id
                 WHERE ie.event_id = ev.id AND ${evIndCond}
               )
             )`,
          ...pEv,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT DISTINCT ev.id FROM gedcom_events_v2 ev
           LEFT JOIN gedcom_places_v2 pl ON pl.id = ev.place_id
           WHERE ev.file_uuid = $1::uuid
             AND (
               ${evValCond} OR ${evLabCond}
               OR ${evPlNmCond} OR ${evPlOrCond}
               OR EXISTS (
                 SELECT 1 FROM gedcom_individual_events_v2 ie
                 JOIN gedcom_individuals_v2 ind ON ind.id = ie.individual_id
                 WHERE ie.event_id = ev.id AND ${evIndCond}
               )
             )
           LIMIT ${LIMIT}`,
          ...pEv,
        ),
      ]),
      // MEDIA + STORIES (with tag expansion) ----------------------------------
      prisma.$queryRawUnsafe<Array<{
        id: string; source: string; title: string | null;
        form: string | null; slug: string | null; kind: string | null; total: bigint;
      }>>(mediaSql, ...pMed),
      // SURNAMES --------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(*) AS n FROM gedcom_surnames_v2 s WHERE s.file_uuid = $1::uuid AND ${surCond}`,
          ...pSur,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string; surname: string; frequency: bigint }>>(
          `SELECT s.id, s.surname, s.frequency FROM gedcom_surnames_v2 s WHERE s.file_uuid = $1::uuid AND ${surCond} ORDER BY s.frequency DESC NULLS LAST LIMIT ${LIMIT}`,
          ...pSur,
        ),
      ]),
      // GIVEN NAMES -----------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(*) AS n FROM gedcom_given_names_v2 gn WHERE gn.file_uuid = $1::uuid AND ${givCond}`,
          ...pGiv,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string; given_name: string; frequency: bigint }>>(
          `SELECT gn.id, gn.given_name, gn.frequency FROM gedcom_given_names_v2 gn WHERE gn.file_uuid = $1::uuid AND ${givCond} ORDER BY gn.frequency DESC NULLS LAST LIMIT ${LIMIT}`,
          ...pGiv,
        ),
      ]),
    ]);

    const personIds = personIdRows.map((r) => r.id);
    const familyIds = familyIdRows.map((r) => r.id);
    const eventIds  = eventIdRows.map((r) => r.id);
    const mediaTotal = mediaRows.length > 0 ? Number(mediaRows[0]!.total) : 0;

    // Hydrate all entities in parallel
    const [personRows, familyRows, eventRows, linkedIndRows, photoMap] = await Promise.all([
      personIds.length > 0
        ? prisma.gedcomIndividual.findMany({
            where: { id: { in: personIds } },
            select: { id: true, xref: true, fullName: true, sex: true, gender: true, isLiving: true, birthYear: true, deathYear: true },
          })
        : Promise.resolve([]),
      familyIds.length > 0
        ? prisma.gedcomFamily.findMany({
            where: { id: { in: familyIds } },
            select: {
              id: true, xref: true, marriageYear: true,
              husband: { select: { id: true, fullName: true, birthYear: true, deathYear: true } },
              wife:    { select: { id: true, fullName: true, birthYear: true, deathYear: true } },
            },
          })
        : Promise.resolve([]),
      eventIds.length > 0
        ? prisma.gedcomEvent.findMany({
            where: { id: { in: eventIds } },
            select: {
              id: true, eventType: true, eventLabel: true, customType: true, value: true,
              date: { select: { original: true, year: true } },
              place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
            },
          })
        : Promise.resolve([]),
      eventIds.length > 0
        ? prisma.gedcomIndividualEvent.findMany({
            where: { eventId: { in: eventIds } },
            take: LIMIT * 3,
            select: {
              eventId: true,
              individual: { select: { id: true, fullName: true } },
            },
          })
        : Promise.resolve([]),
      personIds.length > 0
        ? batchIndividualDisplayPhotoMedia(prisma, fileUuid, personIds)
        : Promise.resolve(new Map<string, { id: string; title: string | null; fileRef: string; form: string | null }>()),
    ]);

    const sexMap: Record<string, string> = { M: "Male", F: "Female", U: "Unknown", X: "Other" };
    const indOrder = new Map(personIds.map((id, i) => [id, i]));
    const famOrder = new Map(familyIds.map((id, i) => [id, i]));
    const evOrder  = new Map(eventIds.map((id, i) => [id, i]));

    const linkedIndMap = new Map<string, Array<{ id: string; displayName: string; profileHref: string }>>();
    for (const row of linkedIndRows) {
      const arr = linkedIndMap.get(row.eventId) ?? [];
      arr.push({
        id: row.individual.id,
        displayName: formatGedcomFullNameForDisplay(row.individual.fullName),
        profileHref: `/individuals/${encodeURIComponent(row.individual.id)}`,
      });
      linkedIndMap.set(row.eventId, arr);
    }

    const people = [...personRows]
      .sort((a, b) => (indOrder.get(a.id) ?? 0) - (indOrder.get(b.id) ?? 0))
      .map((row) => ({
        id: row.id,
        displayName: formatGedcomFullNameForDisplay(row.fullName),
        birthYear: row.birthYear as number | null,
        deathYear: row.deathYear as number | null,
        isLiving: row.isLiving as boolean,
        gender: row.sex ? (sexMap[row.sex as string] ?? (row.sex as string)) : (row.gender as string | null),
        portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
        profileHref: `/individuals/${encodeURIComponent(row.id)}`,
      }));

    const families = [...familyRows]
      .sort((a, b) => (famOrder.get(a.id) ?? 0) - (famOrder.get(b.id) ?? 0))
      .map((row) => {
        const makePartner = (p: typeof row.husband) =>
          p ? {
            id: p.id,
            displayName: formatGedcomFullNameForDisplay(p.fullName),
            birthYear: p.birthYear as number | null,
            deathYear: p.deathYear as number | null,
            profileHref: `/individuals/${encodeURIComponent(p.id)}`,
          } : null;
        const h = makePartner(row.husband);
        const w = makePartner(row.wife);
        const names = [h?.displayName, w?.displayName].filter(Boolean);
        return {
          id: row.id,
          title: names.length > 0 ? names.join(" & ") : "Unknown Family",
          husband: h, wife: w,
          marriageYear: row.marriageYear as number | null,
          profileHref: `/families/${encodeURIComponent(row.id)}`,
        };
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = [...(eventRows as any[])]
      .sort((a, b) => (evOrder.get(a.id) ?? 0) - (evOrder.get(b.id) ?? 0))
      .map((row) => {
        const type = row.eventType as string;
        const custom = (row.customType as string | null) || null;
        const labelVal = (row.eventLabel as string | null) || null;
        const displayLabel = type === "EVEN"
          ? (custom ?? (labelVal && labelVal !== "Event" ? labelVal : null) ?? "Event")
          : (EVENT_TYPE_LABELS[type] ?? labelVal ?? custom ?? type);
        return {
          id: row.id as string,
          label: displayLabel,
          value: (row.value as string | null) || null,
          dateDisplay: (row.date?.original as string | null) || null,
          year: (row.date?.year as number | null) || null,
          placeDisplay: fullPlaceLabelFromGedcomPlace(row.place) || null,
          linkedPeople: linkedIndMap.get(row.id as string) ?? [],
        };
      });

    const media = mediaRows.map((row) => {
      const mediaType = normalizeMediaType(row.source, row.form);
      let profileHref = "";
      if (row.source === "story" && row.slug) profileHref = `/stories/${row.slug}`;
      else if (row.source === "gedcom") profileHref = `/media/${encodeURIComponent(row.id)}`;
      return { id: row.id, source: row.source, title: row.title, mediaType, kind: row.kind, profileHref };
    });

    const surnames = surnameDataRows.map((r) => ({
      id: r.id, name: r.surname, frequency: Number(r.frequency),
    }));
    const givenNames = givenNameDataRows.map((r) => ({
      id: r.id, name: r.given_name, frequency: Number(r.frequency),
    }));

    return NextResponse.json({
      people:     { items: people,     total: Number(personCountRows[0]?.n    ?? 0) },
      families:   { items: families,   total: Number(familyCountRows[0]?.n   ?? 0) },
      events:     { items: events,     total: Number(eventCountRows[0]?.n    ?? 0) },
      media:      { items: media,      total: mediaTotal },
      surnames:   { items: surnames,   total: Number(surnameCountRows[0]?.n   ?? 0) },
      givenNames: { items: givenNames, total: Number(givenNameCountRows[0]?.n ?? 0) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
