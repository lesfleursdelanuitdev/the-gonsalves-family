import { describe, expect, it } from "vitest";
import { buildUpcomingAnniversaryGroups } from "@/lib/upcoming-anniversaries/group-upcoming-anniversaries";
import type { PublicFamily } from "@/components/families/types";
import type { PublicIndividual } from "@/components/individuals/types";

const window = { start: { month: 5, day: 10 }, end: { month: 8, day: 10 } };

const person: PublicIndividual = {
  id: "p1",
  xref: "@I1@",
  fullName: "Jane Doe",
  birthYear: 1920,
  deathYear: 1990,
  currentLocationLabel: null,
  placeLabels: [],
  age: null,
  childrenCount: 0,
  role: null,
  gender: null,
  sex: null,
  hasPartner: false,
  hasChildren: false,
  hasDeathCause: false,
  portraitSrc: null,
};

const family: PublicFamily = {
  id: "f1",
  xref: "@F1@",
  title: "Jane & John",
  partners: [],
  childrenCount: 2,
  marriageDateLabel: "1950",
  marriagePlaceLabel: null,
  marriageYear: 1950,
  divorcedStatus: "no",
  albumHref: "/media/album-view?kind=generated&type=family&id=f1",
  profileHref: "/families/f1",
};

describe("buildUpcomingAnniversaryGroups", () => {
  it("groups by month then event type", () => {
    const groups = buildUpcomingAnniversaryGroups({
      window,
      events: [
        {
          id: "e1",
          eventType: "BIRT",
          eventLabel: null,
          date: { original: null, year: 1920, month: 6, day: 1 },
          place: null,
          individual: { id: "p1", xref: "@I1@", fullName: "Jane" },
          family: null,
        },
        {
          id: "e2",
          eventType: "MARR",
          eventLabel: null,
          date: { original: null, year: 1950, month: 6, day: 15 },
          place: null,
          individual: null,
          family: {
            id: "f1",
            xref: "@F1@",
            husband: { id: "h1", xref: "@I1@", fullName: "Jane" },
            wife: null,
          },
        },
      ],
      peopleById: new Map([["p1", person]]),
      familiesById: new Map([["f1", family]]),
    });

    expect(groups).toHaveLength(1);
    expect(groups[0]!.month).toBe(6);
    expect(groups[0]!.sections.map((s) => s.eventType)).toEqual(["BIRT", "MARR"]);
    expect(groups[0]!.sections[0]!.items[0]!.kind).toBe("person");
    expect(groups[0]!.sections[1]!.items[0]!.kind).toBe("family");
  });
});
