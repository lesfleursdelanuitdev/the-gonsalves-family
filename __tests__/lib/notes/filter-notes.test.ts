import { describe, expect, it } from "vitest";
import {
  EMPTY_NOTES_FILTERS,
  filterNotes,
  matchesNotesFilters,
} from "@/lib/notes/filter-notes";
import type { PublicNote } from "@/lib/notes/public-note-types";

const baseNote = (overrides: Partial<PublicNote>): PublicNote => ({
  id: "n1",
  xref: "@N1@",
  displayNumber: "#01",
  contentPreview: "Text",
  searchText: "text",
  isTopLevel: false,
  createdAt: "2020-01-01T00:00:00.000Z",
  linkedTargets: [],
  linkKinds: ["individual"],
  linkedIndividualIds: ["person-a"],
  linkedFamilyPartnerIndividualIds: [],
  privacyRestricted: false,
  loginHref: null,
  ...overrides,
});

describe("matchesNotesFilters", () => {
  it("filters by link type", () => {
    const individualNote = baseNote({ linkKinds: ["individual"], linkedIndividualIds: ["p1"] });
    const familyNote = baseNote({
      id: "n2",
      linkKinds: ["family"],
      linkedIndividualIds: [],
      linkedFamilyPartnerIndividualIds: ["p2", "p3"],
    });

    const familyOnly = {
      ...EMPTY_NOTES_FILTERS,
      linkTypes: { individual: false, family: true, event: false, source: false },
    };

    expect(matchesNotesFilters(individualNote, familyOnly)).toBe(false);
    expect(matchesNotesFilters(familyNote, familyOnly)).toBe(true);
  });

  it("matches family notes when selected person is a spouse", () => {
    const familyNote = baseNote({
      linkKinds: ["family"],
      linkedIndividualIds: [],
      linkedFamilyPartnerIndividualIds: ["spouse-a", "spouse-b"],
    });

    const filters = {
      ...EMPTY_NOTES_FILTERS,
      peopleMode: "selected" as const,
      selectedPeople: [{ id: "spouse-b", fullName: "Spouse B" }],
    };

    expect(matchesNotesFilters(familyNote, filters)).toBe(true);
    expect(
      matchesNotesFilters(familyNote, {
        ...filters,
        selectedPeople: [{ id: "other", fullName: "Other" }],
      }),
    ).toBe(false);
  });

  it("shows nothing when filtering by people with none selected", () => {
    const note = baseNote({});
    const filters = { ...EMPTY_NOTES_FILTERS, peopleMode: "selected" as const, selectedPeople: [] };
    expect(matchesNotesFilters(note, filters)).toBe(false);
    expect(filterNotes([note], filters)).toHaveLength(0);
  });
});
