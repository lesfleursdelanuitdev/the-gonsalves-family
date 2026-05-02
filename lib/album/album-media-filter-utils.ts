import type { AlbumMediaLinkedDate, AlbumMediaLinkedPlace, AlbumMediaLinkedTag, MediaSummary } from "@ligneous/album-view";

export type AlbumMediaDateRangeFilter = {
  from?: string;
  to?: string;
  includeUnknown?: boolean;
};

export type LinkedPlaceWithCount = AlbumMediaLinkedPlace & { mediaCount: number };
export type LinkedTagWithCount = AlbumMediaLinkedTag & { mediaCount: number };

export function formatAlbumLinkedPlaceLabel(p: AlbumMediaLinkedPlace): string {
  const structured = [p.name, p.county, p.state, p.country]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(", ");
  const orig = (p.original ?? "").trim();
  if (structured && orig && orig !== structured) return `${structured} - ${orig}`;
  return structured || orig || "Unknown place";
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Start of day UTC (inclusive) for partial GEDCOM-style inputs: YYYY, YYYY-MM, YYYY-MM-DD. */
export function parsePartialDateStartUtc(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const m3 = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const m2 = /^(\d{4})-(\d{1,2})$/.exec(t);
  const m1 = /^(\d{4})$/.exec(t);
  let y: number;
  let mo = 1;
  let d = 1;
  if (m3) {
    y = Number(m3[1]);
    mo = Number(m3[2]);
    d = Number(m3[3]);
  } else if (m2) {
    y = Number(m2[1]);
    mo = Number(m2[2]);
  } else if (m1) {
    y = Number(m1[1]);
  } else return null;
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, mo - 1, d, 12, 0, 0);
  return Number.isNaN(ms) ? null : ms;
}

/** End of period UTC (inclusive) for partial inputs. */
export function parsePartialDateEndUtc(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const m3 = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const m2 = /^(\d{4})-(\d{1,2})$/.exec(t);
  const m1 = /^(\d{4})$/.exec(t);
  let y: number;
  let mo = 12;
  let d = 31;
  if (m3) {
    y = Number(m3[1]);
    mo = Number(m3[2]);
    d = Number(m3[3]);
    const ms = Date.UTC(y, mo - 1, d, 12, 0, 0);
    return Number.isNaN(ms) ? null : ms;
  }
  if (m2) {
    y = Number(m2[1]);
    mo = Number(m2[2]);
    d = lastDayOfMonth(y, mo);
  } else if (m1) {
    y = Number(m1[1]);
    mo = 12;
    d = 31;
  } else return null;
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, mo - 1, d, 12, 0, 0);
  return Number.isNaN(ms) ? null : ms;
}

function linkedDateWindow(d: AlbumMediaLinkedDate): { start: number; end: number } | null {
  if (d.year == null) return null;
  const sy = d.year;
  const sm = d.month ?? 1;
  const sd = d.day ?? 1;
  const ey = d.endYear ?? d.year;
  const em = d.endMonth ?? d.month ?? 12;
  const edRaw = d.endDay ?? d.day ?? lastDayOfMonth(ey, em);
  const ed = Math.min(edRaw, lastDayOfMonth(ey, em));
  const a = Date.UTC(sy, sm - 1, sd, 12, 0, 0);
  const b = Date.UTC(ey, em - 1, ed, 12, 0, 0);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export function mediaHasUnknownLinkedDates(m: MediaSummary): boolean {
  const dates = m.linkedDates ?? [];
  if (dates.length === 0) return true;
  return dates.some((d) => d.year == null);
}

function mediaOverlapsDateRange(m: MediaSummary, fromMs: number, toMs: number): boolean {
  const dates = m.linkedDates ?? [];
  for (const d of dates) {
    const w = linkedDateWindow(d);
    if (!w) continue;
    if (w.start <= toMs && fromMs <= w.end) return true;
  }
  return false;
}

export function mediaMatchesDateRangeFilter(m: MediaSummary, f: AlbumMediaDateRangeFilter): boolean {
  const fromS = (f.from ?? "").trim();
  const toS = (f.to ?? "").trim();
  const hasRange = Boolean(fromS || toS);
  const unk = f.includeUnknown === true;

  if (!hasRange && !unk) return true;

  const unknownOk = unk && mediaHasUnknownLinkedDates(m);
  if (!hasRange) return unknownOk;

  const fromMs = fromS ? parsePartialDateStartUtc(fromS) : null;
  const toMs = toS ? parsePartialDateEndUtc(toS) : null;
  if (fromS && fromMs == null) return false;
  if (toS && toMs == null) return false;

  const lo = fromMs ?? -8.64e15;
  const hi = toMs ?? 8.64e15;
  if (lo > hi) return false;

  const rangeOk = mediaOverlapsDateRange(m, lo, hi);
  if (unk) return rangeOk || unknownOk;
  return rangeOk;
}

export function buildPlacesWithCounts(
  items: MediaSummary[],
  catalog: AlbumMediaLinkedPlace[] | undefined,
): LinkedPlaceWithCount[] {
  const cat = catalog ?? [];
  const counts = new Map<string, number>();
  for (const m of items) {
    for (const p of m.linkedPlaces ?? []) {
      counts.set(p.id, (counts.get(p.id) ?? 0) + 1);
    }
  }
  return cat
    .filter((p) => (counts.get(p.id) ?? 0) > 0)
    .map((p) => ({ ...p, mediaCount: counts.get(p.id)! }))
    .sort((a, b) => formatAlbumLinkedPlaceLabel(a).localeCompare(formatAlbumLinkedPlaceLabel(b), undefined, { sensitivity: "base" }));
}

export function buildTagsWithCounts(items: MediaSummary[]): LinkedTagWithCount[] {
  const map = new Map<string, { id: string; name: string; mediaCount: number }>();
  for (const m of items) {
    for (const t of m.linkedTags ?? []) {
      const cur = map.get(t.id);
      if (cur) cur.mediaCount += 1;
      else map.set(t.id, { id: t.id, name: t.name, mediaCount: 1 });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function summarizeDateRangeFilter(f: AlbumMediaDateRangeFilter): string {
  const fromS = (f.from ?? "").trim();
  const toS = (f.to ?? "").trim();
  const unk = f.includeUnknown === true;
  if (fromS && toS) {
    const a = formatShortChipDate(fromS);
    const b = formatShortChipDate(toS);
    return `${a}–${b}`;
  }
  if (fromS) return `From ${formatShortChipDate(fromS)}`;
  if (toS) return `To ${formatShortChipDate(toS)}`;
  if (unk) return "Unknown date";
  return "No date selected";
}

function formatShortChipDate(s: string): string {
  const t = s.trim();
  const m3 = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m3) {
    const d = new Date(Date.UTC(Number(m3[1]), Number(m3[2]) - 1, Number(m3[3]), 12, 0, 0));
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", day: "numeric" }).format(d);
  }
  const m2 = /^(\d{4})-(\d{1,2})$/.exec(t);
  if (m2) {
    const d = new Date(Date.UTC(Number(m2[1]), Number(m2[2]) - 1, 1, 12, 0, 0));
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(d);
  }
  const m1 = /^(\d{4})$/.exec(t);
  if (m1) return m1[1];
  return t;
}

export function dateRangeFilterIsActive(f: AlbumMediaDateRangeFilter): boolean {
  return Boolean((f.from ?? "").trim() || (f.to ?? "").trim() || f.includeUnknown === true);
}
