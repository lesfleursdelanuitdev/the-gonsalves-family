import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import { fullPlaceLabelFromGedcomPlace, GEDCOM_PLACE_DISPLAY_SELECT } from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";
import {
  redactEventLinkedPeopleForViewer,
  redactFamilyPartnerForViewer,
  redactSearchIndividualForViewer,
} from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { shouldGateLivingNoteContent } from "@/lib/auth/living-note-privacy";
import { shouldGateLivingEventContent } from "@/lib/auth/living-event-privacy";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import { loadNoteLivingLinksByIds } from "@/lib/notes/map-note-living-privacy";
import { eventLoginPath, loadEventLivingLinksByIds } from "@/lib/events/map-event-living-privacy";
import { type P, mc, parseTerms, termsBlock } from "./sql-helpers";

const MAX_CATEGORY_RESULTS = 1000;

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
  places:     { items: [], total: 0 },
  notes:      { items: [], total: 0 },
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || null;
  if (!q) return NextResponse.json(EMPTY);

  const matchType = sp.get("matchType") ?? "contains"; // "contains" | "exact" | "soundex"
  const logic = (sp.get("keywordLogic") === "and" ? "and" : "or") as "or" | "and";
  const terms = parseTerms(q);
  if (terms.length === 0) return NextResponse.json(EMPTY);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {

    const [fileUuid, treeId] = await Promise.all([resolveTreeFileUuid(), resolveTreeId()]);
    if (!fileUuid || !treeId) return NextResponse.json({ error: "Tree not found" }, { status: 404 });

    // ---------------------------------------------------------------------------
    // Build all query param arrays independently so each query is self-contained
    // ---------------------------------------------------------------------------

    // PEOPLE
    const pPpl: P = [fileUuid];
    const pplCond = termsBlock(pPpl, ["full_name_lower"], terms, matchType, logic);

    // FAMILIES — per-term condition covers both husband and wife
    const pFam: P = [fileUuid];
    const famTermConds = terms.map(t => {
      const h = mc(pFam, "hi.full_name_lower", t, matchType);
      const w = mc(pFam, "wi.full_name_lower", t, matchType);
      return `(${h} OR ${w})`;
    });
    const famCond = famTermConds.length === 1
      ? famTermConds[0]!
      : `(${famTermConds.join(logic === "and" ? " AND " : " OR ")})`;

    // EVENTS — per-term condition covers value, label, place name/original, and linked individual name
    const pEv: P = [fileUuid];
    const evTermConds = terms.map(t => {
      const vc  = mc(pEv, "ev.value",            t, matchType);
      const lc  = mc(pEv, "ev.event_label",      t, matchType);
      const pnc = mc(pEv, "pl.name",             t, matchType);
      const poc = mc(pEv, "pl.original",         t, matchType);
      const ic  = mc(pEv, "ind.full_name_lower", t, matchType);
      return `(${vc} OR ${lc} OR ${pnc} OR ${poc} OR EXISTS (
        SELECT 1 FROM gedcom_individual_events_v2 ie
        JOIN gedcom_individuals_v2 ind ON ind.id = ie.individual_id
        WHERE ie.event_id = ev.id AND ${ic}
      ))`;
    });
    const evCond = evTermConds.length === 1
      ? evTermConds[0]!
      : `(${evTermConds.join(logic === "and" ? " AND " : " OR ")})`;

    // SURNAMES
    const pSur: P = [fileUuid];
    const surCond = termsBlock(pSur, ["s.surname_lower"], terms, matchType, logic);

    // GIVEN NAMES
    const pGiv: P = [fileUuid];
    const givCond = termsBlock(pGiv, ["gn.given_name_lower"], terms, matchType, logic);

    // PLACES
    const pPl: P = [fileUuid];
    const plTermConds = terms.map(t => {
      const nc = mc(pPl, "pl.name",     t, matchType);
      const oc = mc(pPl, "pl.original", t, matchType);
      return `(${nc} OR ${oc})`;
    });
    const plCond = plTermConds.length === 1
      ? plTermConds[0]!
      : `(${plTermConds.join(logic === "and" ? " AND " : " OR ")})`;

    // NOTES
    const pNot: P = [fileUuid];
    const notCond = termsBlock(pNot, ["n.content"], terms, matchType, logic);

    // MEDIA — tag expansion: search tag names with same match type, then pull in tagged media.
    // Per-term blocks are built inline in the CTE so everything runs in a single query.
    const pMed: P = [fileUuid, treeId];
    const mediaTermBlocks = terms.map(t => {
      const gedTitle = mc(pMed, "gm.title", t, matchType);
      const gedTag   = mc(pMed, "t.name",   t, matchType);
      const strTitle = mc(pMed, "s.title",  t, matchType);
      const strTag   = mc(pMed, "t2.name",  t, matchType);
      return { gedTitle, gedTag, strTitle, strTag };
    });

    const joinTermMediaConds = (blocks: typeof mediaTermBlocks, getGed: (b: typeof blocks[0]) => string, getStr: (b: typeof blocks[0]) => string): { ged: string; str: string } => {
      if (blocks.length === 1) {
        return { ged: getGed(blocks[0]!), str: getStr(blocks[0]!) };
      }
      const sep = logic === "and" ? " AND " : " OR ";
      return {
        ged: `(${blocks.map(b => `(${getGed(b)})`).join(sep)})`,
        str: `(${blocks.map(b => `(${getStr(b)})`).join(sep)})`,
      };
    };

    const mediaGedTagConds = joinTermMediaConds(
      mediaTermBlocks,
      b => `${b.gedTitle} OR EXISTS (SELECT 1 FROM gedcom_media_app_tags x JOIN tags t ON t.id = x.tag_id WHERE x.gedcom_media_id = gm.id AND ${b.gedTag})`,
      b => `${b.strTitle} OR EXISTS (SELECT 1 FROM story_tags x JOIN tags t2 ON t2.id = x.tag_id WHERE x.story_id = s.id AND ${b.strTag})`,
    );

    const mediaSql = `
      WITH res AS (
        SELECT gm.id::text, 'gedcom'::text AS source, gm.title, gm.form,
          NULL::text AS slug, NULL::text AS kind
        FROM gedcom_media_v2 gm
        WHERE gm.file_uuid = $1::uuid
          AND (${mediaGedTagConds.ged})
        UNION ALL
        SELECT s.id::text, 'story'::text AS source, s.title, 'story'::text AS form,
          s.slug::text AS slug, s.kind::text AS kind
        FROM stories s
        WHERE s.tree_id = $2::uuid AND s.deleted_at IS NULL AND s.is_published = true
          AND (${mediaGedTagConds.str})
      )
      SELECT *, COUNT(*) OVER() AS total FROM res ORDER BY LOWER(title) NULLS LAST LIMIT ${MAX_CATEGORY_RESULTS}
    `;

    // All queries run in parallel
    const [
      [personCountRows, personIdRows],
      [familyCountRows, familyIdRows],
      [eventCountRows, eventIdRows],
      mediaRows,
      [surnameCountRows, surnameDataRows],
      [givenNameCountRows, givenNameDataRows],
      placeRows,
      noteRows,
    ] = await Promise.all([
      // PEOPLE ----------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(*) AS n FROM gedcom_individuals_v2 WHERE file_uuid = $1::uuid AND ${pplCond}`,
          ...pPpl,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM gedcom_individuals_v2 WHERE file_uuid = $1::uuid AND ${pplCond} ORDER BY full_name_lower NULLS LAST LIMIT ${MAX_CATEGORY_RESULTS}`,
          ...pPpl,
        ),
      ]),
      // FAMILIES --------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(*) AS n FROM gedcom_families_v2 f
           LEFT JOIN gedcom_individuals_v2 hi ON hi.id = f.husband_id
           LEFT JOIN gedcom_individuals_v2 wi ON wi.id = f.wife_id
           WHERE f.file_uuid = $1::uuid AND ${famCond}`,
          ...pFam,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT f.id FROM gedcom_families_v2 f
           LEFT JOIN gedcom_individuals_v2 hi ON hi.id = f.husband_id
           LEFT JOIN gedcom_individuals_v2 wi ON wi.id = f.wife_id
           WHERE f.file_uuid = $1::uuid AND ${famCond}
           ORDER BY COALESCE(hi.full_name_lower, wi.full_name_lower) NULLS LAST LIMIT ${MAX_CATEGORY_RESULTS}`,
          ...pFam,
        ),
      ]),
      // EVENTS ----------------------------------------------------------------
      Promise.all([
        prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
          `SELECT COUNT(DISTINCT ev.id) AS n FROM gedcom_events_v2 ev
           LEFT JOIN gedcom_places_v2 pl ON pl.id = ev.place_id
           WHERE ev.file_uuid = $1::uuid AND ${evCond}`,
          ...pEv,
        ),
        prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT DISTINCT ev.id FROM gedcom_events_v2 ev
           LEFT JOIN gedcom_places_v2 pl ON pl.id = ev.place_id
           WHERE ev.file_uuid = $1::uuid AND ${evCond}
           LIMIT ${MAX_CATEGORY_RESULTS}`,
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
          `SELECT s.id, s.surname, s.frequency FROM gedcom_surnames_v2 s WHERE s.file_uuid = $1::uuid AND ${surCond} ORDER BY s.frequency DESC NULLS LAST LIMIT ${MAX_CATEGORY_RESULTS}`,
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
          `SELECT gn.id, gn.given_name, gn.frequency FROM gedcom_given_names_v2 gn WHERE gn.file_uuid = $1::uuid AND ${givCond} ORDER BY gn.frequency DESC NULLS LAST LIMIT ${MAX_CATEGORY_RESULTS}`,
          ...pGiv,
        ),
      ]),
      // PLACES ----------------------------------------------------------------
      prisma.$queryRawUnsafe<Array<{
        id: string; display_name: string | null; event_count: number; total: bigint;
      }>>(
        `SELECT pl.id, COALESCE(pl.original, pl.name) AS display_name,
           COUNT(ev.id)::int AS event_count, COUNT(*) OVER() AS total
         FROM gedcom_places_v2 pl
         LEFT JOIN gedcom_events_v2 ev ON ev.place_id = pl.id AND ev.file_uuid = pl.file_uuid
         WHERE pl.file_uuid = $1::uuid AND ${plCond}
         GROUP BY pl.id, pl.original, pl.name
         ORDER BY COUNT(ev.id) DESC NULLS LAST
         LIMIT ${MAX_CATEGORY_RESULTS}`,
        ...pPl,
      ),
      // NOTES -----------------------------------------------------------------
      prisma.$queryRawUnsafe<Array<{
        id: string; snippet: string | null; total: bigint;
        individual_id: string | null; individual_name: string | null;
      }>>(
        `SELECT n.id, LEFT(n.content, 150) AS snippet, COUNT(*) OVER() AS total,
           owner.individual_id, owner.individual_name
         FROM gedcom_notes_v2 n
         LEFT JOIN LATERAL (
           SELECT jin.individual_id, i.full_name AS individual_name
           FROM gedcom_individual_notes_v2 jin
           JOIN gedcom_individuals_v2 i ON i.id = jin.individual_id AND i.file_uuid = jin.file_uuid
           WHERE jin.note_id = n.id AND jin.file_uuid = n.file_uuid
           LIMIT 1
         ) owner ON TRUE
         WHERE n.file_uuid = $1::uuid AND ${notCond}
         ORDER BY LENGTH(n.content) DESC NULLS LAST
         LIMIT ${MAX_CATEGORY_RESULTS}`,
        ...pNot,
      ),
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
              husband: { select: { id: true, fullName: true, birthYear: true, deathYear: true, isLiving: true } },
              wife:    { select: { id: true, fullName: true, birthYear: true, deathYear: true, isLiving: true } },
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
            select: {
              eventId: true,
              individual: { select: { id: true, fullName: true, isLiving: true } },
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
    const viewer = await resolvePublicViewer();

    const linkedIndMap = new Map<string, Array<{ id: string; displayName: string; profileHref: string; isLiving?: boolean }>>();
    for (const row of linkedIndRows) {
      const arr = linkedIndMap.get(row.eventId) ?? [];
      arr.push({
        id: row.individual.id,
        displayName: formatGedcomFullNameForDisplay(row.individual.fullName),
        profileHref: `/individuals/${encodeURIComponent(row.individual.id)}`,
        isLiving: row.individual.isLiving,
      });
      linkedIndMap.set(row.eventId, arr);
    }

    const people = [...personRows]
      .sort((a, b) => (indOrder.get(a.id) ?? 0) - (indOrder.get(b.id) ?? 0))
      .map((row) =>
        redactSearchIndividualForViewer(
          {
            id: row.id,
            displayName: formatGedcomFullNameForDisplay(row.fullName),
            birthYear: row.birthYear as number | null,
            deathYear: row.deathYear as number | null,
            isLiving: row.isLiving as boolean,
            gender: row.sex ? (sexMap[row.sex as string] ?? (row.sex as string)) : (row.gender as string | null),
            portraitSrc: individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
            profileHref: `/individuals/${encodeURIComponent(row.id)}`,
          },
          viewer,
        ),
      );

    const families = [...familyRows]
      .sort((a, b) => (famOrder.get(a.id) ?? 0) - (famOrder.get(b.id) ?? 0))
      .map((row) => {
        const makePartner = (p: typeof row.husband) =>
          p
            ? redactFamilyPartnerForViewer(
                {
                  id: p.id,
                  displayName: formatGedcomFullNameForDisplay(p.fullName),
                  birthYear: p.birthYear as number | null,
                  deathYear: p.deathYear as number | null,
                  isLiving: p.isLiving as boolean,
                  profileHref: `/individuals/${encodeURIComponent(p.id)}`,
                },
                viewer,
              )
            : null;
        const h = makePartner(row.husband);
        const w = makePartner(row.wife);
        const names = [h?.displayName, w?.displayName].filter(Boolean);
        return {
          id: row.id,
          title: names.length > 0 ? names.join(" & ") : "Unknown Family",
          husband: h,
          wife: w,
          marriageYear: row.marriageYear as number | null,
          profileHref: `/families/${encodeURIComponent(row.id)}`,
        };
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventLinksById = await loadEventLivingLinksByIds(fileUuid, eventIds);

    const events = [...(eventRows as any[])]
      .sort((a, b) => (evOrder.get(a.id) ?? 0) - (evOrder.get(b.id) ?? 0))
      .map((row) => {
        const type = row.eventType as string;
        const custom = (row.customType as string | null) || null;
        const labelVal = (row.eventLabel as string | null) || null;
        const displayLabel = type === "EVEN"
          ? (custom ?? (labelVal && labelVal !== "Event" ? labelVal : null) ?? "Event")
          : (EVENT_TYPE_LABELS[type] ?? labelVal ?? custom ?? type);
        const links = eventLinksById.get(row.id as string) ?? { individualEvents: [], familyEvents: [] };
        const privacyRestricted = shouldGateLivingEventContent(viewer, links);
        const eventPath = eventLoginPath(row.id as string);
        return {
          id: row.id as string,
          label: privacyRestricted ? "Event (sign in to view)" : displayLabel,
          value: privacyRestricted ? null : ((row.value as string | null) || null),
          dateDisplay: privacyRestricted ? null : ((row.date?.original as string | null) || null),
          year: privacyRestricted ? null : ((row.date?.year as number | null) || null),
          placeDisplay: privacyRestricted ? null : (fullPlaceLabelFromGedcomPlace(row.place) || null),
          linkedPeople: privacyRestricted
            ? []
            : redactEventLinkedPeopleForViewer(linkedIndMap.get(row.id as string) ?? [], viewer),
          privacyRestricted,
          loginHref: privacyRestricted ? buildLoginWallPath(eventPath) : null,
          profileHref: privacyRestricted ? buildLoginWallPath(eventPath) : eventPath,
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

    const places = placeRows.map((r) => ({
      id: r.id,
      displayName: r.display_name ?? "",
      eventCount: r.event_count,
      total: undefined,
      profileHref: `/tree/places/${encodeURIComponent(r.id)}`,
    }));
    const placesTotal = placeRows.length > 0 ? Number(placeRows[0]!.total) : 0;

    const noteLinksById = await loadNoteLivingLinksByIds(
      fileUuid,
      noteRows.map((row) => row.id),
    );

    const notes = noteRows.map((r) => {
      const links = noteLinksById.get(r.id) ?? { individualNotes: [], familyNotes: [] };
      const privacyRestricted = shouldGateLivingNoteContent(viewer, links);
      return {
        id: r.id,
        snippet: privacyRestricted ? "" : (r.snippet ?? ""),
        ownerName: r.individual_name
          ? formatGedcomFullNameForDisplay(r.individual_name)
          : null,
        ownerHref: r.individual_id
          ? `/individuals/${encodeURIComponent(r.individual_id)}`
          : null,
        privacyRestricted,
        loginHref: privacyRestricted ? buildLoginWallPath("/archive/notes") : null,
        total: undefined,
      };
    });
    const notesTotal = noteRows.length > 0 ? Number(noteRows[0]!.total) : 0;

    return NextResponse.json({
      people:     { items: people,     total: Number(personCountRows[0]?.n    ?? 0) },
      families:   { items: families,   total: Number(familyCountRows[0]?.n   ?? 0) },
      events:     { items: events,     total: Number(eventCountRows[0]?.n    ?? 0) },
      media:      { items: media,      total: mediaTotal },
      surnames:   { items: surnames,   total: Number(surnameCountRows[0]?.n   ?? 0) },
      givenNames: { items: givenNames, total: Number(givenNameCountRows[0]?.n ?? 0) },
      places:     { items: places,     total: placesTotal },
      notes:      { items: notes,      total: notesTotal },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
