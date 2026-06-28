import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import {
  fullPlaceLabelFromGedcomPlace,
  GEDCOM_PLACE_DISPLAY_SELECT,
} from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { shouldGateLivingEventContent } from "@/lib/auth/living-event-privacy";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { redactEventLinkedPeopleForViewer } from "@/lib/auth/living-person-privacy";
import { eventLoginPath, loadEventLivingLinksByIds } from "@/lib/events/map-event-living-privacy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeLike(s: string) { return s.replace(/\\/g,"\\\\").replace(/%/g,"\\%").replace(/_/g,"\\_"); }
function pct(s: string) { return `%${escapeLike(s)}%`; }
function parseIntParam(v: string | null): number | null { const n=parseInt(v??'',10); return isNaN(n)?null:n; }
function parseBoolParam(v: string | null): "all" | "yes" | "no" {
  return v === "yes" || v === "no" ? v : "all";
}

interface QParts { joins: string[]; seenJoins: Set<string>; conditions: string[]; params: unknown[]; }
function makeParts(): QParts { return { joins:[], seenJoins: new Set(), conditions:[], params:[] }; }
function qp(parts: QParts, value: unknown): string { parts.params.push(value); return `$${parts.params.length}`; }
function where(parts: QParts, sql: string) { parts.conditions.push(sql); }
function join(parts: QParts, sql: string) {
  if (!parts.seenJoins.has(sql)) { parts.seenJoins.add(sql); parts.joins.push(sql); }
}
function buildWhere(parts: QParts) {
  return parts.conditions.length ? `WHERE ${parts.conditions.join("\n  AND ")}` : "";
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Born", DEAT: "Died", BURI: "Buried", CHR: "Christened",
  BAPM: "Baptised", CONF: "Confirmed", OCCU: "Occupation", RESI: "Residence",
  EMIG: "Emigrated", IMMI: "Immigrated", NATU: "Naturalized", CENS: "Census",
  GRAD: "Graduated", RETI: "Retired", WILL: "Will", PROB: "Probate",
  ORDN: "Ordained", ADOP: "Adopted", MARR: "Married", DIV: "Divorced",
  MARL: "Marriage licence", ENGA: "Engaged", EVEN: "Event",
};

// ---------------------------------------------------------------------------
// Event ID query
// ---------------------------------------------------------------------------
async function queryEventIds(
  fileUuid: string,
  sp: URLSearchParams,
  limit: number,
  offset: number,
): Promise<{ ids: string[]; total: number }> {
  const personId = sp.get("personId")?.trim() || null;
  const eventTypes = sp.get("eventTypes")?.split(",").map(s=>s.trim()).filter(Boolean) ?? [];
  const linkedTo = sp.get("linkedTo") ?? "both";
  const dateQualifier = sp.get("dateQualifier") || null; // "exact" | "about" | "before" | "after" | "between"
  const dateYear    = parseIntParam(sp.get("dateYear"));
  const dateMonth   = parseIntParam(sp.get("dateMonth")); // 1–12
  const dateDay     = dateMonth !== null ? parseIntParam(sp.get("dateDay")) : null; // 1–31, only valid with month
  const dateEndYear = parseIntParam(sp.get("dateEndYear")); // "between" end bound
  const place = sp.get("place")?.trim() || null;
  const hasNotes = parseBoolParam(sp.get("hasNotes"));
  const hasMedia = parseBoolParam(sp.get("hasMedia"));
  const hasSources = parseBoolParam(sp.get("hasSources"));

  const parts = makeParts();
  where(parts, `ev.file_uuid = ${qp(parts, fileUuid)}::uuid`);

  // Event type filter
  if (eventTypes.length === 1) {
    where(parts, `ev.event_type = ${qp(parts, eventTypes[0])}`);
  } else if (eventTypes.length > 1) {
    const placeholders = eventTypes.map((t) => qp(parts, t)).join(", ");
    where(parts, `ev.event_type IN (${placeholders})`);
  }

  // Date qualifier filter
  const hasYear  = dateYear  !== null;
  const hasMonth = dateMonth !== null;
  const hasDay   = dateDay   !== null; // already requires month via parse above

  if (dateQualifier === "between" && (dateYear !== null || dateEndYear !== null)) {
    join(parts, `LEFT JOIN gedcom_dates_v2 d ON d.id = ev.date_id`);
    if (dateYear     !== null) where(parts, `d.year >= ${qp(parts, dateYear)}`);
    if (dateEndYear  !== null) where(parts, `d.year <= ${qp(parts, dateEndYear)}`);
  } else if (dateQualifier && (hasYear || hasMonth)) {
    join(parts, `LEFT JOIN gedcom_dates_v2 d ON d.id = ev.date_id`);

    if (dateQualifier === "exact") {
      where(parts, `d.date_type::text = 'EXACT'`);
      if (hasYear)  where(parts, `d.year  = ${qp(parts, dateYear)}`);
      if (hasMonth) where(parts, `d.month = ${qp(parts, dateMonth)}`);
      if (hasDay)   where(parts, `d.day   = ${qp(parts, dateDay)}`);

    } else if (dateQualifier === "about") {
      where(parts, `d.date_type::text IN ('ABOUT', 'ESTIMATED', 'CALCULATED')`);
      if (hasYear)  where(parts, `d.year  = ${qp(parts, dateYear)}`);
      if (hasMonth) where(parts, `d.month = ${qp(parts, dateMonth)}`);
      if (hasDay)   where(parts, `d.day   = ${qp(parts, dateDay)}`);

    } else if (dateQualifier === "before") {
      if (hasYear && hasMonth && hasDay) {
        const yr = qp(parts, dateYear!); const mo = qp(parts, dateMonth!); const dy = qp(parts, dateDay!);
        where(parts, `(d.year < ${yr} OR (d.year = ${yr} AND d.month < ${mo}) OR (d.year = ${yr} AND d.month = ${mo} AND d.day < ${dy}) OR (d.date_type::text = 'BEFORE' AND d.year = ${yr} AND d.month = ${mo} AND d.day = ${dy}))`);
      } else if (hasYear && hasMonth) {
        const yr = qp(parts, dateYear!); const mo = qp(parts, dateMonth!);
        where(parts, `(d.year < ${yr} OR (d.year = ${yr} AND d.month < ${mo}) OR (d.date_type::text = 'BEFORE' AND d.year = ${yr} AND d.month = ${mo}))`);
      } else if (hasYear) {
        const yr = qp(parts, dateYear!);
        where(parts, `(d.year < ${yr} OR (d.date_type::text = 'BEFORE' AND d.year = ${yr}))`);
      } else if (hasMonth && hasDay) {
        const mo = qp(parts, dateMonth!); const dy = qp(parts, dateDay!);
        where(parts, `(d.month < ${mo} OR (d.month = ${mo} AND d.day < ${dy}))`);
      } else if (hasMonth) {
        where(parts, `d.month < ${qp(parts, dateMonth!)}`);
      }

    } else if (dateQualifier === "after") {
      if (hasYear && hasMonth && hasDay) {
        const yr = qp(parts, dateYear!); const mo = qp(parts, dateMonth!); const dy = qp(parts, dateDay!);
        where(parts, `(d.year > ${yr} OR (d.year = ${yr} AND d.month > ${mo}) OR (d.year = ${yr} AND d.month = ${mo} AND d.day > ${dy}) OR (d.date_type::text = 'AFTER' AND d.year = ${yr} AND d.month = ${mo} AND d.day = ${dy}))`);
      } else if (hasYear && hasMonth) {
        const yr = qp(parts, dateYear!); const mo = qp(parts, dateMonth!);
        where(parts, `(d.year > ${yr} OR (d.year = ${yr} AND d.month > ${mo}) OR (d.date_type::text = 'AFTER' AND d.year = ${yr} AND d.month = ${mo}))`);
      } else if (hasYear) {
        const yr = qp(parts, dateYear!);
        where(parts, `(d.year > ${yr} OR (d.date_type::text = 'AFTER' AND d.year = ${yr}))`);
      } else if (hasMonth && hasDay) {
        const mo = qp(parts, dateMonth!); const dy = qp(parts, dateDay!);
        where(parts, `(d.month > ${mo} OR (d.month = ${mo} AND d.day > ${dy}))`);
      } else if (hasMonth) {
        where(parts, `d.month > ${qp(parts, dateMonth!)}`);
      }
    }
  }

  // Place filter
  if (place) {
    join(parts, `LEFT JOIN gedcom_places_v2 p ON p.id = ev.place_id`);
    const pp = qp(parts, pct(place));
    where(parts, `(p.name ILIKE ${pp} OR p.county ILIKE ${pp} OR p.state ILIKE ${pp} OR p.country ILIKE ${pp} OR p.original ILIKE ${pp})`);
  }

  // Person filter — events linked to this individual directly OR via their families
  if (personId) {
    const pid = qp(parts, personId);
    if (linkedTo === "individual") {
      where(parts, `EXISTS (SELECT 1 FROM gedcom_individual_events_v2 ie WHERE ie.event_id = ev.id AND ie.individual_id = ${pid}::uuid)`);
    } else if (linkedTo === "family") {
      where(parts, `EXISTS (
        SELECT 1 FROM gedcom_family_events_v2 fe
        JOIN gedcom_families_v2 f ON f.id = fe.family_id
        WHERE fe.event_id = ev.id AND (f.husband_id = ${pid}::uuid OR f.wife_id = ${pid}::uuid)
      )`);
    } else {
      where(parts, `(
        EXISTS (SELECT 1 FROM gedcom_individual_events_v2 ie WHERE ie.event_id = ev.id AND ie.individual_id = ${pid}::uuid)
        OR EXISTS (
          SELECT 1 FROM gedcom_family_events_v2 fe
          JOIN gedcom_families_v2 f ON f.id = fe.family_id
          WHERE fe.event_id = ev.id AND (f.husband_id = ${pid}::uuid OR f.wife_id = ${pid}::uuid)
        )
      )`);
    }
  } else {
    // No person — still apply linkedTo scope
    if (linkedTo === "individual") {
      where(parts, `EXISTS (SELECT 1 FROM gedcom_individual_events_v2 ie WHERE ie.event_id = ev.id)`);
    } else if (linkedTo === "family") {
      where(parts, `EXISTS (SELECT 1 FROM gedcom_family_events_v2 fe WHERE fe.event_id = ev.id)`);
    }
  }

  // Attachment filters
  if (hasNotes === "yes") where(parts, `EXISTS (SELECT 1 FROM gedcom_event_notes_v2 en WHERE en.event_id = ev.id)`);
  else if (hasNotes === "no") where(parts, `NOT EXISTS (SELECT 1 FROM gedcom_event_notes_v2 en WHERE en.event_id = ev.id)`);

  if (hasMedia === "yes") where(parts, `EXISTS (SELECT 1 FROM gedcom_event_media_v2 em WHERE em.event_id = ev.id)`);
  else if (hasMedia === "no") where(parts, `NOT EXISTS (SELECT 1 FROM gedcom_event_media_v2 em WHERE em.event_id = ev.id)`);

  if (hasSources === "yes") where(parts, `EXISTS (SELECT 1 FROM gedcom_event_sources_v2 es WHERE es.event_id = ev.id)`);
  else if (hasSources === "no") where(parts, `NOT EXISTS (SELECT 1 FROM gedcom_event_sources_v2 es WHERE es.event_id = ev.id)`);

  const joinSql = parts.joins.join("\n");
  const whereSql = buildWhere(parts);
  const base = `FROM gedcom_events_v2 ev\n${joinSql}\n${whereSql}`;

  const countQuery = `SELECT COUNT(DISTINCT ev.id) AS n ${base}`;
  const countParams = [...parts.params];

  const idParams = [...parts.params, limit, offset];
  const limitRef = `$${idParams.length - 1}`;
  const offsetRef = `$${idParams.length}`;
  // Order by date year, then sort_order for determinism
  const idQuery = `
    SELECT DISTINCT ev.id,
      (SELECT d2.year FROM gedcom_dates_v2 d2 WHERE d2.id = ev.date_id) AS yr,
      ev.sort_order
    ${base}
    ORDER BY yr NULLS LAST, ev.sort_order
    LIMIT ${limitRef} OFFSET ${offsetRef}
  `;

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ n: bigint }>>(countQuery, ...countParams),
    prisma.$queryRawUnsafe<Array<{ id: string }>>(idQuery, ...idParams),
  ]);

  return { ids: idRows.map((r) => r.id), total: Number(countRows[0]?.n ?? 0) };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const sp = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10) || 20));
    const offset = Math.max(0, parseInt(sp.get("offset") ?? "0", 10) || 0);

    const { ids: eventIds, total } = await queryEventIds(fileUuid, sp, limit, offset);

    if (eventIds.length === 0) {
      return NextResponse.json({ events: [], total: 0, hasMore: false, limit, offset });
    }

    // Batch-fetch full event rows + linked individuals + linked families
    const [eventRows, linkedIndRows, linkedFamRows] = await Promise.all([
      prisma.gedcomEvent.findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          eventType: true,
          eventLabel: true,
          customType: true,
          value: true,
          sortOrder: true,
          date: { select: { original: true, year: true } },
          place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
          eventNotes: { select: { id: true }, take: 1 },
          eventMedia: { select: { id: true }, take: 1 },
          eventSources: { select: { id: true }, take: 1 },
        },
      }),
      prisma.gedcomIndividualEvent.findMany({
        where: { eventId: { in: eventIds } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          eventId: true,
          role: true,
          participantKind: true,
          sortOrder: true,
          individual: { select: { id: true, fullName: true, isLiving: true } },
        },
      }),
      prisma.gedcomFamilyEvent.findMany({
        where: { eventId: { in: eventIds } },
        select: {
          eventId: true,
          family: {
            select: {
              id: true,
              xref: true,
              husband: { select: { id: true, fullName: true, isLiving: true } },
              wife: { select: { id: true, fullName: true, isLiving: true } },
            },
          },
        },
      }),
    ]);

    // Build lookup maps
    const indsByEvent = new Map<string, { id: string; displayName: string; role: string; participantKind: string; profileHref: string }[]>();
    for (const row of linkedIndRows) {
      const arr = indsByEvent.get(row.eventId) ?? [];
      arr.push({
        id: row.individual.id,
        displayName: formatGedcomFullNameForDisplay(row.individual.fullName),
        role: row.role,
        participantKind: row.participantKind,
        profileHref: `/individuals/${encodeURIComponent(row.individual.id)}`,
      });
      indsByEvent.set(row.eventId, arr);
    }

    const famsByEvent = new Map<string, { id: string; title: string; profileHref: string }[]>();
    for (const row of linkedFamRows) {
      const f = row.family;
      const p1 = formatGedcomFullNameForDisplay(f.husband?.fullName ?? null);
      const p2 = formatGedcomFullNameForDisplay(f.wife?.fullName ?? null);
      const names = [p1, p2].filter(Boolean);
      const title = names.length > 0 ? names.join(" & ") : f.xref;
      const arr = famsByEvent.get(row.eventId) ?? [];
      arr.push({
        id: f.id,
        title,
        profileHref: `/families/${encodeURIComponent(f.id)}`,
      });
      famsByEvent.set(row.eventId, arr);
    }

    const eventOrder = new Map(eventIds.map((id, i) => [id, i]));
    const viewer = await resolvePublicViewer();
    const eventLinksById = await loadEventLivingLinksByIds(fileUuid, eventIds);

    const events = [...eventRows]
      .sort((a, b) => (eventOrder.get(a.id) ?? 0) - (eventOrder.get(b.id) ?? 0))
      .map((ev) => {
        const type = ev.eventType;
        const custom = ev.customType || null;
        const label = (ev.eventLabel as string | null) || null;
        const displayLabel = type === "EVEN"
          ? (custom ?? (label && label !== "Event" ? label : null) ?? "Event")
          : (EVENT_TYPE_LABELS[type] ?? label ?? custom ?? type);
        const links = eventLinksById.get(ev.id) ?? { individualEvents: [], familyEvents: [] };
        const privacyRestricted = shouldGateLivingEventContent(viewer, links);
        const eventPath = eventLoginPath(ev.id);

        return {
          id: ev.id,
          eventType: type,
          label: privacyRestricted ? "Event (sign in to view)" : displayLabel,
          dateDisplay: privacyRestricted ? null : (ev.date?.original ?? null),
          year: privacyRestricted ? null : (ev.date?.year ?? null),
          placeDisplay: privacyRestricted ? null : (fullPlaceLabelFromGedcomPlace(ev.place) ?? null),
          value: privacyRestricted ? null : (ev.value ?? null),
          linkedIndividuals: privacyRestricted
            ? []
            : redactEventLinkedPeopleForViewer(indsByEvent.get(ev.id) ?? [], viewer),
          linkedFamilies: privacyRestricted ? [] : (famsByEvent.get(ev.id) ?? []),
          hasNotes: ev.eventNotes.length > 0,
          hasMedia: ev.eventMedia.length > 0,
          hasSources: ev.eventSources.length > 0,
          privacyRestricted,
          loginHref: privacyRestricted ? buildLoginWallPath(eventPath) : null,
          profileHref: privacyRestricted ? buildLoginWallPath(eventPath) : eventPath,
        };
      });

    return NextResponse.json({ events, total, hasMore: offset + events.length < total, limit, offset });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
