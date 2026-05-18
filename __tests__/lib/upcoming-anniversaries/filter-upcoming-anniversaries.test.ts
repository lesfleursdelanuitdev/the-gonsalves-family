import { describe, expect, it } from "vitest";
import {
  anniversaryDayKey,
  createUpcomingAnniversariesFilters,
  filterUpcomingAnniversaryMonthGroups,
  listAvailableAnniversaryDays,
  matchesUpcomingAnniversaryFilters,
} from "@/lib/upcoming-anniversaries/filter-upcoming-anniversaries";
import type { UpcomingAnniversaryMonthGroup } from "@/lib/upcoming-anniversaries/group-upcoming-anniversaries";

const person = {
  id: "p1",
  xref: "@I1@",
  fullName: "Ada Lovelace",
  birthYear: 1815,
  deathYear: 1852,
  currentLocationLabel: null,
  placeLabels: [],
  age: null,
  childrenCount: 0,
  role: null,
  gender: "female",
  sex: "F",
  hasPartner: false,
  hasChildren: false,
  portraitSrc: null,
};

const malePerson = { ...person, id: "p2", fullName: "Charles Babbage", gender: "male", sex: "M" };

const mayGroup: UpcomingAnniversaryMonthGroup = {
  month: 5,
  monthLabel: "May 2026",
  sections: [
    {
      eventType: "BIRT",
      label: "Birthdays",
      items: [
        {
          kind: "person",
          eventId: "e1",
          eventType: "BIRT",
          occasionTitle: "Birthday",
          occasionSubtitle: "Turning 211",
          calendarMonth: 5,
          calendarDay: 12,
          calendarDayLabel: "May 12",
          person,
        },
        {
          kind: "person",
          eventId: "e2",
          eventType: "BIRT",
          occasionTitle: "Birthday",
          occasionSubtitle: "Turning 200",
          calendarMonth: 5,
          calendarDay: 20,
          calendarDayLabel: "May 20",
          person: malePerson,
        },
      ],
    },
    {
      eventType: "MARR",
      label: "Marriage anniversaries",
      items: [
        {
          kind: "family",
          eventId: "e3",
          eventType: "MARR",
          occasionTitle: "Marriage anniversary",
          occasionSubtitle: "50 years",
          calendarMonth: 5,
          calendarDay: 1,
          calendarDayLabel: "May 1",
          family: {
            id: "f1",
            xref: "@F1@",
            title: "Smith Family",
            partners: [],
            childrenCount: 0,
            marriageDateLabel: null,
            marriagePlaceLabel: null,
            marriageYear: null,
            divorcedStatus: "unknown",
            albumHref: "/media/album/f1",
            profileHref: "/families/f1",
          },
        },
      ],
    },
  ],
};

const juneGroup: UpcomingAnniversaryMonthGroup = {
  month: 6,
  monthLabel: "June 2026",
  sections: [
    {
      eventType: "DEAT",
      label: "Death anniversaries",
      items: [
        {
          kind: "person",
          eventId: "e4",
          eventType: "DEAT",
          occasionTitle: "Death anniversary",
          occasionSubtitle: "10 years",
          calendarMonth: 6,
          calendarDay: 3,
          calendarDayLabel: "June 3",
          person,
        },
      ],
    },
  ],
};

const groups = [mayGroup, juneGroup];
const availableDays = listAvailableAnniversaryDays(groups);
const defaultFilters = createUpcomingAnniversariesFilters(
  [5, 6],
  availableDays.map((d) => d.key),
);

describe("listAvailableAnniversaryDays", () => {
  it("lists unique days in window order", () => {
    expect(availableDays.map((d) => d.key)).toEqual([
      anniversaryDayKey(5, 1),
      anniversaryDayKey(5, 12),
      anniversaryDayKey(5, 20),
      anniversaryDayKey(6, 3),
    ]);
  });
});

describe("filterUpcomingAnniversaryMonthGroups", () => {
  it("filters by search query", () => {
    const { monthGroups, totalCount } = filterUpcomingAnniversaryMonthGroups(groups, "ada", defaultFilters);
    expect(totalCount).toBe(2);
    expect(monthGroups[0]?.sections[0]?.items).toHaveLength(1);
    expect(monthGroups[0]?.sections[0]?.items[0]?.kind).toBe("person");
  });

  it("filters birthdays by gender", () => {
    const { totalCount } = filterUpcomingAnniversaryMonthGroups(groups, "", {
      ...defaultFilters,
      gender: "female",
    });
    expect(totalCount).toBe(3);
    expect(
      matchesUpcomingAnniversaryFilters(mayGroup.sections[1]!.items[0]!, "", {
        ...defaultFilters,
        gender: "female",
      }),
    ).toBe(true);
  });

  it("hides unchecked occasion types", () => {
    const { totalCount } = filterUpcomingAnniversaryMonthGroups(groups, "", {
      ...defaultFilters,
      birthdays: false,
      deathAnniversaries: false,
    });
    expect(totalCount).toBe(1);
  });

  it("filters by month", () => {
    const { monthGroups, totalCount } = filterUpcomingAnniversaryMonthGroups(groups, "", {
      ...defaultFilters,
      enabledMonths: [6],
    });
    expect(totalCount).toBe(1);
    expect(monthGroups).toHaveLength(1);
    expect(monthGroups[0]?.month).toBe(6);
  });

  it("filters by specific day", () => {
    const may12 = anniversaryDayKey(5, 12);
    const { totalCount } = filterUpcomingAnniversaryMonthGroups(groups, "", {
      ...defaultFilters,
      enabledDays: [may12],
    });
    expect(totalCount).toBe(1);
    expect(
      matchesUpcomingAnniversaryFilters(mayGroup.sections[0]!.items[0]!, "", {
        ...defaultFilters,
        enabledDays: [may12],
      }),
    ).toBe(true);
    expect(
      matchesUpcomingAnniversaryFilters(mayGroup.sections[0]!.items[1]!, "", {
        ...defaultFilters,
        enabledDays: [may12],
      }),
    ).toBe(false);
  });

  it("filters person occasions by living status", () => {
    const livingPerson = {
      ...person,
      id: "p3",
      fullName: "Young Relative",
      birthYear: 2010,
      deathYear: null,
    };
    const oldNoDeath = {
      ...person,
      id: "p4",
      fullName: "Very Old",
      birthYear: 1890,
      deathYear: null,
    };
    const mixedGroup: UpcomingAnniversaryMonthGroup[] = [
      {
        month: 5,
        monthLabel: "May 2026",
        sections: [
          {
            eventType: "BIRT",
            label: "Birthdays",
            items: [
              {
                kind: "person",
                eventId: "e-living",
                eventType: "BIRT",
                occasionTitle: "Birthday",
                occasionSubtitle: "",
                calendarMonth: 5,
                calendarDay: 15,
                calendarDayLabel: "May 15",
                person: livingPerson,
              },
              {
                kind: "person",
                eventId: "e-old",
                eventType: "BIRT",
                occasionTitle: "Birthday",
                occasionSubtitle: "",
                calendarMonth: 5,
                calendarDay: 16,
                calendarDayLabel: "May 16",
                person: oldNoDeath,
              },
            ],
          },
        ],
      },
    ];
    const mixedDays = listAvailableAnniversaryDays(mixedGroup);
    const mixedFilters = createUpcomingAnniversariesFilters(
      [5],
      mixedDays.map((d) => d.key),
    );
    const livingOnly = { ...mixedFilters, lifeStatus: "living" as const };
    const { totalCount: livingCount } = filterUpcomingAnniversaryMonthGroups(
      mixedGroup,
      "",
      livingOnly,
    );
    expect(livingCount).toBe(1);
    expect(
      matchesUpcomingAnniversaryFilters(mixedGroup[0]!.sections[0]!.items[0]!, "", livingOnly),
    ).toBe(true);
    expect(
      matchesUpcomingAnniversaryFilters(mixedGroup[0]!.sections[0]!.items[1]!, "", livingOnly),
    ).toBe(false);

    const deadOnly = { ...mixedFilters, lifeStatus: "dead" as const };
    const { totalCount: deadCount } = filterUpcomingAnniversaryMonthGroups(mixedGroup, "", deadOnly);
    expect(deadCount).toBe(1);
    expect(
      matchesUpcomingAnniversaryFilters(mixedGroup[0]!.sections[0]!.items[1]!, "", deadOnly),
    ).toBe(true);
  });

  it("does not filter marriage anniversaries by living status", () => {
    expect(
      matchesUpcomingAnniversaryFilters(mayGroup.sections[1]!.items[0]!, "", {
        ...defaultFilters,
        lifeStatus: "living",
      }),
    ).toBe(true);
    expect(
      matchesUpcomingAnniversaryFilters(mayGroup.sections[1]!.items[0]!, "", {
        ...defaultFilters,
        lifeStatus: "dead",
      }),
    ).toBe(true);
  });
});
