const MONTH_INDEX: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

export type DisplayDateParts = {
  year: number;
  month: number;
  day: number;
};

export type PersonAgeInput = {
  birthDateLabel: string | null;
  birthYear: number | null;
  deathDateLabel: string | null;
  deathYear: number | null;
};

/** Parse GEDCOM-style display dates such as `15 MAR 1994`, `1994`, or `1994-03-15`. */
export function parseDisplayDateParts(dateLabel: string | null | undefined): DisplayDateParts | null {
  const raw = (dateLabel ?? "").trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
  }

  const upper = raw.toUpperCase();
  const parts = upper.split(/\s+/).filter(Boolean);
  const yearPart = parts.find((part) => /^\d{4}$/.test(part));
  if (!yearPart) return null;

  const monthPart = parts.find((part) => MONTH_INDEX[part.slice(0, 3)] != null);
  const dayPart = parts.find((part) => /^\d{1,2}$/.test(part) && part !== yearPart);

  return {
    year: Number(yearPart),
    month: monthPart ? MONTH_INDEX[monthPart.slice(0, 3)] : 0,
    day: dayPart ? Number(dayPart) : 0,
  };
}

function datePrecision(parts: DisplayDateParts): "year" | "month" | "day" {
  if (parts.month > 0 && parts.day > 0) return "day";
  if (parts.month > 0) return "month";
  return "year";
}

function toLocalDate(parts: DisplayDateParts): Date {
  const month = parts.month > 0 ? parts.month : 1;
  const day = parts.day > 0 ? parts.day : 1;
  return new Date(parts.year, month - 1, day);
}

export function ageBetweenDates(start: Date, end: Date): { years: number; months: number; days: number } {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

function formatAgeDuration(
  duration: { years: number; months: number; days: number },
  precision: "year" | "month" | "day",
): string {
  if (precision === "year") {
    return duration.years === 1 ? "1 year" : `${duration.years} years`;
  }

  const segments: string[] = [];
  if (duration.years > 0) {
    segments.push(duration.years === 1 ? "1 year" : `${duration.years} years`);
  }
  if (duration.months > 0) {
    segments.push(duration.months === 1 ? "1 month" : `${duration.months} months`);
  }
  if (precision === "day" && duration.days > 0) {
    segments.push(duration.days === 1 ? "1 day" : `${duration.days} days`);
  }
  if (segments.length === 0) return "0 days";
  return segments.join(", ");
}

function yearOnlyAge(birthYear: number, endYear: number): string {
  const years = Math.max(0, endYear - birthYear);
  return years === 1 ? "1 year" : `${years} years`;
}

/** Whole years for list cards and filters; uses month/day when birth (or death) dates include them. */
export function personAgeYears(
  person: PersonAgeInput,
  referenceDate: Date = new Date(),
): number | null {
  const birthParts =
    parseDisplayDateParts(person.birthDateLabel) ??
    (person.birthYear != null ? { year: person.birthYear, month: 0, day: 0 } : null);
  if (!birthParts) return null;

  const endParts =
    parseDisplayDateParts(person.deathDateLabel) ??
    (person.deathYear != null ? { year: person.deathYear, month: 0, day: 0 } : null);
  const endDate = endParts ? toLocalDate(endParts) : referenceDate;

  const birthPrecision = datePrecision(birthParts);
  const endPrecision = endParts ? datePrecision(endParts) : "day";

  if (birthPrecision === "year" && (!endParts || endPrecision === "year")) {
    const endYear = endParts?.year ?? referenceDate.getFullYear();
    return Math.max(0, endYear - birthParts.year);
  }

  return ageBetweenDates(toLocalDate(birthParts), endDate).years;
}

/** Human-readable age using month/day when birth (and death) dates include them. */
export function formatPersonAgeLabel(
  person: PersonAgeInput,
  referenceDate: Date = new Date(),
): string | null {
  const birthParts =
    parseDisplayDateParts(person.birthDateLabel) ??
    (person.birthYear != null ? { year: person.birthYear, month: 0, day: 0 } : null);
  if (!birthParts) return null;

  const endParts =
    parseDisplayDateParts(person.deathDateLabel) ??
    (person.deathYear != null ? { year: person.deathYear, month: 0, day: 0 } : null);
  const endDate = endParts ? toLocalDate(endParts) : referenceDate;

  const birthPrecision = datePrecision(birthParts);
  const endPrecision = endParts ? datePrecision(endParts) : "day";

  if (birthPrecision === "year" && (!endParts || endPrecision === "year")) {
    const endYear = endParts?.year ?? referenceDate.getFullYear();
    return yearOnlyAge(birthParts.year, endYear);
  }

  const precision =
    birthPrecision === "day" && (!endParts || endPrecision === "day")
      ? "day"
      : birthPrecision === "year" && endPrecision === "year"
        ? "year"
        : "month";

  const duration = ageBetweenDates(toLocalDate(birthParts), endDate);
  return formatAgeDuration(duration, precision);
}
