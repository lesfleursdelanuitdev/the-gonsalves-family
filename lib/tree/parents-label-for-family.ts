/**
 * Header label for the "parents" block in **families as child** UI, from
 * `gedcom_parent_child_v2.pedigree` (GEDCOM PEDI) and `relationship_type`.
 */

export type ParentChildPedigreeRow = {
  relationshipType: string | null;
  pedigree: string | null;
};

type RelationshipCategory = "birth" | "adopted" | "foster" | "step" | "sealing";

function categorizeRow(row: ParentChildPedigreeRow): RelationshipCategory {
  const ped = (row.pedigree ?? "").trim().toLowerCase();
  if (ped === "adoptive" || ped === "adopted") return "adopted";
  if (ped === "foster") return "foster";
  if (ped === "step") return "step";
  if (ped === "sealing") return "sealing";
  if (ped === "birth" || ped === "biological") return "birth";

  const rt = (row.relationshipType ?? "biological").trim().toLowerCase();
  if (rt === "adopted") return "adopted";
  if (rt === "foster") return "foster";
  if (rt === "step") return "step";
  if (rt === "sealing") return "sealing";
  if (rt === "birth" || rt === "biological") return "birth";
  return "birth";
}

function labelForCategory(c: RelationshipCategory): string {
  switch (c) {
    case "birth":
      return "Parents (birth)";
    case "adopted":
      return "Parents (adopted)";
    case "foster":
      return "Parents (foster)";
    case "step":
      return "Parents (step)";
    case "sealing":
      return "Parents (sealing)";
    default:
      return "Parents";
  }
}

/**
 * When both parent–child rows agree on the same category, return a specific
 * "Parents (…)" label; when they disagree or there are no rows, return plain "Parents".
 */
export function parentsHeaderLabelFromPedigreeRows(rows: ParentChildPedigreeRow[]): string {
  if (rows.length === 0) return "Parents";
  const categories = new Set(rows.map(categorizeRow));
  if (categories.size !== 1) return "Parents";
  return labelForCategory([...categories][0]!);
}

/** Parent–child row including `family_id` (sibling-view / API use). */
export type ParentChildFamilyRow = ParentChildPedigreeRow & {
  familyId: string | null;
};

/**
 * Chooses `gedcom_family` id for the child's **birth** household: every parent–child
 * row in that family must categorize as birth/biological (same rules as the parents UI).
 * If none qualify, returns the first non-null `familyId` in row order (legacy fallback).
 */
export function selectBirthFamilyIdForChild(rows: ParentChildFamilyRow[]): string | null {
  const byFam = new Map<string, ParentChildPedigreeRow[]>();
  let firstFamilyId: string | null = null;
  for (const r of rows) {
    if (!r.familyId) continue;
    if (firstFamilyId === null) firstFamilyId = r.familyId;
    const list = byFam.get(r.familyId) ?? [];
    list.push({ pedigree: r.pedigree, relationshipType: r.relationshipType });
    byFam.set(r.familyId, list);
  }
  const birthCandidates: string[] = [];
  for (const [famId, prs] of byFam) {
    const cats = new Set(prs.map(categorizeRow));
    if (cats.size === 1 && cats.has("birth")) birthCandidates.push(famId);
  }
  if (birthCandidates.length > 0) {
    birthCandidates.sort();
    return birthCandidates[0]!;
  }
  return firstFamilyId;
}

/**
 * Union child `pedi` for chart APIs and toasts: `"birth"` only when every parent–child
 * row for that child in that family is birth-like; otherwise `"adopted"` (includes foster,
 * sealing, step, mixed, or unanimous non-birth).
 */
export function chartPediBirthOrAdopted(rows: ParentChildPedigreeRow[]): "birth" | "adopted" {
  if (rows.length === 0) return "birth";
  const cats = new Set(rows.map(categorizeRow));
  if (cats.size === 1 && cats.has("birth")) return "birth";
  return "adopted";
}

export type ParentChildRowForChartPedi = {
  familyId: string | null;
  childId: string;
  pedigree: string | null;
  relationshipType: string | null;
};

/** Map key `${familyId}\t${childId}` (UUIDs) → chart pedi for union `children[]` payloads. */
export function chartPediByFamilyAndChildId(rows: ParentChildRowForChartPedi[]): Map<string, "birth" | "adopted"> {
  const byKey = new Map<string, ParentChildPedigreeRow[]>();
  for (const r of rows) {
    if (!r.familyId) continue;
    const key = `${r.familyId}\t${r.childId}`;
    const list = byKey.get(key) ?? [];
    list.push({ pedigree: r.pedigree, relationshipType: r.relationshipType });
    byKey.set(key, list);
  }
  const out = new Map<string, "birth" | "adopted">();
  for (const [k, list] of byKey) {
    out.set(k, chartPediBirthOrAdopted(list));
  }
  return out;
}
