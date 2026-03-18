export const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Birth",
  DEAT: "Death",
  MARR: "Marriage",
  DIV: "Divorce",
};

export function stripSlashesFromName(s: string | null | undefined): string {
  if (s == null || s === "") return "Unknown";
  const t = s.replace(/\//g, "").trim();
  return t === "" ? "Unknown" : t;
}

/** Return xref for display, without leading/trailing @ (e.g. @I123@ → I123). */
export function displayXref(xref: string | null | undefined): string {
  if (xref == null || typeof xref !== "string") return "";
  return xref.replace(/^@+|@+$/g, "").trim() || xref;
}

export function splitDisplayName(displayName: string): { first: string; last: string } {
  const trimmed = displayName.trim();
  if (!trimmed) return { first: "", last: "Unknown" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0]! };
  const last = parts.pop() ?? "";
  return { first: parts.join(" "), last };
}

const TREE_VIEWER_PATH = "/tree/viewer";

export function personRootHref(xref: string, displayName: string | null): string {
  const params = new URLSearchParams({
    root: xref,
    loadSavedHistory: "true",
    rootName: (displayName ?? xref).trim() || xref,
  });
  return `${TREE_VIEWER_PATH}?${params.toString()}`;
}

/** Href to open tree viewer with this person as root and optional chart type (pedigree, descendancy, fan). */
export function personChartHref(
  xref: string,
  displayName: string | null,
  chart?: "pedigree" | "descendancy" | "fan"
): string {
  const params = new URLSearchParams({
    root: xref,
    loadSavedHistory: "true",
    rootName: (displayName ?? xref).trim() || xref,
  });
  if (chart) params.set("chart", chart);
  return `${TREE_VIEWER_PATH}?${params.toString()}`;
}

const TREE_PERSON_PATH = "/tree/person";

/** Href to the full profile page for this person (dedicated profile route). */
export function fullProfileHref(xref: string): string {
  return `${TREE_PERSON_PATH}/${encodeURIComponent(xref)}`;
}

const MAX_AGE_ASSUMING_LIVING = 120;
const MAX_LIFESPAN_YEARS = 120;

/** Extract a 4-digit year from a date display string (e.g. "15 Jan 1900", "1900", "Jan 1900"). */
function extractYear(dateStr: string | null | undefined): number | null {
  if (dateStr == null || dateStr.trim() === "") return null;
  const match = dateStr.trim().match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]!, 10) : null;
}

/**
 * Earliest year (inclusive) that counts as during the person's lifetime (year of birth).
 * Returns null if we cannot determine — caller may then not filter by start.
 */
export function getLifetimeStartYear(birthDate: string | null | undefined): number | null {
  return extractYear(birthDate);
}

/**
 * Latest year (inclusive) that counts as during the person's lifetime.
 * If death date is known, that year. If not, birth year + MAX_LIFESPAN_YEARS.
 * Returns null if we cannot determine (e.g. no birth date) — caller may then not filter.
 */
export function getLifetimeEndYear(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined
): number | null {
  const birthYear = extractYear(birthDate);
  if (birthYear == null) return null;
  const deathYear = extractYear(deathDate);
  if (deathYear != null) return deathYear;
  return birthYear + MAX_LIFESPAN_YEARS;
}

/** Optional year/month/day for precise age (birthday-not-yet-occurred) calculation. Month and day are 1-based. */
export interface DateYMD {
  year: number | null;
  month: number | null;
  day: number | null;
}

/**
 * Compute display age from birth and optional death date.
 * When birthYMD and end (deathYMD or today) have month/day, age is reduced by 1 if the birthday has not yet occurred in the end year.
 * Returns null if no birth date; "?" if no death date but would be over MAX_AGE_ASSUMING_LIVING (assumed dead);
 * otherwise a formatted string: "X years", "X months", "X weeks", or "0 weeks" (for &lt; 1 week).
 */
export function computedAge(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined,
  living: boolean,
  birthYMD?: DateYMD | null,
  deathYMD?: DateYMD | null
): string | null {
  const birthYear = birthYMD?.year ?? extractYear(birthDate);
  if (birthYear == null) return null;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const endYear = deathYMD?.year ?? extractYear(deathDate) ?? currentYear;
  const endMonth = deathYMD?.month ?? (endYear === currentYear ? currentMonth : 12);
  const endDay = deathYMD?.day ?? (endYear === currentYear ? currentDay : 31);
  let ageYears = endYear - birthYear;
  if (ageYears < 0) return null;
  const birthMonth = birthYMD?.month ?? null;
  const birthDay = birthYMD?.day ?? null;
  if (birthMonth != null && birthDay != null && ageYears > 0) {
    if (endMonth < birthMonth || (endMonth === birthMonth && endDay < birthDay)) {
      ageYears -= 1;
    }
  }
  if (deathDate == null || (deathDate.trim?.() ?? "") === "") {
    if (!living) return "?";
    if (ageYears > MAX_AGE_ASSUMING_LIVING) return "?";
  }

  if (ageYears >= 1) {
    return `${ageYears} ${ageYears === 1 ? "year" : "years"}`;
  }

  const by = birthYear;
  const bm = birthMonth ?? 1;
  const bd = birthDay ?? 1;
  const ey = endYear;
  const em = endMonth;
  const ed = endDay;
  const startDate = new Date(by, bm - 1, bd);
  const endDate = new Date(ey, em - 1, ed);
  const days = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

  if (days < 7) {
    return "0 weeks";
  }
  const fullMonths =
    (ey - by) * 12 + (em - bm) + (ed >= bd ? 0 : -1);
  if (fullMonths >= 1) {
    return `${fullMonths} ${fullMonths === 1 ? "month" : "months"}`;
  }
  const weeks = Math.floor(days / 7);
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}
