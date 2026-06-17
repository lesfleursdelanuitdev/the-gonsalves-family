/**
 * Payload when the fan chart per-cell “more” chip is activated (opens FanPersonPeekModal).
 */
export type FanMoreClickPayload = {
  /** DescendancyPerson.id — use with `dispatch({ type: "ROOT", personId })`. */
  personId: string;
  name: string;
  xref: string;
  uuid: string | null;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  /** Full place line as from the tree API (city, region, country — not truncated). */
  birthPlace?: string | null;
  deathPlace?: string | null;
  gender?: string | null;
  isLiving?: boolean;
  /** True when pedigree API listed this xref in `multiFamilyChildXrefs` (child in multiple families). */
  hasMultipleFamiliesAsChild?: boolean;
};
