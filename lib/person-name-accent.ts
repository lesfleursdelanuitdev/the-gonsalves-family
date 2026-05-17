/** Soft underline colors for names (by sex / GEDCOM SEX) — matches PersonNode cards. */

const NAME_BG_MALE = "#AAD7ED";
const NAME_BG_FEMALE = "#F8BBD0";
const NAME_BG_OTHER = "#C8E6C9";

export const NAME_UNDERLINE_PX = 3;

/** Resolve sex for name underline — supports API labels and GEDCOM letters (case-insensitive). */
export function getNameBackgroundColor(gender: string | null | undefined): string {
  if (gender == null) return NAME_BG_OTHER;
  const raw = `${gender}`.trim();
  if (!raw) return NAME_BG_OTHER;

  const candidates = [
    raw.toUpperCase().replace(/\s+/g, ""),
    ...raw.toUpperCase().split(/\s+/).map((part) => part.replace(/[^A-Z]/g, "")),
  ];

  for (const normalized of candidates) {
    if (!normalized) continue;
    if (normalized === "MALE" || normalized === "M") return NAME_BG_MALE;
    if (normalized === "FEMALE" || normalized === "F") return NAME_BG_FEMALE;
  }

  return NAME_BG_OTHER;
}
