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
