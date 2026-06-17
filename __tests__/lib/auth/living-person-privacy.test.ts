import { describe, expect, it } from "vitest";
import {
  formatMinimalLivingLabel,
  redactHomeStatisticsIndividualExample,
  redactPublicIndividualForViewer,
  redactRelationForViewer,
  redactTreePersonForViewer,
} from "@/lib/auth/living-person-privacy";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";

const anonymous: PublicViewer = { kind: "anonymous" };
const authenticated: PublicViewer = {
  kind: "authenticated",
  user: {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    name: "Alice",
    isWebsiteOwner: false,
  },
};

describe("formatMinimalLivingLabel", () => {
  it("includes birth year when known", () => {
    expect(formatMinimalLivingLabel("Jane Doe", 1987)).toBe("Jane Doe · b. 1987");
  });

  it("omits birth year when unknown", () => {
    expect(formatMinimalLivingLabel("Jane Doe", null)).toBe("Jane Doe");
  });
});

describe("redactTreePersonForViewer", () => {
  const livingPerson = {
    id: "@I1@",
    isLiving: true,
    birthYear: 1987,
    birthDate: "15 Jan 1987",
    birthPlace: "Honolulu",
    deathDate: null,
    deathPlace: null,
    deathYear: null,
    photoUrl: "/photo.jpg",
  };

  it("redacts living tree nodes for anonymous viewers", () => {
    expect(redactTreePersonForViewer(livingPerson, anonymous)).toEqual({
      ...livingPerson,
      birthDate: "1987",
      birthPlace: null,
      deathDate: null,
      deathPlace: null,
      deathYear: null,
      photoUrl: null,
      portraitSrc: null,
    });
  });

  it("leaves authenticated payloads unchanged", () => {
    expect(redactTreePersonForViewer(livingPerson, authenticated)).toEqual(livingPerson);
  });
});

describe("redactPublicIndividualForViewer", () => {
  const person = {
    id: "abc",
    xref: "@I1@",
    fullName: "Jane Doe",
    birthYear: 1987,
    deathYear: null,
    currentLocationLabel: "Honolulu",
    placeLabels: ["Honolulu"],
    age: 38,
    childrenCount: 2,
    hasDeathCause: false,
    portraitSrc: "/photo.jpg",
    isLiving: true,
    role: null as const,
    gender: "Female",
    sex: "F",
    hasPartner: true,
    hasChildren: true,
  };

  it("redacts browse/list cards for anonymous viewers", () => {
    expect(redactPublicIndividualForViewer(person, anonymous)).toMatchObject({
      portraitSrc: null,
      deathYear: null,
      currentLocationLabel: null,
      placeLabels: [],
      age: null,
      childrenCount: 0,
    });
  });
});

describe("redactRelationForViewer", () => {
  const relation = {
    id: "abc",
    fullName: "Jane Doe",
    birthYear: 1987,
    deathYear: null,
    portraitSrc: "/photo.jpg",
    isLiving: true,
    relationship: "Child",
  };

  it("strips portrait and death year for anonymous viewers", () => {
    expect(redactRelationForViewer(relation, anonymous)).toEqual({
      ...relation,
      portraitSrc: null,
      deathYear: null,
    });
  });
});

describe("redactHomeStatisticsIndividualExample", () => {
  it("returns minimal label and no xref for living examples", () => {
    expect(
      redactHomeStatisticsIndividualExample(
        { displayName: "Jane Doe", xref: "@I1@", isLiving: true, birthYear: 1990 },
        anonymous,
      ),
    ).toEqual({ displayName: "Jane Doe · b. 1990", xref: "" });
  });
});
