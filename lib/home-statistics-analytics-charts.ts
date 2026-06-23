import type { HomeStatisticsPayload, HomeStatDonutChart, HomeStatSlice } from "@/types/tree";
import { formatFrequencyBucketDisplayLabel } from "@/lib/analytics-frequency-buckets";

const PYTHON_API_URL = (process.env.PYTHON_API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");

function num(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** Deterministic pick from seed (different salt → different stream). */
function pick(seed: number, salt: number, mod: number): number {
  if (mod <= 0) return 0;
  const x = Math.imul((seed ^ salt) >>> 0, 2654435761) >>> 0;
  return x % mod;
}

function truncateLabel(s: string, max = 46): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function decadeLabel(d: number): string {
  if (!Number.isFinite(d)) return "?";
  return `${Math.floor(d / 10) * 10}s`;
}

function sexLabelFromCode(sex: string): string {
  switch ((sex || "U").trim().toUpperCase()) {
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

type IndividualsJson = {
  by_sex?: Array<{ sex?: string | null; count?: unknown }>;
  birth_by_decade?: Array<{ decade?: number | null; count?: unknown }>;
  top_birth_countries?: Array<{ country?: string | null; count?: unknown }>;
  age_at_death_buckets?: Array<{ bucket?: string | null; count?: unknown }>;
};

type SurnamesJson = {
  summary?: { total_occurrences?: unknown };
  /** Python SQL aliases `surname AS name`. */
  top_surnames?: Array<{ name?: string | null; surname?: string | null; frequency?: unknown }>;
  frequency_distribution?: Array<{ bucket?: string | null; count?: unknown }>;
  soundex_groups?: Array<{
    soundex?: string | null;
    name_count?: unknown;
    total_frequency?: unknown;
  }>;
};

type FamiliesJson = {
  marriage_by_decade?: Array<{ decade?: number | null; count?: unknown }>;
  marriage_country_distribution?: Array<{ country?: string | null; count?: unknown }>;
};

type PlacesJson = {
  top_places?: Array<{ label?: string | null; reference_count?: unknown }>;
  country_distribution?: Array<{ country?: string | null; count?: unknown }>;
  state_distribution?: Array<{ state?: string | null; count?: unknown }>;
};

function slicesFromSex(rows: IndividualsJson["by_sex"]): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({
      label: sexLabelFromCode(String(r.sex ?? "U")),
      value: num(r.count),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

function slicesFromDecades(rows: IndividualsJson["birth_by_decade"]): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r.decade != null && Number.isFinite(Number(r.decade)))
    .map((r) => ({
      label: decadeLabel(Number(r.decade)),
      value: num(r.count),
    }))
    .filter((s) => s.value > 0);
}

function slicesFromCountries(rows: IndividualsJson["top_birth_countries"], take: number): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, take).map((r) => ({
    label: truncateLabel(String(r.country ?? "Unknown")),
    value: num(r.count),
  }));
}

function slicesFromAgeBuckets(rows: IndividualsJson["age_at_death_buckets"]): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({
      label: String(r.bucket ?? "—"),
      value: num(r.count),
    }))
    .filter((s) => s.value > 0);
}

function surnameTopSlices(rows: SurnamesJson["top_surnames"], take: number, summary?: SurnamesJson["summary"]): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  const top = rows.slice(0, take);
  const topSum = top.reduce((a, r) => a + num(r.frequency), 0);
  const totalFromSummary = num(summary?.total_occurrences);
  const totalFromRows = rows.reduce((a, r) => a + num(r.frequency), 0);
  const total = totalFromSummary > 0 ? totalFromSummary : totalFromRows;
  const other = Math.max(0, total - topSum);
  const slices: HomeStatSlice[] = top
    .map((r) => ({
      label: String(r.name ?? r.surname ?? "—"),
      value: num(r.frequency),
    }))
    .filter((s) => s.value > 0);
  if (other > 0) slices.push({ label: "Other", value: other });
  return slices;
}

function slicesFromFreqDist(rows: SurnamesJson["frequency_distribution"]): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({
      label: formatFrequencyBucketDisplayLabel(String(r.bucket ?? "—")),
      value: num(r.count),
    }))
    .filter((s) => s.value > 0);
}

function slicesFromSoundex(rows: SurnamesJson["soundex_groups"], take: number): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  const sorted = [...rows].sort((a, b) => num(b.total_frequency) - num(a.total_frequency));
  return sorted.slice(0, take).map((r) => ({
    label: String(r.soundex ?? "—"),
    value: num(r.total_frequency),
  }));
}

function marriageDecadeSlices(rows: FamiliesJson["marriage_by_decade"]): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r.decade != null && Number.isFinite(Number(r.decade)))
    .map((r) => ({
      label: decadeLabel(Number(r.decade)),
      value: num(r.count),
    }))
    .filter((s) => s.value > 0);
}

function marriageCountrySlices(rows: FamiliesJson["marriage_country_distribution"], take: number): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, take).map((r) => ({
    label: truncateLabel(String(r.country ?? "Unknown")),
    value: num(r.count),
  }));
}

function topPlaceSlices(rows: PlacesJson["top_places"], take: number): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, take).map((r) => ({
    label: truncateLabel(String(r.label ?? "Place")),
    value: num(r.reference_count),
  }));
}

function placeCountrySlices(rows: PlacesJson["country_distribution"], take: number): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, take).map((r) => ({
    label: truncateLabel(String(r.country ?? "Unknown")),
    value: num(r.count),
  }));
}

function placeStateSlices(rows: PlacesJson["state_distribution"], take: number): HomeStatSlice[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, take).map((r) => ({
    label: truncateLabel(String(r.state ?? "Unknown")),
    value: num(r.count),
  }));
}

function emptyChart(line1: string, line2?: string): HomeStatDonutChart {
  return { titleLine1: line1, titleLine2: line2, slices: [] };
}

/**
 * Builds homepage mini-charts from ligneous-python-api analytics endpoints.
 * Uses `seed` so each Randomize press can rotate chart “angles” per subject.
 */
export async function buildHomeChartsFromPythonAnalytics(
  treeId: string,
  seed: number,
): Promise<HomeStatisticsPayload["charts"] | null> {
  const base = `${PYTHON_API_URL}/api/research/trees/${encodeURIComponent(treeId)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const [indRes, surRes, famRes, plcRes] = await Promise.all([
      fetch(`${base}/analytics/individuals`, { signal: ctrl.signal }),
      fetch(`${base}/analytics/surnames?limit=120`, { signal: ctrl.signal }),
      fetch(`${base}/analytics/families`, { signal: ctrl.signal }),
      fetch(`${base}/analytics/places?top_limit=40&country_limit=24&state_limit=24`, { signal: ctrl.signal }),
    ]);
    if (!indRes.ok || !surRes.ok || !famRes.ok || !plcRes.ok) return null;

    const individuals = (await indRes.json()) as IndividualsJson;
    const surnames = (await surRes.json()) as SurnamesJson;
    const families = (await famRes.json()) as FamiliesJson;
    const places = (await plcRes.json()) as PlacesJson;

    const vInd = pick(seed, 11, 4);
    const vSur = pick(seed, 29, 3);
    const vFam = pick(seed, 47, 2);
    const vPlc = pick(seed, 61, 3);

    let indChart: HomeStatDonutChart;
    if (vInd === 1) {
      const slices = slicesFromDecades(individuals.birth_by_decade);
      indChart =
        slices.length > 0
          ? {
              titleLine1: "Birth",
              titleLine2: "by decade",
              slices,
              variant: "line",
              lineSeriesMode: "sliceOrder",
              lineYAxisTitle: "Individuals",
              lineHoverCountsLabel: "individuals",
            }
          : {
              titleLine1: "Gender",
              titleLine2: "distribution",
              slices: slicesFromSex(individuals.by_sex),
              variant: "staggered",
            };
    } else if (vInd === 2) {
      const slices = slicesFromCountries(individuals.top_birth_countries, 8);
      indChart =
        slices.length > 0
          ? {
              titleLine1: "Birth countries",
              titleLine2: "top 8",
              slices,
              variant: "bar",
              barXAxisTitle: "Individuals",
              barHoverCountsLabel: "individuals",
            }
          : {
              titleLine1: "Gender",
              titleLine2: "distribution",
              slices: slicesFromSex(individuals.by_sex),
              variant: "staggered",
            };
    } else if (vInd === 3) {
      const slices = slicesFromAgeBuckets(individuals.age_at_death_buckets);
      indChart =
        slices.length > 0
          ? {
              titleLine1: "Age at death",
              titleLine2: "distribution",
              slices,
              variant: "donut",
            }
          : {
              titleLine1: "Gender",
              titleLine2: "distribution",
              slices: slicesFromSex(individuals.by_sex),
              variant: "staggered",
            };
    } else {
      indChart = {
        titleLine1: "Gender",
        titleLine2: "distribution",
        slices: slicesFromSex(individuals.by_sex),
        variant: "staggered",
      };
    }

    let surChart: HomeStatDonutChart;
    if (vSur === 1) {
      const slices = slicesFromFreqDist(surnames.frequency_distribution);
      surChart =
        slices.length > 0
          ? {
              titleLine1: "Distinct surnames",
              titleLine2: "by occurrence",
              slices,
              variant: "donut",
              legendCountLabel: "surnames",
              caption:
                "Each slice is how many unique surnames appear that often in the tree — not a share of people.",
            }
          : {
              titleLine1: "Surname",
              titleLine2: "distribution",
              slices: surnameTopSlices(surnames.top_surnames, 8, surnames.summary),
              variant: "donut",
            };
    } else if (vSur === 2) {
      const slices = slicesFromSoundex(surnames.soundex_groups, 8);
      surChart =
        slices.length > 0
          ? {
              titleLine1: "Soundex groups",
              titleLine2: "by frequency",
              slices,
              variant: "donut",
            }
          : {
              titleLine1: "Surname",
              titleLine2: "distribution",
              slices: surnameTopSlices(surnames.top_surnames, 8, surnames.summary),
              variant: "donut",
            };
    } else {
      surChart = {
        titleLine1: "Surname",
        titleLine2: "distribution",
        slices: surnameTopSlices(surnames.top_surnames, 8, surnames.summary),
        variant: "donut",
      };
    }

    let famChart: HomeStatDonutChart;
    if (vFam === 1) {
      const slices = marriageCountrySlices(families.marriage_country_distribution, 8);
      famChart =
        slices.length > 0
          ? {
              titleLine1: "Marriage",
              titleLine2: "by country",
              slices,
              variant: "bar",
              barXAxisTitle: "Families",
              barHoverCountsLabel: "families",
            }
          : {
              titleLine1: "Marriages",
              titleLine2: "by decade",
              slices: marriageDecadeSlices(families.marriage_by_decade),
              variant: "line",
              lineSeriesMode: "sliceOrder",
              lineYAxisTitle: "Families",
              lineHoverCountsLabel: "families",
            };
    } else {
      const slices = marriageDecadeSlices(families.marriage_by_decade);
      famChart =
        slices.length > 0
          ? {
              titleLine1: "Marriages",
              titleLine2: "by decade",
              slices,
              variant: "line",
              lineSeriesMode: "sliceOrder",
              lineYAxisTitle: "Families",
              lineHoverCountsLabel: "families",
            }
          : emptyChart("Families", "—");
    }

    let plcChart: HomeStatDonutChart;
    if (vPlc === 1) {
      const slices = placeCountrySlices(places.country_distribution, 8);
      plcChart =
        slices.length > 0
          ? {
              titleLine1: "Places",
              titleLine2: "by country",
              slices,
              variant: "bar",
              barXAxisTitle: "Places",
              barHoverCountsLabel: "places",
            }
          : {
              titleLine1: "Top places",
              titleLine2: "by references",
              slices: topPlaceSlices(places.top_places, 10),
              variant: "bar",
              barXAxisTitle: "References",
              barHoverCountsLabel: "references",
            };
    } else if (vPlc === 2) {
      const slices = placeStateSlices(places.state_distribution, 8);
      plcChart =
        slices.length > 0
          ? {
              titleLine1: "Places",
              titleLine2: "by state / region",
              slices,
              variant: "bar",
              barXAxisTitle: "Places",
              barHoverCountsLabel: "places",
            }
          : {
              titleLine1: "Top places",
              titleLine2: "by references",
              slices: topPlaceSlices(places.top_places, 10),
              variant: "bar",
              barXAxisTitle: "References",
              barHoverCountsLabel: "references",
            };
    } else {
      plcChart = {
        titleLine1: "Top places",
        titleLine2: "by references",
        slices: topPlaceSlices(places.top_places, 10),
        variant: "bar",
        barXAxisTitle: "References",
        barHoverCountsLabel: "references",
      };
    }

    return {
      individuals: indChart,
      surnames: surChart,
      families: famChart,
      places: plcChart,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
