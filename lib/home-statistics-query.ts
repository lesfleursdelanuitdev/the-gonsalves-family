import type { PrismaClient } from "@ligneous/prisma";
import { Prisma } from "@ligneous/prisma";
import type {
  HomeStatisticsDistributionLabel,
  HomeStatisticsPayload,
  HomeStatDonutChart,
  HomeStatSlice,
} from "@/types/tree";
import {
  redactHomeStatisticsFamilyExample,
  redactHomeStatisticsIndividualExample,
} from "@/lib/auth/living-person-privacy";
import type { PublicViewer } from "@/lib/auth/public-viewer-context";
import { mapIndividualRow, type IndividualRowForMapping, yearFromDisplayDateString } from "@/lib/individual-mapper";
import {
  fullPlaceLabelFromGedcomPlace,
  individualBirthDeathPlaceSelect,
  type GedcomPlaceDisplayRow,
} from "@/lib/gedcom-place-display";
import { gedcomIndividualNlDenormSelect } from "@/lib/gedcom-individual-nl-select";
import { buildHomeChartsFromPythonAnalytics } from "@/lib/home-statistics-analytics-charts";
import { mergeStatSlicesByLabel } from "@/lib/home-stat-slices";

const DISTRIBUTION_ORDER: readonly HomeStatisticsDistributionLabel[] = [
  "Guyana",
  "North America",
  "Portugal",
  "UK / Europe",
  "Elsewhere",
] as const;

const individualSelectForMap = {
  id: true,
  xref: true,
  fullName: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  deathDateDisplay: true,
  deathPlaceDisplay: true,
  ...individualBirthDeathPlaceSelect,
  ...gedcomIndividualNlDenormSelect,
  isLiving: true,
  sex: true,
  gender: true,
  individualNameForms: {
    where: { isPrimary: true },
    take: 1,
    include: {
      givenNames: {
        include: { givenName: true },
        orderBy: { position: "asc" as const },
      },
      surnames: {
        include: { surname: true },
        orderBy: { position: "asc" as const },
      },
    },
  },
} as const;

function classifyBirthRegion(countryLower: string | null | undefined): HomeStatisticsDistributionLabel {
  const c = (countryLower ?? "").trim().toLowerCase();
  if (!c) return "Elsewhere";
  if (/\bguyana\b|british guiana/.test(c)) return "Guyana";
  if (/\bportugal\b|\bazores\b|\bmadeira\b/.test(c)) return "Portugal";
  if (
    /\b(united kingdom|great britain|england|scotland|wales|northern ireland|ireland|france|germany|spain|italy|netherlands|holland|belgium|sweden|norway|denmark|finland|switzerland|austria|poland|greece|hungary|romania|czech|slovakia|croatia|serbia|ukraine|bulgaria|iceland|luxembourg|malta|cyprus|europe)\b/.test(
      c,
    ) ||
    /\b(u\.k\.|u\.k|uk)\b/.test(c)
  ) {
    return "UK / Europe";
  }
  if (
    /\b(united states|u\.s\.a\.|u\.s\.|usa|canada|mexico|jamaica|trinidad|tobago|barbados|cuba|bahamas|haiti|dominican|puerto rico|bermuda|cayman|aruba|antigua|grenada|saint lucia|st\. lucia|saint kitts|st\. kitts|belize|costa rica|panama|honduras|guatemala|nicaragua|el salvador)\b/.test(
      c,
    ) ||
    /\b(north america)\b/.test(c)
  ) {
    return "North America";
  }
  return "Elsewhere";
}

async function randomMappedIndividual(
  prisma: PrismaClient,
  fileUuid: string,
): Promise<ReturnType<typeof mapIndividualRow> | null> {
  const count = await prisma.gedcomIndividual.count({ where: { fileUuid } });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const rows = await prisma.gedcomIndividual.findMany({
    where: { fileUuid },
    select: individualSelectForMap,
    orderBy: { id: "asc" },
    take: 1,
    skip,
  });
  const row = rows[0] as IndividualRowForMapping | undefined;
  if (!row) return null;
  try {
    return mapIndividualRow(row);
  } catch {
    return null;
  }
}

function displayIndividualName(m: ReturnType<typeof mapIndividualRow>): string {
  const a = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
  return a || m.givenNames.join(" ") || "—";
}

function emptyDonut(line1: string, line2?: string): HomeStatDonutChart {
  return { titleLine1: line1, titleLine2: line2, slices: [] };
}

function sexLabel(sex: string | null): string {
  switch (sex) {
    case "M":
      return "Male";
    case "F":
      return "Female";
    case "U":
      return "Unknown";
    case "X":
      return "Other";
    default:
      return "Unspecified";
  }
}

async function buildHomeMiniCharts(
  prisma: PrismaClient,
  fileUuid: string,
): Promise<HomeStatisticsPayload["charts"]> {
  const defaults: HomeStatisticsPayload["charts"] = {
    individuals: emptyDonut("Gender", "distribution"),
    surnames: emptyDonut("Surname", "distribution"),
    families: emptyDonut("Children", "distribution"),
    places: emptyDonut("Top places", "(birth)"),
  };

  try {
    const [genderRows, surnameTop, surnameSum, childRows, topBirthPlaceRows] = await Promise.all([
      prisma.gedcomIndividual.groupBy({
        by: ["sex"] as const,
        where: { fileUuid },
        _count: { _all: true },
      }),
      prisma.gedcomSurname.findMany({
        where: { fileUuid },
        orderBy: { frequency: "desc" },
        take: 8,
        select: { surname: true, frequency: true },
      }),
      prisma.gedcomSurname.aggregate({
        where: { fileUuid },
        _sum: { frequency: true },
      }),
      prisma.gedcomFamily.groupBy({
        by: ["childrenCount"] as const,
        where: { fileUuid },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ id: string; c: bigint }>>(
        Prisma.sql`
          SELECT birth_place_id::text AS id, COUNT(*)::bigint AS c
          FROM gedcom_individuals_v2
          WHERE file_uuid = ${fileUuid}::uuid
            AND birth_place_id IS NOT NULL
          GROUP BY birth_place_id
          ORDER BY COUNT(*) DESC
          LIMIT 10
        `,
      ),
    ]);

    const genderSlices: HomeStatSlice[] = genderRows
      .map((r) => ({
        label: sexLabel(r.sex ?? null),
        value: r._count._all,
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalSurnameFreq = surnameSum._sum.frequency ?? 0;
    const topSurnameSum = surnameTop.reduce((acc, r) => acc + r.frequency, 0);
    const surnameOther = Math.max(0, totalSurnameFreq - topSurnameSum);
    const surnameSlices: HomeStatSlice[] = [
      ...surnameTop.map((r) => ({ label: r.surname, value: r.frequency })),
      ...(surnameOther > 0 ? [{ label: "Other", value: surnameOther }] : []),
    ].filter((s) => s.value > 0);

    const childBucket: Record<string, number> = {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4+": 0,
    };
    for (const row of childRows) {
      const n = row.childrenCount;
      const k = n >= 4 ? "4+" : String(n);
      if (k in childBucket) {
        childBucket[k] += row._count._all;
      } else {
        childBucket["4+"] += row._count._all;
      }
    }
    const childSlices: HomeStatSlice[] = (
      [
        ["0", "0 children"],
        ["1", "1 child"],
        ["2", "2 children"],
        ["3", "3 children"],
        ["4+", "4+ children"],
      ] as const
    )
      .map(([key, label]) => ({ label, value: childBucket[key] ?? 0 }))
      .filter((s) => s.value > 0);

    let placeSlices: HomeStatSlice[] = [];
    if (topBirthPlaceRows.length > 0) {
      const ids = topBirthPlaceRows.map((r) => r.id).filter(Boolean);
      const placeRows = await prisma.gedcomPlace.findMany({
        where: { fileUuid, id: { in: ids } },
        select: {
          id: true,
          original: true,
          name: true,
          county: true,
          state: true,
          country: true,
        },
      });
      const labelById = new Map<string, string>();
      for (const p of placeRows) {
        const row: GedcomPlaceDisplayRow = {
          original: p.original,
          name: p.name,
          county: p.county,
          state: p.state,
          country: p.country,
        };
        const full = fullPlaceLabelFromGedcomPlace(row);
        const label =
          (full && full.length > 0 ? full : row.original?.trim()) || "Place";
        const short =
          label.length > 42 ? `${label.slice(0, 40).trimEnd()}…` : label;
        labelById.set(p.id, short);
      }
      placeSlices = mergeStatSlicesByLabel(
        topBirthPlaceRows.map((r) => ({
          label: labelById.get(r.id) ?? "Place",
          value: Number(r.c),
        })),
        10,
      );
    }

    return {
      individuals: {
        titleLine1: "Gender",
        titleLine2: "distribution",
        slices: genderSlices,
      },
      surnames: {
        titleLine1: "Surname",
        titleLine2: "distribution",
        slices: surnameSlices,
      },
      families: {
        titleLine1: "Children",
        titleLine2: "distribution",
        slices: childSlices,
      },
      places: {
        titleLine1: "Top places",
        titleLine2: "by birth",
        slices: placeSlices,
      },
    };
  } catch {
    return defaults;
  }
}

export async function buildHomeStatisticsPayload(
  prisma: PrismaClient,
  fileUuid: string,
  options?: { analyticsSeed?: number | null; treeId?: string | null; viewer?: PublicViewer },
): Promise<HomeStatisticsPayload> {
  const [individuals, families, surnames, places] = await Promise.all([
    prisma.gedcomIndividual.count({ where: { fileUuid } }),
    prisma.gedcomFamily.count({ where: { fileUuid } }),
    prisma.gedcomSurname.count({ where: { fileUuid } }),
    prisma.gedcomPlace.count({ where: { fileUuid } }),
  ]);

  let countryGroups: { birthCountryLower: string | null; _count: { _all: number } }[] = [];
  try {
    // @ts-expect-error Prisma groupBy overload narrows to an array type incorrectly for this client version
    countryGroups = (await prisma.gedcomIndividual.groupBy({
      by: ["birthCountryLower"] as const,
      where: { fileUuid },
      _count: { _all: true },
    })) as { birthCountryLower: string | null; _count: { _all: number } }[];
  } catch {
    countryGroups = [];
  }

  const bucketCounts: Record<HomeStatisticsDistributionLabel, number> = {
    Guyana: 0,
    "North America": 0,
    Portugal: 0,
    "UK / Europe": 0,
    Elsewhere: 0,
  };
  for (const g of countryGroups) {
    const b = classifyBirthRegion(g.birthCountryLower);
    bucketCounts[b] += g._count._all;
  }

  const totalForPct = individuals > 0 ? individuals : 1;
  const distribution = DISTRIBUTION_ORDER.map((label) => ({
    label,
    count: bucketCounts[label],
    percent: Math.round((bucketCounts[label] / totalForPct) * 1000) / 10,
  }));

  const [exInd, exFam, exSur, exPla, meet, charts] = await Promise.all([
    randomMappedIndividual(prisma, fileUuid),
    (async () => {
      const c = await prisma.gedcomFamily.count({ where: { fileUuid } });
      if (c === 0) return null;
      const skip = Math.floor(Math.random() * c);
      const f = await prisma.gedcomFamily.findMany({
        where: { fileUuid },
        select: {
          id: true,
          xref: true,
          husbandId: true,
          wifeId: true,
          husbandXref: true,
          wifeXref: true,
        },
        orderBy: { id: "asc" },
        take: 1,
        skip,
      });
      const fam = f[0];
      if (!fam) return null;
      const ids = [fam.husbandId, fam.wifeId].filter(Boolean) as string[];
      const people = await prisma.gedcomIndividual.findMany({
        where: { fileUuid, id: { in: ids } },
        select: individualSelectForMap,
      });
      const byId = new Map<string, ReturnType<typeof mapIndividualRow>>();
      for (const p of people) {
        try {
          byId.set(p.id, mapIndividualRow(p as IndividualRowForMapping));
        } catch {
          /* skip malformed joins */
        }
      }
      const hm = fam.husbandId ? byId.get(fam.husbandId) : undefined;
      const wm = fam.wifeId ? byId.get(fam.wifeId) : undefined;
      const hn = hm ? displayIndividualName(hm) : "";
      const wn = wm ? displayIndividualName(wm) : "";
      const displayName = [hn, wn].filter(Boolean).join(" & ").trim() || "Family";
      const partners = [hm, wm]
        .filter((person): person is NonNullable<typeof person> => person != null)
        .map((person) => ({
          displayName: displayIndividualName(person),
          isLiving: person.isLiving,
          birthYear: yearFromDisplayDateString(person.birthDate),
        }));
      return { id: fam.id, displayName, xref: fam.xref, partners };
    })(),
    (async () => {
      const c = await prisma.gedcomSurname.count({ where: { fileUuid } });
      if (c === 0) return null;
      const skip = Math.floor(Math.random() * c);
      const s = await prisma.gedcomSurname.findMany({
        where: { fileUuid },
        select: { surname: true },
        orderBy: { id: "asc" },
        take: 1,
        skip,
      });
      return s[0] ? { surname: s[0].surname } : null;
    })(),
    (async () => {
      const c = await prisma.gedcomPlace.count({ where: { fileUuid } });
      if (c === 0) return null;
      const skip = Math.floor(Math.random() * c);
      const p = await prisma.gedcomPlace.findMany({
        where: { fileUuid },
        select: { original: true, name: true, county: true, state: true, country: true },
        orderBy: { id: "asc" },
        take: 1,
        skip,
      });
      const row = p[0];
      if (!row) return null;
      const parts = [row.name, row.county, row.state, row.country].filter(Boolean);
      const displayLabel =
        parts.length > 0 ? parts.join(", ") : row.original?.trim() || "Place";
      return { displayLabel };
    })(),
    randomMappedIndividual(prisma, fileUuid),
    buildHomeMiniCharts(prisma, fileUuid),
  ]);

  return {
    counts: { individuals, families, surnames, places },
    distribution,
    examples: {
      individual: exInd
        ? redactHomeStatisticsIndividualExample(
            {
              displayName: displayIndividualName(exInd),
              xref: exInd.xref,
              isLiving: exInd.isLiving,
              birthYear: yearFromDisplayDateString(exInd.birthDate),
            },
            options?.viewer ?? { kind: "anonymous" },
          )
        : null,
      family: exFam
        ? redactHomeStatisticsFamilyExample(
            {
              id: exFam.id,
              displayName: exFam.displayName,
              xref: exFam.xref,
              partners: exFam.partners,
            },
            options?.viewer ?? { kind: "anonymous" },
          )
        : null,
      surname: exSur,
      place: exPla,
    },
    meetIndividual: meet
      ? redactHomeStatisticsIndividualExample(
          {
            displayName: displayIndividualName(meet),
            xref: meet.xref,
            isLiving: meet.isLiving,
            birthYear: yearFromDisplayDateString(meet.birthDate),
          },
          options?.viewer ?? { kind: "anonymous" },
        )
      : null,
    charts:
      options?.analyticsSeed != null &&
      options.analyticsSeed > 0 &&
      options.treeId
        ? (await buildHomeChartsFromPythonAnalytics(options.treeId, options.analyticsSeed)) ??
          charts
        : charts,
  };
}
