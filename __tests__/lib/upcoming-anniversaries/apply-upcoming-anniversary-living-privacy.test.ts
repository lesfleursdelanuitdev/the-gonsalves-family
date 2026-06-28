import { describe, expect, it } from "vitest";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import type { IndividualPrivacyHint } from "@/lib/individuals/load-individual-living-status";
import {
  redactLivingBirthdayOccasionSubtitle,
  redactPublicFamilyForAnniversaryViewer,
  redactUpcomingEventRowForViewer,
} from "@/lib/upcoming-anniversaries/apply-upcoming-anniversary-living-privacy";
import type { PublicFamily } from "@/components/families/types";

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

const livingHint: IndividualPrivacyHint = {
  isLiving: true,
  birthYear: 1990,
  fullName: "Jane /Doe/",
  xref: "@I1@",
};

const deceasedHint: IndividualPrivacyHint = {
  isLiving: false,
  birthYear: 1920,
  fullName: "John /Smith/",
  xref: "@I2@",
};

describe("redactLivingBirthdayOccasionSubtitle", () => {
  it("strips age wording for living birthdays when anonymous", () => {
    expect(redactLivingBirthdayOccasionSubtitle("BIRT", "Turning 35 years", true, anonymous)).toBe(
      "Birthday",
    );
  });

  it("keeps anniversary wording for authenticated viewers", () => {
    expect(redactLivingBirthdayOccasionSubtitle("BIRT", "Turning 35 years", true, authenticated)).toBe(
      "Turning 35 years",
    );
  });
});

describe("redactUpcomingEventRowForViewer", () => {
  it("redacts living birthday names, places, and age-bearing fields in API rows", () => {
    const hints = new Map([["p1", livingHint]]);
    const redacted = redactUpcomingEventRowForViewer(
      {
        id: "e1",
        eventType: "BIRT",
        eventLabel: null,
        date: { original: "May 12, 1990", year: 1990, month: 5, day: 12 },
        place: { original: "Honolulu", name: "Honolulu" },
        individual: { id: "p1", xref: "@I1@", fullName: "Jane /Doe/" },
        family: null,
      },
      anonymous,
      hints,
    );

    expect(redacted.individual?.fullName).toBe("Jane Doe · b. 1990");
    expect(redacted.place).toBeNull();
  });

  it("redacts living partner names in marriage events", () => {
    const hints = new Map([
      ["h1", livingHint],
      ["w1", deceasedHint],
    ]);
    const redacted = redactUpcomingEventRowForViewer(
      {
        id: "e2",
        eventType: "MARR",
        eventLabel: null,
        date: { original: "Jun 1, 2010", year: 2010, month: 6, day: 1 },
        place: null,
        individual: null,
        family: {
          id: "f1",
          xref: "@F1@",
          husband: { id: "h1", xref: "@I1@", fullName: "Jane /Doe/" },
          wife: { id: "w1", xref: "@I2@", fullName: "John /Smith/" },
        },
      },
      anonymous,
      hints,
    );

    expect(redacted.family?.husband?.fullName).toBe("Jane Doe · b. 1990");
    expect(redacted.family?.wife?.fullName).toBe("John /Smith/");
  });
});

describe("redactPublicFamilyForAnniversaryViewer", () => {
  const family: PublicFamily = {
    id: "f1",
    xref: "@F1@",
    title: "Jane Doe & John Smith",
    partners: [
      {
        id: "h1",
        xref: "@I1@",
        fullName: "Jane Doe",
        portraitSrc: "/jane.jpg",
        sex: "F",
        gender: "female",
        isLiving: true,
      },
      {
        id: "w1",
        xref: "@I2@",
        fullName: "John Smith",
        portraitSrc: "/john.jpg",
        sex: "M",
        gender: "male",
        isLiving: false,
      },
    ],
    childrenCount: 1,
    marriageDateLabel: "2010",
    marriagePlaceLabel: "Georgetown",
    marriageYear: 2010,
    divorcedStatus: "no",
    albumHref: "/media/album/f1",
    profileHref: "/families/f1",
  };

  it("removes portraits and marks family cards restricted for living partners", () => {
    const hints = new Map([
      ["h1", livingHint],
      ["w1", deceasedHint],
    ]);
    const redacted = redactPublicFamilyForAnniversaryViewer(family, anonymous, hints);

    expect(redacted.partners[0]?.portraitSrc).toBeNull();
    expect(redacted.partners[0]?.fullName).toBe("Jane Doe · b. 1990");
    expect(redacted.partners[1]?.portraitSrc).toBe("/john.jpg");
    expect(redacted.privacyRestricted).toBe(true);
    expect(redacted.title).toContain("Jane Doe · b. 1990");
  });
});
