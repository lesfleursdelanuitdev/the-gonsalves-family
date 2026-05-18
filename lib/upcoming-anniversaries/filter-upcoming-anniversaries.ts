import type { GenderFilter, LifeStatusFilter } from "@/components/individuals/IndividualsFilterPanel";
import { personLifeStatus } from "@/lib/individuals/person-life-status";
import type { PublicIndividual } from "@/components/individuals/types";
import type {
  UpcomingAnniversaryItem,
  UpcomingAnniversaryMonthGroup,
} from "./group-upcoming-anniversaries";

export type AvailableAnniversaryMonth = {
  month: number;
  label: string;
};

export type AvailableAnniversaryDay = {
  key: string;
  month: number;
  day: number;
  label: string;
  monthLabel: string;
};

export type UpcomingAnniversariesFilterState = {
  birthdays: boolean;
  deathAnniversaries: boolean;
  marriageAnniversaries: boolean;
  /** Applies to birthday and death-anniversary person cards only. */
  lifeStatus: LifeStatusFilter;
  /** Applies to birthday and death-anniversary person cards only. */
  gender: GenderFilter;
  /** Month numbers (1–12) in the upcoming window to include. */
  enabledMonths: number[];
  /** `${month}-${day}` keys for calendar days in the upcoming window. */
  enabledDays: string[];
};

export function anniversaryDayKey(month: number, day: number): string {
  return `${month}-${day}`;
}

export function listAvailableAnniversaryMonths(
  monthGroups: UpcomingAnniversaryMonthGroup[],
): AvailableAnniversaryMonth[] {
  return monthGroups.map((group) => ({ month: group.month, label: group.monthLabel }));
}

export function listAvailableAnniversaryDays(
  monthGroups: UpcomingAnniversaryMonthGroup[],
): AvailableAnniversaryDay[] {
  const byKey = new Map<string, AvailableAnniversaryDay>();

  for (const group of monthGroups) {
    for (const section of group.sections) {
      for (const item of section.items) {
        if (item.calendarDay == null) continue;
        const key = anniversaryDayKey(item.calendarMonth, item.calendarDay);
        if (byKey.has(key)) continue;
        byKey.set(key, {
          key,
          month: item.calendarMonth,
          day: item.calendarDay,
          label: item.calendarDayLabel,
          monthLabel: group.monthLabel,
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) => a.month * 32 + a.day - (b.month * 32 + b.day));
}

export function createUpcomingAnniversariesFilters(
  availableMonths: number[],
  availableDays: string[],
): UpcomingAnniversariesFilterState {
  return {
    birthdays: true,
    deathAnniversaries: true,
    marriageAnniversaries: true,
    lifeStatus: "all",
    gender: "all",
    enabledMonths: [...availableMonths],
    enabledDays: [...availableDays],
  };
}

function personGenderBucket(person: PublicIndividual): Exclude<GenderFilter, "all"> {
  const value = `${person.gender ?? ""} ${person.sex ?? ""}`.trim().toLowerCase();
  if (value === "f" || value.includes("female")) return "female";
  if (value === "m" || value.includes("male")) return "male";
  return "unknown";
}

export function upcomingAnniversarySearchText(item: UpcomingAnniversaryItem): string {
  if (item.kind === "person") return item.person.fullName;
  return item.family.title;
}

function matchesEventType(item: UpcomingAnniversaryItem, filters: UpcomingAnniversariesFilterState): boolean {
  if (item.eventType === "BIRT") return filters.birthdays;
  if (item.eventType === "DEAT") return filters.deathAnniversaries;
  return filters.marriageAnniversaries;
}

/** Marriage anniversaries are not filtered by living/dead. */
function matchesLifeStatus(item: UpcomingAnniversaryItem, filters: UpcomingAnniversariesFilterState): boolean {
  if (filters.lifeStatus === "all") return true;
  if (item.kind !== "person") return true;
  const status = personLifeStatus(item.person);
  if (filters.lifeStatus === "living") return status === "living";
  return status === "dead";
}

function matchesGender(item: UpcomingAnniversaryItem, filters: UpcomingAnniversariesFilterState): boolean {
  if (filters.gender === "all") return true;
  if (item.kind !== "person") return true;
  return personGenderBucket(item.person) === filters.gender;
}

function matchesDay(item: UpcomingAnniversaryItem, filters: UpcomingAnniversariesFilterState): boolean {
  if (item.calendarDay == null) return true;
  const key = anniversaryDayKey(item.calendarMonth, item.calendarDay);
  return filters.enabledDays.includes(key);
}

export function matchesUpcomingAnniversaryFilters(
  item: UpcomingAnniversaryItem,
  searchQuery: string,
  filters: UpcomingAnniversariesFilterState,
): boolean {
  const q = searchQuery.trim().toLowerCase();
  if (q && !upcomingAnniversarySearchText(item).toLowerCase().includes(q)) return false;
  if (!matchesEventType(item, filters)) return false;
  if (!matchesLifeStatus(item, filters)) return false;
  if (!matchesGender(item, filters)) return false;
  if (!matchesDay(item, filters)) return false;
  return true;
}

export function isAllMonthsSelected(
  filters: UpcomingAnniversariesFilterState,
  availableMonths: number[],
): boolean {
  if (availableMonths.length === 0) return true;
  const enabled = new Set(filters.enabledMonths);
  return availableMonths.length === enabled.size && availableMonths.every((month) => enabled.has(month));
}

export function isAllDaysSelected(
  filters: UpcomingAnniversariesFilterState,
  availableDays: string[],
): boolean {
  if (availableDays.length === 0) return true;
  const enabled = new Set(filters.enabledDays);
  return availableDays.length === enabled.size && availableDays.every((key) => enabled.has(key));
}

export function filterUpcomingAnniversaryMonthGroups(
  monthGroups: UpcomingAnniversaryMonthGroup[],
  searchQuery: string,
  filters: UpcomingAnniversariesFilterState,
): { monthGroups: UpcomingAnniversaryMonthGroup[]; totalCount: number } {
  const enabledMonths = new Set(filters.enabledMonths);
  let totalCount = 0;
  const filtered = monthGroups
    .filter((group) => enabledMonths.has(group.month))
    .map((group) => {
      const sections = group.sections
        .map((section) => {
          const items = section.items.filter((item) =>
            matchesUpcomingAnniversaryFilters(item, searchQuery, filters),
          );
          totalCount += items.length;
          return { ...section, items };
        })
        .filter((section) => section.items.length > 0);
      return { ...group, sections };
    })
    .filter((group) => group.sections.length > 0);

  return { monthGroups: filtered, totalCount };
}

export function hasActiveUpcomingAnniversariesFilters(
  filters: UpcomingAnniversariesFilterState,
  availableMonths: number[],
  availableDays: string[],
): boolean {
  return (
    !filters.birthdays ||
    !filters.deathAnniversaries ||
    !filters.marriageAnniversaries ||
    filters.lifeStatus !== "all" ||
    filters.gender !== "all" ||
    !isAllMonthsSelected(filters, availableMonths) ||
    !isAllDaysSelected(filters, availableDays)
  );
}

function activeFilterCount(
  filters: UpcomingAnniversariesFilterState,
  availableMonths: number[],
  availableDays: string[],
): number {
  let count = 0;
  if (!filters.birthdays) count++;
  if (!filters.deathAnniversaries) count++;
  if (!filters.marriageAnniversaries) count++;
  if (filters.lifeStatus !== "all") count++;
  if (filters.gender !== "all") count++;
  if (!isAllMonthsSelected(filters, availableMonths)) count++;
  if (!isAllDaysSelected(filters, availableDays)) count++;
  return count;
}

export function buildUpcomingAnniversariesFilterButtonLabel(
  filters: UpcomingAnniversariesFilterState,
  availableMonths: number[],
  availableDays: string[],
): string {
  const count = activeFilterCount(filters, availableMonths, availableDays);
  return count === 0 ? "Filter anniversaries" : `${count} filter${count === 1 ? "" : "s"} active`;
}

export function occasionTypesSummary(filters: UpcomingAnniversariesFilterState): string {
  const parts: string[] = [];
  if (filters.birthdays) parts.push("Birthdays");
  if (filters.deathAnniversaries) parts.push("Death anniversaries");
  if (filters.marriageAnniversaries) parts.push("Marriage anniversaries");
  if (parts.length === 0) return "No occasion types";
  if (parts.length === 3) return "All occasion types";
  return parts.join(" · ");
}

export function monthsSummary(
  filters: UpcomingAnniversariesFilterState,
  availableMonths: AvailableAnniversaryMonth[],
): string {
  if (availableMonths.length === 0) return "No months";
  if (isAllMonthsSelected(filters, availableMonths.map((m) => m.month))) return "All months";

  const enabled = new Set(filters.enabledMonths);
  const labels = availableMonths.filter((m) => enabled.has(m.month)).map((m) => m.label);
  if (labels.length === 0) return "No months selected";
  return labels.join(" · ");
}

export function daysSummary(
  filters: UpcomingAnniversariesFilterState,
  availableDays: AvailableAnniversaryDay[],
): string {
  if (availableDays.length === 0) return "No days";
  if (isAllDaysSelected(filters, availableDays.map((d) => d.key))) return "All days";

  const enabled = new Set(filters.enabledDays);
  const labels = availableDays.filter((d) => enabled.has(d.key)).map((d) => d.label);
  if (labels.length === 0) return "No days selected";
  if (labels.length <= 3) return labels.join(" · ");
  return `${labels.length} days`;
}

export function lifeStatusSummary(filters: UpcomingAnniversariesFilterState): string {
  if (filters.lifeStatus === "living") return "Living";
  if (filters.lifeStatus === "dead") return "Deceased";
  return "Living or deceased";
}

export function genderSummary(filters: UpcomingAnniversariesFilterState): string {
  if (filters.gender === "male") return "Male";
  if (filters.gender === "female") return "Female";
  if (filters.gender === "unknown") return "Unknown gender";
  return "Any gender";
}

export function lifeDetailsSummary(filters: UpcomingAnniversariesFilterState): string {
  const parts = [
    filters.lifeStatus === "living" ? "Living" : filters.lifeStatus === "dead" ? "Deceased" : null,
    filters.gender === "male"
      ? "Male"
      : filters.gender === "female"
        ? "Female"
        : filters.gender === "unknown"
          ? "Unknown gender"
          : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No life filters";
}

/** @deprecated Use lifeDetailsSummary */
export const peopleFilterSummary = lifeDetailsSummary;

export function toggleAnniversaryMonth(
  filters: UpcomingAnniversariesFilterState,
  month: number,
  availableDays: AvailableAnniversaryDay[],
): UpcomingAnniversariesFilterState {
  const enabledMonths = new Set(filters.enabledMonths);
  const enabledDays = new Set(filters.enabledDays);
  const monthDayKeys = availableDays.filter((d) => d.month === month).map((d) => d.key);

  if (enabledMonths.has(month)) {
    enabledMonths.delete(month);
    for (const key of monthDayKeys) enabledDays.delete(key);
  } else {
    enabledMonths.add(month);
    for (const key of monthDayKeys) enabledDays.add(key);
  }

  return {
    ...filters,
    enabledMonths: [...enabledMonths].sort((a, b) => a - b),
    enabledDays: [...enabledDays],
  };
}

export function toggleAnniversaryDay(
  filters: UpcomingAnniversariesFilterState,
  dayKey: string,
): UpcomingAnniversariesFilterState {
  const enabledDays = new Set(filters.enabledDays);
  if (enabledDays.has(dayKey)) enabledDays.delete(dayKey);
  else enabledDays.add(dayKey);
  return { ...filters, enabledDays: [...enabledDays] };
}
