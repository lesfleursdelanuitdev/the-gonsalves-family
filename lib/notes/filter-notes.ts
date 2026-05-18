import type { PublicNote, PublicNoteLinkKind, NotesSelectedPerson } from "@/lib/notes/public-note-types";

export type NotesLinkTypeFilters = Record<PublicNoteLinkKind, boolean>;

export type NotesFilterState = {
  linkTypes: NotesLinkTypeFilters;
  peopleMode: "all" | "selected";
  selectedPeople: NotesSelectedPerson[];
};

export const EMPTY_NOTES_FILTERS: NotesFilterState = {
  linkTypes: {
    individual: true,
    family: true,
    event: true,
    source: true,
  },
  peopleMode: "all",
  selectedPeople: [],
};

const LINK_TYPE_LABELS: Record<PublicNoteLinkKind, string> = {
  individual: "Individuals",
  family: "Families",
  event: "Events",
  source: "Sources",
};

export function notesLinkTypeLabel(kind: PublicNoteLinkKind): string {
  return LINK_TYPE_LABELS[kind];
}

function allLinkTypesEnabled(linkTypes: NotesLinkTypeFilters): boolean {
  return (Object.keys(linkTypes) as PublicNoteLinkKind[]).every((k) => linkTypes[k]);
}

function anyLinkTypeEnabled(linkTypes: NotesLinkTypeFilters): boolean {
  return (Object.keys(linkTypes) as PublicNoteLinkKind[]).some((k) => linkTypes[k]);
}

export function matchesNotesLinkTypes(note: PublicNote, linkTypes: NotesLinkTypeFilters): boolean {
  if (allLinkTypesEnabled(linkTypes)) return true;
  if (!anyLinkTypeEnabled(linkTypes)) return false;
  if (note.linkKinds.length === 0) return false;
  return note.linkKinds.some((kind) => linkTypes[kind]);
}

export function matchesNotesPeopleFilter(note: PublicNote, filters: NotesFilterState): boolean {
  if (filters.peopleMode === "all") return true;
  if (filters.selectedPeople.length === 0) return false;

  const selectedIds = new Set(filters.selectedPeople.map((p) => p.id));
  if (note.linkedIndividualIds.some((id) => selectedIds.has(id))) return true;
  if (note.linkedFamilyPartnerIndividualIds.some((id) => selectedIds.has(id))) return true;
  return false;
}

export function matchesNotesFilters(note: PublicNote, filters: NotesFilterState): boolean {
  return matchesNotesLinkTypes(note, filters.linkTypes) && matchesNotesPeopleFilter(note, filters);
}

export function filterNotes(notes: PublicNote[], filters: NotesFilterState): PublicNote[] {
  return notes.filter((note) => matchesNotesFilters(note, filters));
}

export function hasActiveNotesFilters(filters: NotesFilterState): boolean {
  if (filters.peopleMode === "selected") return true;
  return !allLinkTypesEnabled(filters.linkTypes);
}

function activeFilterCount(filters: NotesFilterState): number {
  let count = 0;
  if (filters.peopleMode === "selected") count++;
  if (!allLinkTypesEnabled(filters.linkTypes)) count++;
  return count;
}

export function buildNotesFilterButtonLabel(filters: NotesFilterState): string {
  const count = activeFilterCount(filters);
  return count === 0 ? "Filter notes" : `${count} filter${count === 1 ? "" : "s"} active`;
}

export function linkTypesSummary(filters: NotesFilterState): string {
  if (allLinkTypesEnabled(filters.linkTypes)) return "All link types";
  const enabled = (Object.keys(filters.linkTypes) as PublicNoteLinkKind[])
    .filter((k) => filters.linkTypes[k])
    .map(notesLinkTypeLabel);
  if (enabled.length === 0) return "No link types";
  if (enabled.length <= 3) return enabled.join(" · ");
  return `${enabled.length} link types`;
}

export function peopleSummary(filters: NotesFilterState): string {
  if (filters.peopleMode === "all") return "All people";
  if (filters.selectedPeople.length === 0) return "Select people";
  if (filters.selectedPeople.length === 1) return filters.selectedPeople[0]!.fullName;
  if (filters.selectedPeople.length === 2) {
    return `${filters.selectedPeople[0]!.fullName} · ${filters.selectedPeople[1]!.fullName}`;
  }
  return `${filters.selectedPeople.length} people`;
}
