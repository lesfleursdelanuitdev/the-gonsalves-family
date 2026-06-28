import { describe, expect, it } from "vitest";
import {
  collapseLinkedIndividualsForViewer,
  formatLivingPeopleCountSuffix,
  formatLivingPeopleOnlyLabel,
  formatMinimalLivingLabel,
  redactHomeStatisticsIndividualExample,
  redactEventLinkedPeopleForViewer,
  redactFamilyPartnerForViewer,
  redactPublicFamilyMemberForViewer,
  redactPublicIndividualForViewer,
  redactSearchIndividualForViewer,
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
    role: null,
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

describe("redactSearchIndividualForViewer", () => {
  const person = {
    id: "abc",
    fullName: "Jane Doe",
    displayName: "Jane Doe",
    birthYear: 1987,
    deathYear: null,
    portraitSrc: "/photo.jpg",
    profileHref: "/individuals/abc",
    isLiving: true,
    birthCountry: "USA",
    ageAtDeath: null,
    generationDepth: 3,
  };

  it("strips profile link and demographics for anonymous viewers", () => {
    const redacted = redactSearchIndividualForViewer(person, anonymous);
    expect(redacted.displayName).toBe("Jane Doe · b. 1987");
    expect(redacted.profileHref).toContain("/login");
    expect(redacted.portraitSrc).toBeNull();
    expect(redacted.birthCountry).toBeNull();
    expect(redacted.ageAtDeath).toBeNull();
    expect(redacted.generationDepth).toBeNull();
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

describe("redactFamilyPartnerForViewer", () => {
  const partner = {
    id: "p1",
    fullName: "Jane Doe",
    portraitSrc: "/photo.jpg",
    isLiving: true,
    birthYear: 1987,
    deathYear: null,
  };

  it("strips portrait for anonymous viewers", () => {
    expect(redactFamilyPartnerForViewer(partner, anonymous)).toMatchObject({
      portraitSrc: null,
      deathYear: null,
      displayName: "Jane Doe · b. 1987",
      profileHref: expect.stringContaining("/login"),
    });
  });

  it("leaves authenticated payloads unchanged", () => {
    expect(redactFamilyPartnerForViewer(partner, authenticated)).toEqual(partner);
  });
});

describe("redactPublicFamilyMemberForViewer", () => {
  const member = {
    id: "m1",
    fullName: "Jane Doe",
    isLiving: true,
    birthYear: 1987,
    birthDateLabel: "15 Jan 1987",
    deathDateLabel: null,
    partnersCount: 2,
    childrenCount: 1,
    portraitSrc: "/photo.jpg",
    profileHref: "/individuals/m1",
  };

  it("strips sensitive fields for anonymous viewers", () => {
    expect(redactPublicFamilyMemberForViewer(member, anonymous)).toEqual({
      ...member,
      fullName: "Jane Doe · b. 1987",
      birthDateLabel: "1987",
      deathDateLabel: null,
      partnersCount: 0,
      childrenCount: 0,
      portraitSrc: null,
      profileHref: expect.stringContaining("/login"),
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

describe("redactEventLinkedPeopleForViewer", () => {
  it("keeps profile links for all viewers", () => {
    const people = [
      {
        id: "l1",
        displayName: "Aaron Peter Gonsalves",
        profileHref: "/individuals/l1",
        isLiving: true,
      },
      {
        id: "d1",
        displayName: "Martin Gonsalves",
        profileHref: "/individuals/d1",
        isLiving: false,
      },
    ];
    expect(redactEventLinkedPeopleForViewer(people, anonymous)).toEqual(people);
    expect(redactEventLinkedPeopleForViewer(people, authenticated)).toEqual(people);
  });
});

describe("living people label helpers", () => {
  it("formats singular and plural suffixes", () => {
    expect(formatLivingPeopleCountSuffix(1)).toBe("+ 1 living person");
    expect(formatLivingPeopleCountSuffix(2)).toBe("+ 2 living people");
    expect(formatLivingPeopleOnlyLabel(1)).toBe("1 living person");
    expect(formatLivingPeopleOnlyLabel(3)).toBe("3 living people");
  });
});

describe("collapseLinkedIndividualsForViewer", () => {
  const people = [
    { id: "d1", displayName: "Norman Peter Gonsalves", isLiving: false },
    { id: "d2", displayName: "Maria Gonsalves", isLiving: false },
    { id: "l1", displayName: "James Gonsalves", isLiving: true },
    { id: "l2", displayName: "Sarah Gonsalves", isLiving: true },
  ];

  it("collapses living names for anonymous viewers", () => {
    expect(collapseLinkedIndividualsForViewer(people, anonymous)).toEqual([
      people[0],
      people[1],
      {
        id: "__living-people-summary__",
        xref: "",
        gedcomName: "",
        displayName: "+ 2 living people",
        isLivingSummary: true,
      },
    ]);
  });

  it("returns only a living count when no deceased names exist", () => {
    expect(
      collapseLinkedIndividualsForViewer(
        [
          { id: "l1", displayName: "James Gonsalves", isLiving: true },
          { id: "l2", displayName: "Sarah Gonsalves", isLiving: true },
        ],
        anonymous,
      ),
    ).toEqual([
      {
        id: "__living-people-summary__",
        xref: "",
        gedcomName: "",
        displayName: "2 living people",
        isLivingSummary: true,
      },
    ]);
  });

  it("leaves authenticated payloads unchanged", () => {
    expect(collapseLinkedIndividualsForViewer(people, authenticated)).toEqual(people);
  });
});
