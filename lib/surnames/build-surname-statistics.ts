import {
  GEDCOM_PLACE_DISPLAY_SELECT,
  fullPlaceLabelFromGedcomPlace,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";
import {
  fetchIndividualIdsForSurnameId,
  fetchIndividualIdsForSurnamePrefix,
} from "@/lib/surnames/surname-query";
import { prisma } from "@/lib/database/prisma";
import type { HomeStatDonutChart } from "@/types/tree";

type StatRow = {
  sex: string | null;
  gender: string | null;
  deathYear: number | null;
  birthYear: number | null;
  birthPlaceDisplay: string | null;
  birthPlace: { name: string | null; county: string | null; state: string | null; country: string | null; original: string | null } | null;
};

function genderBucket(row: StatRow): "Male" | "Female" | "Unknown" {
  const value = `${row.gender ?? ""} ${row.sex ?? ""}`.trim().toLowerCase();
  if (value === "f" || value.includes("female")) return "Female";
  if (value === "m" || value.includes("male")) return "Male";
  return "Unknown";
}

function birthDecadeLabel(year: number | null): string {
  if (year == null) return "Unknown";
  const decade = Math.floor(year / 10) * 10;
  if (decade < 1800) return "Before 1800";
  if (decade >= 2000) return "2000s+";
  return `${decade}s`;
}

export type SurnameStatisticsPayload = {
  peopleCount: number;
  charts: {
    gender: HomeStatDonutChart;
    lifeStatus: HomeStatDonutChart;
    birthEra: HomeStatDonutChart;
    birthPlaces: HomeStatDonutChart;
  };
};

const emptyCharts: SurnameStatisticsPayload["charts"] = {
    gender: {
      titleLine1: "Gender",
      titleLine2: "distribution",
      slices: [],
      variant: "staggered",
    },
    lifeStatus: {
      titleLine1: "Living",
      titleLine2: "vs deceased",
      slices: [],
      variant: "donut",
    },
    birthEra: {
      titleLine1: "Birth",
      titleLine2: "by decade",
      slices: [],
      variant: "line",
      lineSeriesMode: "sliceOrder",
      lineYAxisTitle: "People",
      lineHoverCountsLabel: "people",
    },
    birthPlaces: {
      titleLine1: "Top birth",
      titleLine2: "places",
      slices: [],
      variant: "bar",
      barXAxisTitle: "People",
      barHoverCountsLabel: "people",
    },
};

export async function buildSurnameStatisticsForIndividualIds(
  ids: string[],
): Promise<SurnameStatisticsPayload> {
  const peopleCount = ids.length;

  if (ids.length === 0) {
    return { peopleCount: 0, charts: emptyCharts };
  }

  const rows = await prisma.gedcomIndividual.findMany({
    where: { id: { in: ids } },
    select: {
      sex: true,
      gender: true,
      deathYear: true,
      birthYear: true,
      birthPlaceDisplay: true,
      birthPlace: { select: GEDCOM_PLACE_DISPLAY_SELECT },
    },
  });

  const genderCounts = new Map<string, number>();
  const lifeCounts = new Map<string, number>();
  const decadeCounts = new Map<string, number>();
  const placeCounts = new Map<string, number>();

  for (const row of rows as StatRow[]) {
    const g = genderBucket(row);
    genderCounts.set(g, (genderCounts.get(g) ?? 0) + 1);

    const life = row.deathYear != null ? "Deceased" : "Living";
    lifeCounts.set(life, (lifeCounts.get(life) ?? 0) + 1);

    const decade = birthDecadeLabel(row.birthYear);
    decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);

    const place =
      fullPlaceLabelFromGedcomPlace(row.birthPlace as GedcomPlaceDisplayRow | null) ??
      (row.birthPlaceDisplay?.trim() || null);
    if (place) {
      placeCounts.set(place, (placeCounts.get(place) ?? 0) + 1);
    }
  }

  const decadeOrder = ["Before 1800", "1800s", "1810s", "1820s", "1830s", "1840s", "1850s", "1860s", "1870s", "1880s", "1890s", "1900s", "1910s", "1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s+", "Unknown"];
  const decadeSlices = decadeOrder
    .map((label) => ({ label, value: decadeCounts.get(label) ?? 0 }))
    .filter((s) => s.value > 0);

  const placeSlices = [...placeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return {
    peopleCount,
    charts: {
      gender: {
        titleLine1: "Gender",
        titleLine2: "distribution",
        slices: ["Male", "Female", "Unknown"].map((label) => ({
          label,
          value: genderCounts.get(label) ?? 0,
        })),
        variant: "staggered",
      },
      lifeStatus: {
        titleLine1: "Living",
        titleLine2: "vs deceased",
        slices: ["Living", "Deceased"].map((label) => ({
          label,
          value: lifeCounts.get(label) ?? 0,
        })),
        variant: "donut",
      },
      birthEra: {
        titleLine1: "Birth",
        titleLine2: "by decade",
        slices: decadeSlices.length > 0 ? decadeSlices : [{ label: "Unknown", value: peopleCount }],
        variant: "line",
        lineSeriesMode: "sliceOrder",
        lineYAxisTitle: "People",
        lineHoverCountsLabel: "people",
      },
      birthPlaces: {
        titleLine1: "Top birth",
        titleLine2: "places",
        slices: placeSlices,
        variant: "bar",
        barXAxisTitle: "People",
        barHoverCountsLabel: "people",
      },
    },
  };
}

export async function buildSurnameStatisticsForSurnameId(
  surnameId: string,
): Promise<SurnameStatisticsPayload> {
  const ids = await fetchIndividualIdsForSurnameId(surnameId);
  return buildSurnameStatisticsForIndividualIds(ids);
}

export async function buildSurnameStatistics(
  fileUuid: string,
  lastNamePrefix: string,
): Promise<SurnameStatisticsPayload> {
  const ids = await fetchIndividualIdsForSurnamePrefix(fileUuid, lastNamePrefix);
  return buildSurnameStatisticsForIndividualIds(ids);
}
