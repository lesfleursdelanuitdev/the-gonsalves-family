import { NextRequest, NextResponse } from "next/server";
import { resolveTreeFileUuid } from "@/lib/tree";
import { prisma } from "@/lib/database/prisma";
import {
  fullPlaceLabelFromGedcomPlace,
  GEDCOM_PLACE_DISPLAY_SELECT,
} from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import {
  batchIndividualDisplayPhotoMedia,
  individualDisplayPhotoMediaToPublicUrl,
} from "@/lib/tree/individual-display-photo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeLike(s: string) { return s.replace(/\\/g,"\\\\").replace(/%/g,"\\%").replace(/_/g,"\\_"); }
function pct(s: string) { return `%${escapeLike(s)}%`; }
function parseIntParam(v: string | null): number | null { const n=parseInt(v??'',10); return isNaN(n)?null:n; }
function parseBoolParam(v: string | null): "all" | "yes" | "no" {
  return v === "yes" || v === "no" ? v : "all";
}

// Dynamic SQL builder with separate params per query stage
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

// Soundex match: require the first 3 soundex characters to match (letter + first two
// consonant codes). This eliminates trailing-zero false positives — e.g. "Alice" (A420)
// and "Amos" (A520) no longer match "Agus" (A220) because A42 ≠ A22 and A52 ≠ A22.
// "August" and "Augustino" (both A22x) correctly still match.
function soundexCond(parts: QParts, col: string, q: string): string {
  const p = qp(parts, q);
  return `left(soundex(${col}), 3) = left(soundex(${p}), 3)`;
}

// EXISTS subquery: does the individual (identified by `idExpr`) have any primary given
// name whose first 3 soundex characters match the query?
function givenSoundexExists(parts: QParts, idExpr: string, q: string): string {
  const p = qp(parts, q);
  return `EXISTS (
    SELECT 1 FROM gedcom_individual_name_forms nf
    JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = nf.id
    JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id
    WHERE nf.individual_id = ${idExpr} AND nf.is_primary = true
    AND left(soundex(gn.given_name_lower), 3) = left(soundex(${p}), 3)
  )`;
}

// ---------------------------------------------------------------------------
// Individual query
// ---------------------------------------------------------------------------
async function queryIndividuals(
  fileUuid: string,
  sp: URLSearchParams,
  limit: number,
  offset: number,
): Promise<{ ids: string[]; total: number }> {
  const q = sp.get("q")?.trim() ?? null;
  const nameField = sp.get("nameField") ?? "fullName";
  const matchType = sp.get("matchType") ?? "contains";
  const isLiving = parseBoolParam(sp.get("isLiving"));
  const sex = sp.get("sex") ?? "all";
  const minBirthYear = parseIntParam(sp.get("minBirthYear"));
  const maxBirthYear = parseIntParam(sp.get("maxBirthYear"));
  const minDeathYear = parseIntParam(sp.get("minDeathYear"));
  const maxDeathYear = parseIntParam(sp.get("maxDeathYear"));
  const bornIn = sp.get("bornIn")?.trim() || null;
  const diedIn = sp.get("diedIn")?.trim() || null;
  const hasChildren = parseBoolParam(sp.get("hasChildren"));
  const minChildren = parseIntParam(sp.get("minChildren"));
  const maxChildren = parseIntParam(sp.get("maxChildren"));
  const minUnions = parseIntParam(sp.get("minUnions"));
  const maxUnions = parseIntParam(sp.get("maxUnions"));
  const multipleUnions = parseBoolParam(sp.get("multipleUnions"));
  const multipleParentFamilies = parseBoolParam(sp.get("multipleParentFamilies"));
  const hasAdoptedParents = parseBoolParam(sp.get("hasAdoptedParents"));
  const hasAdoptedChildren = parseBoolParam(sp.get("hasAdoptedChildren"));

  const parts = makeParts();
  where(parts, `i.file_uuid = ${qp(parts, fileUuid)}::uuid`);

  // Name search
  if (q) {
    const qLower = q.toLowerCase();
    if (nameField === "surname") {
      if (matchType === "soundex") {
        where(parts, soundexCond(parts, `i.primary_surname_lower`, qLower));
      } else if (matchType === "exact") {
        where(parts, `i.primary_surname_lower = ${qp(parts, qLower)}`);
      } else {
        where(parts, `i.primary_surname_lower ILIKE ${qp(parts, pct(qLower))}`);
      }
    } else if (nameField === "givenName") {
      join(parts, `JOIN gedcom_individual_name_forms nf_gn ON nf_gn.individual_id = i.id AND nf_gn.is_primary = true`);
      join(parts, `JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = nf_gn.id`);
      join(parts, `JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id`);
      if (matchType === "soundex") {
        where(parts, soundexCond(parts, `gn.given_name_lower`, qLower));
      } else if (matchType === "exact") {
        where(parts, `gn.given_name_lower = ${qp(parts, qLower)}`);
      } else {
        where(parts, `gn.given_name_lower ILIKE ${qp(parts, pct(qLower))}`);
      }
    } else {
      // fullName: soundex checks both surname and any given name
      if (matchType === "soundex") {
        const surnCond = soundexCond(parts, `i.primary_surname_lower`, qLower);
        const givenCond = givenSoundexExists(parts, `i.id`, qLower);
        where(parts, `(${surnCond} OR ${givenCond})`);
      } else if (matchType === "exact") {
        where(parts, `i.full_name_lower = ${qp(parts, qLower)}`);
      } else {
        where(parts, `i.full_name_lower ILIKE ${qp(parts, pct(qLower))}`);
      }
    }
  }

  // Living status
  if (isLiving === "yes") where(parts, `i.is_living = true`);
  else if (isLiving === "no") where(parts, `i.is_living = false`);

  // Sex
  if (sex === "M") where(parts, `i.sex::text = ${qp(parts, "M")}`);
  else if (sex === "F") where(parts, `i.sex::text = ${qp(parts, "F")}`);
  else if (sex === "unknown") where(parts, `(i.sex IS NULL OR i.sex::text IN ('U','X'))`);

  // Birth/death year ranges
  if (minBirthYear !== null) where(parts, `i.birth_year >= ${qp(parts, minBirthYear)}`);
  if (maxBirthYear !== null) where(parts, `i.birth_year <= ${qp(parts, maxBirthYear)}`);
  if (minDeathYear !== null) where(parts, `i.death_year >= ${qp(parts, minDeathYear)}`);
  if (maxDeathYear !== null) where(parts, `i.death_year <= ${qp(parts, maxDeathYear)}`);

  // Born in place (fuzzy across hierarchy)
  if (bornIn) {
    join(parts, `LEFT JOIN gedcom_places_v2 bp ON bp.id = i.birth_place_id`);
    const p = qp(parts, pct(bornIn));
    where(parts, `(bp.name ILIKE ${p} OR bp.county ILIKE ${p} OR bp.state ILIKE ${p} OR bp.country ILIKE ${p} OR bp.original ILIKE ${p})`);
  }

  // Died in place (fuzzy)
  if (diedIn) {
    join(parts, `LEFT JOIN gedcom_places_v2 dp ON dp.id = i.death_place_id`);
    const p = qp(parts, pct(diedIn));
    where(parts, `(dp.name ILIKE ${p} OR dp.county ILIKE ${p} OR dp.state ILIKE ${p} OR dp.country ILIKE ${p} OR dp.original ILIKE ${p})`);
  }

  // Has children (denorm flag)
  if (hasChildren === "yes") where(parts, `i.has_children = true`);
  else if (hasChildren === "no") where(parts, `i.has_children = false`);

  // Children count range (subquery – only when needed)
  if (minChildren !== null || maxChildren !== null) {
    const fp = qp(parts, fileUuid);
    const subq = `(SELECT COUNT(DISTINCT fc.child_id) FROM gedcom_family_children_v2 fc JOIN gedcom_families_v2 pf ON pf.id = fc.family_id WHERE pf.file_uuid = ${fp}::uuid AND (pf.husband_id = i.id OR pf.wife_id = i.id))`;
    if (minChildren !== null) where(parts, `${subq} >= ${qp(parts, minChildren)}`);
    if (maxChildren !== null) where(parts, `${subq} <= ${qp(parts, maxChildren)}`);
  }

  // Union count
  if (minUnions !== null || maxUnions !== null || multipleUnions !== "all") {
    const fp = qp(parts, fileUuid);
    const subq = `(SELECT COUNT(*) FROM gedcom_families_v2 uf WHERE uf.file_uuid = ${fp}::uuid AND (uf.husband_id = i.id OR uf.wife_id = i.id))`;
    if (minUnions !== null) where(parts, `${subq} >= ${qp(parts, minUnions)}`);
    if (maxUnions !== null) where(parts, `${subq} <= ${qp(parts, maxUnions)}`);
    if (multipleUnions === "yes") where(parts, `${subq} > 1`);
    else if (multipleUnions === "no") where(parts, `${subq} <= 1`);
  }

  // Appears in multiple parent families
  if (multipleParentFamilies !== "all") {
    const subq = `(SELECT COUNT(*) FROM gedcom_family_children_v2 pfc WHERE pfc.child_id = i.id)`;
    if (multipleParentFamilies === "yes") where(parts, `${subq} > 1`);
    else where(parts, `${subq} <= 1`);
  }

  // Adopted parents
  if (hasAdoptedParents === "yes") {
    where(parts, `EXISTS (SELECT 1 FROM gedcom_parent_child_v2 apc WHERE apc.child_id = i.id AND LOWER(COALESCE(apc.pedigree,'')) = 'adopted')`);
  } else if (hasAdoptedParents === "no") {
    where(parts, `NOT EXISTS (SELECT 1 FROM gedcom_parent_child_v2 apc WHERE apc.child_id = i.id AND LOWER(COALESCE(apc.pedigree,'')) = 'adopted')`);
  }

  // Adopted children
  if (hasAdoptedChildren === "yes") {
    where(parts, `EXISTS (SELECT 1 FROM gedcom_parent_child_v2 apcc WHERE apcc.parent_id = i.id AND LOWER(COALESCE(apcc.pedigree,'')) = 'adopted')`);
  } else if (hasAdoptedChildren === "no") {
    where(parts, `NOT EXISTS (SELECT 1 FROM gedcom_parent_child_v2 apcc WHERE apcc.parent_id = i.id AND LOWER(COALESCE(apcc.pedigree,'')) = 'adopted')`);
  }

  const joinSql = parts.joins.join("\n");
  const whereSql = buildWhere(parts);
  const base = `FROM gedcom_individuals_v2 i\n${joinSql}\n${whereSql}`;

  const countQuery = `SELECT COUNT(DISTINCT i.id) AS n ${base}`;
  const countParams = [...parts.params];

  const idParams = [...parts.params, limit, offset];
  const limitRef = `$${idParams.length - 1}`;
  const offsetRef = `$${idParams.length}`;
  const idQuery = `SELECT DISTINCT i.id, i.full_name_lower ${base}\nORDER BY i.full_name_lower NULLS LAST\nLIMIT ${limitRef} OFFSET ${offsetRef}`;

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ n: bigint }>>(countQuery, ...countParams),
    prisma.$queryRawUnsafe<Array<{ id: string }>>(idQuery, ...idParams),
  ]);

  return { ids: idRows.map((r) => r.id), total: Number(countRows[0]?.n ?? 0) };
}

// ---------------------------------------------------------------------------
// Family query
// ---------------------------------------------------------------------------
async function queryFamilies(
  fileUuid: string,
  sp: URLSearchParams,
  limit: number,
  offset: number,
): Promise<{ ids: string[]; total: number }> {
  const q = sp.get("q")?.trim() ?? null;
  const nameField = sp.get("nameField") ?? "fullName";
  const matchType = sp.get("matchType") ?? "contains";
  const isDivorced = parseBoolParam(sp.get("isDivorced"));
  const minUnionYear = parseIntParam(sp.get("minUnionYear"));
  const maxUnionYear = parseIntParam(sp.get("maxUnionYear"));
  const unionIn = sp.get("unionIn")?.trim() || null;
  const familyHasChildren = parseBoolParam(sp.get("familyHasChildren"));
  const minFamilyChildren = parseIntParam(sp.get("minFamilyChildren"));
  const maxFamilyChildren = parseIntParam(sp.get("maxFamilyChildren"));

  const parts = makeParts();
  where(parts, `f.file_uuid = ${qp(parts, fileUuid)}::uuid`);

  // Name search: filter families where at least one partner matches
  if (q) {
    const qLower = q.toLowerCase();
    if (nameField === "givenName") {
      if (matchType === "soundex") {
        const hCond = givenSoundexExists(parts, `f.husband_id`, qLower);
        const wCond = givenSoundexExists(parts, `f.wife_id`, qLower);
        where(parts, `(${hCond} OR ${wCond})`);
      } else if (matchType === "exact") {
        const hCond = `EXISTS (SELECT 1 FROM gedcom_individual_name_forms nf JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = nf.id JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id WHERE nf.individual_id = f.husband_id AND nf.is_primary = true AND gn.given_name_lower = ${qp(parts, qLower)})`;
        const wCond = `EXISTS (SELECT 1 FROM gedcom_individual_name_forms nf JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = nf.id JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id WHERE nf.individual_id = f.wife_id AND nf.is_primary = true AND gn.given_name_lower = ${qp(parts, qLower)})`;
        where(parts, `(${hCond} OR ${wCond})`);
      } else {
        const hCond = `EXISTS (SELECT 1 FROM gedcom_individual_name_forms nf JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = nf.id JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id WHERE nf.individual_id = f.husband_id AND nf.is_primary = true AND gn.given_name_lower ILIKE ${qp(parts, pct(qLower))})`;
        const wCond = `EXISTS (SELECT 1 FROM gedcom_individual_name_forms nf JOIN gedcom_name_form_given_names nfgn ON nfgn.name_form_id = nf.id JOIN gedcom_given_names_v2 gn ON gn.id = nfgn.given_name_id WHERE nf.individual_id = f.wife_id AND nf.is_primary = true AND gn.given_name_lower ILIKE ${qp(parts, pct(qLower))})`;
        where(parts, `(${hCond} OR ${wCond})`);
      }
    } else {
      // surname and fullName: join partner individuals for direct column access
      join(parts, `LEFT JOIN gedcom_individuals_v2 hi ON hi.id = f.husband_id`);
      join(parts, `LEFT JOIN gedcom_individuals_v2 wi ON wi.id = f.wife_id`);
      if (nameField === "surname") {
        if (matchType === "soundex") {
          const hiCond = soundexCond(parts, `hi.primary_surname_lower`, qLower);
          const wiCond = soundexCond(parts, `wi.primary_surname_lower`, qLower);
          where(parts, `(${hiCond} OR ${wiCond})`);
        } else if (matchType === "exact") {
          const p = qp(parts, qLower);
          where(parts, `(hi.primary_surname_lower = ${p} OR wi.primary_surname_lower = ${p})`);
        } else {
          const p = qp(parts, pct(qLower));
          where(parts, `(hi.primary_surname_lower ILIKE ${p} OR wi.primary_surname_lower ILIKE ${p})`);
        }
      } else {
        // fullName: soundex checks surname + given names for both partners
        if (matchType === "soundex") {
          const hiSurnCond = soundexCond(parts, `hi.primary_surname_lower`, qLower);
          const wiSurnCond = soundexCond(parts, `wi.primary_surname_lower`, qLower);
          const hiGivenCond = givenSoundexExists(parts, `hi.id`, qLower);
          const wiGivenCond = givenSoundexExists(parts, `wi.id`, qLower);
          where(parts, `(${hiSurnCond} OR ${wiSurnCond} OR ${hiGivenCond} OR ${wiGivenCond})`);
        } else if (matchType === "exact") {
          const p = qp(parts, qLower);
          where(parts, `(hi.full_name_lower = ${p} OR wi.full_name_lower = ${p})`);
        } else {
          const p = qp(parts, pct(qLower));
          where(parts, `(hi.full_name_lower ILIKE ${p} OR wi.full_name_lower ILIKE ${p})`);
        }
      }
    }
  }

  if (isDivorced === "yes") {
    where(parts, `(f.is_divorced = true OR EXISTS (SELECT 1 FROM gedcom_family_events_v2 fe JOIN gedcom_events_v2 ev ON ev.id = fe.event_id WHERE fe.family_id = f.id AND ev.event_type = 'DIV'))`);
  } else if (isDivorced === "no") {
    where(parts, `(f.is_divorced = false AND NOT EXISTS (SELECT 1 FROM gedcom_family_events_v2 fe JOIN gedcom_events_v2 ev ON ev.id = fe.event_id WHERE fe.family_id = f.id AND ev.event_type = 'DIV'))`);
  }

  if (minUnionYear !== null) where(parts, `f.marriage_year >= ${qp(parts, minUnionYear)}`);
  if (maxUnionYear !== null) where(parts, `f.marriage_year <= ${qp(parts, maxUnionYear)}`);

  if (unionIn) {
    join(parts, `LEFT JOIN gedcom_places_v2 mp ON mp.id = f.marriage_place_id`);
    const p = qp(parts, pct(unionIn));
    where(parts, `(mp.name ILIKE ${p} OR mp.county ILIKE ${p} OR mp.state ILIKE ${p} OR mp.country ILIKE ${p} OR mp.original ILIKE ${p})`);
  }

  if (familyHasChildren === "yes") where(parts, `f.children_count > 0`);
  else if (familyHasChildren === "no") where(parts, `f.children_count = 0`);

  if (minFamilyChildren !== null) where(parts, `f.children_count >= ${qp(parts, minFamilyChildren)}`);
  if (maxFamilyChildren !== null) where(parts, `f.children_count <= ${qp(parts, maxFamilyChildren)}`);

  const joinSql = parts.joins.join("\n");
  const whereSql = buildWhere(parts);
  const base = `FROM gedcom_families_v2 f\n${joinSql}\n${whereSql}`;

  const countQuery = `SELECT COUNT(*) AS n ${base}`;
  const countParams = [...parts.params];

  const idParams = [...parts.params, limit, offset];
  const limitRef = `$${idParams.length - 1}`;
  const offsetRef = `$${idParams.length}`;
  const idQuery = `SELECT f.id ${base}\nORDER BY f.marriage_year NULLS LAST, f.id\nLIMIT ${limitRef} OFFSET ${offsetRef}`;

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ n: bigint }>>(countQuery, ...countParams),
    prisma.$queryRawUnsafe<Array<{ id: string }>>(idQuery, ...idParams),
  ]);

  return { ids: idRows.map((r) => r.id), total: Number(countRows[0]?.n ?? 0) };
}

// ---------------------------------------------------------------------------
// Surname query
// ---------------------------------------------------------------------------
async function querySurnames(
  fileUuid: string,
  sp: URLSearchParams,
): Promise<{ rows: Array<{ id: string; surname: string; frequency: number }>; total: number }> {
  const q = sp.get("q")?.trim() ?? null;
  const nameField = sp.get("nameField") ?? "fullName";
  const matchType = sp.get("matchType") ?? "contains";

  if (!q || nameField === "givenName") return { rows: [], total: 0 };

  const qLower = q.toLowerCase();
  const parts = makeParts();
  where(parts, `s.file_uuid = ${qp(parts, fileUuid)}::uuid`);

  if (matchType === "soundex") {
    where(parts, soundexCond(parts, "s.surname_lower", qLower));
  } else if (matchType === "exact") {
    where(parts, `s.surname_lower = ${qp(parts, qLower)}`);
  } else {
    where(parts, `s.surname_lower ILIKE ${qp(parts, pct(qLower))}`);
  }

  const whereSql = buildWhere(parts);
  const base = `FROM gedcom_surnames_v2 s ${whereSql}`;
  const countParams = [...parts.params];
  const dataParams = [...parts.params, 20];
  const limitRef = `$${dataParams.length}`;

  const [countRows, dataRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ n: bigint }>>(`SELECT COUNT(*) AS n ${base}`, ...countParams),
    prisma.$queryRawUnsafe<Array<{ id: string; surname: string; frequency: number }>>(
      `SELECT s.id, s.surname, s.frequency ${base} ORDER BY s.frequency DESC NULLS LAST LIMIT ${limitRef}`,
      ...dataParams,
    ),
  ]);

  return {
    rows: dataRows.map(r => ({ id: r.id, surname: r.surname, frequency: Number(r.frequency) })),
    total: Number(countRows[0]?.n ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Given name query
// ---------------------------------------------------------------------------
async function queryGivenNames(
  fileUuid: string,
  sp: URLSearchParams,
): Promise<{ rows: Array<{ id: string; givenName: string; frequency: number }>; total: number }> {
  const q = sp.get("q")?.trim() ?? null;
  const nameField = sp.get("nameField") ?? "fullName";
  const matchType = sp.get("matchType") ?? "contains";

  if (!q || nameField === "surname") return { rows: [], total: 0 };

  const qLower = q.toLowerCase();
  const parts = makeParts();
  where(parts, `gn.file_uuid = ${qp(parts, fileUuid)}::uuid`);

  if (matchType === "soundex") {
    where(parts, soundexCond(parts, "gn.given_name_lower", qLower));
  } else if (matchType === "exact") {
    where(parts, `gn.given_name_lower = ${qp(parts, qLower)}`);
  } else {
    where(parts, `gn.given_name_lower ILIKE ${qp(parts, pct(qLower))}`);
  }

  const whereSql = buildWhere(parts);
  const base = `FROM gedcom_given_names_v2 gn ${whereSql}`;
  const countParams = [...parts.params];
  const dataParams = [...parts.params, 20];
  const limitRef = `$${dataParams.length}`;

  const [countRows, dataRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ n: bigint }>>(`SELECT COUNT(*) AS n ${base}`, ...countParams),
    prisma.$queryRawUnsafe<Array<{ id: string; given_name: string; frequency: number }>>(
      `SELECT gn.id, gn.given_name, gn.frequency ${base} ORDER BY gn.frequency DESC NULLS LAST LIMIT ${limitRef}`,
      ...dataParams,
    ),
  ]);

  return {
    rows: dataRows.map(r => ({ id: r.id, givenName: r.given_name, frequency: Number(r.frequency) })),
    total: Number(countRows[0]?.n ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Prisma select shapes
// ---------------------------------------------------------------------------
const INDIVIDUAL_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  sex: true,
  gender: true,
  isLiving: true,
  birthYear: true,
  deathYear: true,
  birthDateDisplay: true,
  deathDateDisplay: true,
  birthPlaceDisplay: true,
  deathPlaceDisplay: true,
  birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  deathPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
} as const;

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Born", DEAT: "Died", BURI: "Buried", CHR: "Christened",
  BAPM: "Baptised", CONF: "Confirmed", OCCU: "Occupation", RESI: "Residence",
  EMIG: "Emigrated", IMMI: "Immigrated", NATU: "Naturalized", CENS: "Census",
  GRAD: "Graduated", RETI: "Retired", WILL: "Will", PROB: "Probate",
  ORDN: "Ordained", ADOP: "Adopted", MARR: "Married", DIVO: "Divorced",
  EVEN: "Event",
};

const INDIVIDUAL_EVENT_SELECT = {
  individualId: true,
  event: {
    select: {
      eventType: true,
      eventLabel: true,
      customType: true,
      value: true,
      sortOrder: true,
      date: { select: { original: true, year: true } },
      place: { select: GEDCOM_PLACE_DISPLAY_SELECT },
    },
  },
} as const;

const PARTNER_SELECT = {
  id: true,
  fullName: true,
  birthYear: true,
  deathYear: true,
} as const;

const FAMILY_SELECT = {
  id: true,
  xref: true,
  husbandId: true,
  wifeId: true,
  childrenCount: true,
  marriageDateDisplay: true,
  marriagePlaceDisplay: true,
  marriageYear: true,
  isDivorced: true,
  marriagePlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
  husband: { select: PARTNER_SELECT },
  wife: { select: PARTNER_SELECT },
} as const;

// ---------------------------------------------------------------------------
// Row formatters
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatEvent(ev: any) {
  const type = ev.eventType as string;
  const custom = (ev.customType as string | null) || null;
  const label = (ev.eventLabel as string | null) || null;
  const displayLabel = type === "EVEN"
    ? (custom ?? (label && label !== "Event" ? label : null) ?? "Event")
    : (EVENT_TYPE_LABELS[type] ?? label ?? custom ?? type);
  return {
    eventType: type,
    label: displayLabel,
    dateDisplay: (ev.date?.original as string | null) ?? null,
    year: (ev.date?.year as number | null) ?? null,
    placeDisplay: fullPlaceLabelFromGedcomPlace(ev.place) ?? null,
    value: (ev.value as string | null) ?? null,
  };
}

type FormattedEvent = ReturnType<typeof formatEvent>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatIndividual(row: any, portraitSrc: string | null, events: FormattedEvent[]) {
  const sexMap: Record<string, string> = { M:"Male", F:"Female", U:"Unknown", X:"Other" };
  return {
    id: row.id as string,
    xref: row.xref as string,
    fullName: row.fullName as string | null,
    displayName: formatGedcomFullNameForDisplay(row.fullName),
    portraitSrc,
    birthYear: row.birthYear as number | null,
    deathYear: row.deathYear as number | null,
    sex: row.sex as string | null,
    gender: row.sex ? (sexMap[row.sex as string] ?? row.sex) : (row.gender as string | null),
    isLiving: row.isLiving as boolean,
    profileHref: `/individuals/${encodeURIComponent(row.id)}`,
    events,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPartner(p: any | null) {
  if (!p) return null;
  return {
    id: p.id as string,
    fullName: p.fullName as string | null,
    displayName: formatGedcomFullNameForDisplay(p.fullName),
    birthYear: p.birthYear as number | null,
    deathYear: p.deathYear as number | null,
    profileHref: `/individuals/${encodeURIComponent(p.id)}`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatFamily(row: any) {
  const partner1 = formatPartner(row.husband ?? null);
  const partner2 = formatPartner(row.wife ?? null);
  const names = [partner1?.displayName, partner2?.displayName].filter(Boolean);
  const title = names.length > 0 ? names.join(" & ") : "Unknown Family";
  const marriagePlace =
    fullPlaceLabelFromGedcomPlace(row.marriagePlace) ?? (row.marriagePlaceDisplay?.trim() || null);
  return {
    id: row.id as string,
    xref: row.xref as string,
    title,
    partner1,
    partner2,
    childrenCount: row.childrenCount as number,
    unionDateDisplay: row.marriageDateDisplay as string | null,
    unionYear: row.marriageYear as number | null,
    unionPlace: marriagePlace,
    isDivorced: row.isDivorced as boolean,
    profileHref: `/families/${encodeURIComponent(row.id)}`,
  };
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
    const scope = sp.get("scope") ?? "both"; // individuals | families | both
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10) || 20));
    const offset = Math.max(0, parseInt(sp.get("offset") ?? "0", 10) || 0);

    const includeIndividuals = scope === "individuals" || scope === "both";
    const includeFamilies = scope === "families" || scope === "both";

    const [indResult, famResult, surnameResult, givenNameResult] = await Promise.all([
      includeIndividuals
        ? queryIndividuals(fileUuid, sp, limit, offset)
        : Promise.resolve({ ids: [], total: 0 }),
      includeFamilies
        ? queryFamilies(fileUuid, sp, limit, offset)
        : Promise.resolve({ ids: [], total: 0 }),
      querySurnames(fileUuid, sp),
      queryGivenNames(fileUuid, sp),
    ]);

    const [indRows, famRows, indEventRows] = await Promise.all([
      indResult.ids.length > 0
        ? prisma.gedcomIndividual.findMany({ where: { id: { in: indResult.ids } }, select: INDIVIDUAL_SELECT })
        : Promise.resolve([]),
      famResult.ids.length > 0
        ? prisma.gedcomFamily.findMany({ where: { id: { in: famResult.ids } }, select: FAMILY_SELECT })
        : Promise.resolve([]),
      indResult.ids.length > 0
        ? prisma.gedcomIndividualEvent.findMany({
            where: { individualId: { in: indResult.ids } },
            select: INDIVIDUAL_EVENT_SELECT,
          })
        : Promise.resolve([]),
    ]);

    const photoMap = indResult.ids.length > 0
      ? await batchIndividualDisplayPhotoMedia(prisma, fileUuid, indResult.ids)
      : new Map<string, { id: string; title: string | null; fileRef: string; form: string | null }>();

    // Group events by individual, sorted chronologically
    const eventsMap = new Map<string, FormattedEvent[]>();
    for (const row of indEventRows) {
      const arr = eventsMap.get(row.individualId) ?? [];
      arr.push(formatEvent(row.event));
      eventsMap.set(row.individualId, arr);
    }
    for (const [id, evs] of eventsMap) {
      eventsMap.set(id, evs.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999)));
    }

    const indOrder = new Map(indResult.ids.map((id, i) => [id, i]));
    const famOrder = new Map(famResult.ids.map((id, i) => [id, i]));

    const individuals = [...indRows]
      .sort((a, b) => (indOrder.get(a.id) ?? 0) - (indOrder.get(b.id) ?? 0))
      .map((row) => formatIndividual(
        row,
        individualDisplayPhotoMediaToPublicUrl(photoMap.get(row.id)),
        eventsMap.get(row.id) ?? [],
      ));
    const families = [...famRows]
      .sort((a, b) => (famOrder.get(a.id) ?? 0) - (famOrder.get(b.id) ?? 0))
      .map(formatFamily);

    return NextResponse.json({
      individuals,
      families,
      totalIndividuals: indResult.total,
      totalFamilies: famResult.total,
      hasMoreIndividuals: offset + individuals.length < indResult.total,
      hasMoreFamilies: offset + families.length < famResult.total,
      surnames: surnameResult.rows,
      givenNames: givenNameResult.rows,
      totalSurnames: surnameResult.total,
      totalGivenNames: givenNameResult.total,
      limit,
      offset,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
