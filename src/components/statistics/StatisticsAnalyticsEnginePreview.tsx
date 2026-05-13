"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Data, Layout } from "plotly.js";
import { BarChart3 } from "lucide-react";
import { PlotlyChart } from "@/components/plotly/PlotlyChart";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import { messageFromResearchErrorJson } from "@/lib/research-api-client-error";

const BAR = "#3d5a4a";
const FONT = "#2a2a2a";

/** Multi-slice pies: use when API colors are missing or all the same placeholder gray. */
const PIE_SLICE_PALETTE = [
  "#3d5a4a",
  "#6b8cae",
  "#8b5a6b",
  "#c4a574",
  "#4a6fa5",
  "#7c9885",
  "#9b6b9e",
  "#5c7570",
  "#b8956a",
  "#6e7c8f",
  "#8f6b5c",
  "#5b7d8f",
  "#7d6b8e",
  "#8b7355",
  "#4d7a6b",
  "#916b7a",
  "#6b7e9a",
  "#8a7b4d",
  "#5d6e7a",
  "#7a5c6e",
];

const PIE_SLICE_OUTLINE = { color: "rgba(255,255,255,0.78)", width: 1 } as const;

/** Placeholder / neutral hex values stored when no real tag color exists. */
const PIE_COLOR_TREAT_AS_MISSING = new Set(
  ["", "#6B7280", "#64748B", "#9CA3AF", "#94A3B8", "#A1A1AA", "#78716C", "#737373"].map((c) => c.toUpperCase()),
);

function normalizeHexColor(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (/^#[0-9A-Fa-f]{6}$/i.test(t)) return t.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/i.test(t) && t.length === 4) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

/** Prefer a real stored hex; otherwise cycle the palette so adjacent slices differ. */
function pieColorsFromOptionalHex(preferred: (string | null | undefined)[]): string[] {
  const used = new Set<string>();
  return preferred.map((raw, i) => {
    const hex = normalizeHexColor(raw);
    if (hex && !PIE_COLOR_TREAT_AS_MISSING.has(hex) && !used.has(hex)) {
      used.add(hex);
      return hex;
    }
    let idx = i;
    let guard = 0;
    while (guard < PIE_SLICE_PALETTE.length + 5) {
      const c = PIE_SLICE_PALETTE[idx % PIE_SLICE_PALETTE.length];
      if (!used.has(c)) {
        used.add(c);
        return c;
      }
      idx += 1;
      guard += 1;
    }
    const fallback = PIE_SLICE_PALETTE[i % PIE_SLICE_PALETTE.length];
    used.add(fallback);
    return fallback;
  });
}

type FrequencyBucket = { bucket: string; count: number };

type TopNameRow = { name: string; frequency: number };

type GivenNamesPayload = {
  summary?: Record<string, number | undefined>;
  top_names?: TopNameRow[];
  frequency_distribution?: FrequencyBucket[];
};

type SurnamesPayload = {
  summary?: Record<string, number | undefined>;
  /** Same shape as Python analytics `top_surnames` */
  top_surnames?: TopNameRow[];
  frequency_distribution?: FrequencyBucket[];
};

type CountRow = { count: number };

type LifespanRow = {
  id?: string;
  full_name?: string | null;
  age_at_death?: number | null;
  birth_year?: number | null;
  death_year?: number | null;
  sex?: string | null;
};

type IndividualsPayload = {
  summary?: Record<string, number | undefined>;
  /** Child vs spouse roles from gedcom_family_children_v2 + gedcom_families_v2 */
  family_roles?: {
    only_as_child?: number;
    only_as_spouse?: number;
    multiple_families_as_child?: number;
    multiple_families_as_spouse?: number;
  };
  lifespan_averages?: {
    avg_lifespan_male?: number | null;
    avg_lifespan_female?: number | null;
    males_with_age_at_death?: number;
    females_with_age_at_death?: number;
  };
  oldest_lived?: LifespanRow[];
  youngest_died?: LifespanRow[];
  associations?: { association_records?: number };
  /** M/F/unknown × living/dead counts for pie chart */
  sex_by_living?: {
    living_male?: number;
    dead_male?: number;
    living_female?: number;
    dead_female?: number;
    living_unknown?: number;
    dead_unknown?: number;
  };
  by_sex?: ({ sex: string } & CountRow)[];
  birth_by_decade?: ({ decade: number } & CountRow)[];
  death_by_decade?: ({ decade: number } & CountRow)[];
  age_at_death_buckets?: ({ bucket: string } & CountRow)[];
  top_birth_countries?: ({ country: string } & CountRow)[];
};

type FamiliesPayload = {
  summary?: {
    total?: number;
    both_partners?: number;
    husband_only?: number;
    wife_only?: number;
    no_partner_record?: number;
    with_marriage_year?: number;
    divorced?: number;
    with_children_denorm?: number;
    with_marriage_place?: number;
  };
  junction_counts?: {
    note_links?: number;
    families_with_notes?: number;
    source_links?: number;
    families_with_sources?: number;
    event_links?: number;
    families_with_events?: number;
  };
  children_record_extremes?: { max_children?: number; min_children?: number };
  families_with_nonbiological_children?: number;
  families_with_marriage_event?: number;
  marriage_by_decade?: ({ decade: number } & CountRow)[];
  marriage_country_distribution?: ({ country: string } & CountRow)[];
};

type EventTypeRow = {
  tag?: string;
  /** Friendly label (from catalog or mapped GEDCOM tag). */
  label?: string;
  is_custom?: boolean;
  count: number;
};

type EventsPayload = {
  summary?: {
    total?: number;
    with_date?: number;
    with_place?: number;
    with_custom_type?: number;
  };
  origin_breakdown?: {
    standard_catalog_events?: number;
    custom_catalog_events?: number;
    unlinked_to_catalog?: number;
  };
  /** How many different standard vs custom type definitions appear in this tree. */
  type_catalog_breakdown?: {
    distinct_standard_types?: number;
    distinct_custom_types?: number;
  };
  junction_counts?: {
    links_to_individuals?: number;
    links_to_families?: number;
    events_with_notes?: number;
    note_links?: number;
    events_with_sources?: number;
    source_links?: number;
    media_links?: number;
  };
  by_event_type?: EventTypeRow[];
  year_by_decade?: ({ decade: number } & CountRow)[];
  place_country_distribution?: ({ country: string } & CountRow)[];
};

type PlacesPayload = {
  summary?: {
    total_places?: number;
    with_coordinates?: number;
    with_country?: number;
    with_state?: number;
    with_county?: number;
    with_parsed_name?: number;
  };
  reference_counts?: {
    birth_place_links?: number;
    death_place_links?: number;
    marriage_place_links?: number;
    divorce_place_links?: number;
    event_place_links?: number;
    media_place_links?: number;
  };
  country_distribution?: ({ country: string } & CountRow)[];
  state_distribution?: ({ state: string } & CountRow)[];
  top_places?: ({
    place_id?: string;
    label?: string;
    country?: string;
    reference_count?: number;
  })[];
};

type DatesPayload = {
  summary?: {
    total_dates?: number;
    with_year?: number;
    with_month?: number;
    with_day?: number;
    with_original_text?: number;
    with_end_components?: number;
    range_style_records?: number;
  };
  reference_counts?: {
    birth_date_links?: number;
    death_date_links?: number;
    marriage_date_links?: number;
    divorce_date_links?: number;
    event_date_links?: number;
    media_date_links?: number;
  };
  by_date_type?: ({ date_type: string } & CountRow)[];
  calendar_distribution?: ({ calendar: string } & CountRow)[];
  year_by_decade?: ({ decade: number } & CountRow)[];
  top_dates?: ({
    date_id?: string;
    label?: string;
    date_type?: string;
    reference_count?: number;
  })[];
};

type MediaPayload = {
  summary?: {
    total_gedcom_media?: number;
    with_title?: number;
    with_form?: number;
    media_tag_assignment_rows?: number;
    distinct_tags_on_media?: number;
  };
  link_counts?: {
    individual_media_links?: number;
    family_media_links?: number;
    event_media_links?: number;
    source_media_links?: number;
    media_place_links?: number;
    media_date_links?: number;
  };
  albums?: {
    album_count_for_tree?: number;
    album_gedcom_media_links?: number;
  };
  top_places_for_media?: Array<{
    place_id?: string;
    label?: string;
    country?: string;
    link_count?: number;
  }>;
  top_dates_for_media?: Array<{
    date_id?: string;
    label?: string;
    date_type?: string;
    link_count?: number;
  }>;
  top_individuals_by_media?: Array<{
    individual_id?: string;
    full_name?: string | null;
    media_link_count?: number;
  }>;
  top_families_by_media?: Array<{
    family_id?: string;
    xref?: string;
    /** e.g. Family of X and Y from spouse full_name values */
    label?: string;
    media_link_count?: number;
  }>;
  top_events_by_media?: Array<{
    event_id?: string;
    label?: string;
    event_type?: string;
    media_link_count?: number;
  }>;
  top_media_tags?: Array<{
    tag_id?: string;
    name?: string;
    color?: string;
    tag_count?: number;
  }>;
};

type OpenQuestionsPayload = {
  summary?: {
    total?: number;
    resolved?: number;
    unresolved?: number;
  };
  top_individuals?: Array<{
    individual_id?: string;
    full_name?: string | null;
    question_link_count?: number;
  }>;
  top_media?: Array<{
    media_id?: string;
    label?: string;
    question_link_count?: number;
  }>;
  top_families?: Array<{
    family_id?: string;
    xref?: string;
    label?: string;
    question_link_count?: number;
  }>;
  top_events?: Array<{
    event_id?: string;
    label?: string;
    event_type?: string;
    question_link_count?: number;
  }>;
};

type NotesPayload = {
  summary?: {
    total_notes?: number;
    top_level_notes?: number;
    with_xref?: number;
    avg_content_length?: number;
    distinct_notes_linked?: number;
    orphan_notes?: number;
  };
  link_counts?: {
    individual_note_links?: number;
    family_note_links?: number;
    event_note_links?: number;
    source_note_links?: number;
  };
  top_notes?: Array<{
    note_id?: string;
    xref?: string;
    preview?: string;
    link_count?: number;
  }>;
  top_individuals?: Array<{
    individual_id?: string;
    full_name?: string | null;
    note_link_count?: number;
  }>;
  top_families?: Array<{
    family_id?: string;
    xref?: string;
    label?: string;
    note_link_count?: number;
  }>;
  top_events?: Array<{
    event_id?: string;
    label?: string;
    event_type?: string;
    note_link_count?: number;
  }>;
  top_sources?: Array<{
    source_id?: string;
    xref?: string;
    label?: string;
    note_link_count?: number;
  }>;
};

function truncateChartLabel(raw: string, maxLen = 52): string {
  const s = raw.trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

/**
 * Short y-axis label for person names (horizontal bars). Prefer first initial + surname
 * when there are three or more tokens so bars are not squeezed by long margins.
 */
function abbreviateDisplayNameForChart(name: string, maxLen = 22): string {
  const s = name.replace(/\s+/g, " ").trim();
  if (!s) return "—";
  if (s.length <= maxLen) return s;
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return truncateChartLabel(parts[0]!, maxLen);
  if (parts.length === 2) return truncateChartLabel(`${parts[0]} ${parts[1]}`, maxLen);
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const letter = first.slice(0, 1).toUpperCase();
  const compact = `${letter}. ${last}`;
  return truncateChartLabel(compact, maxLen);
}

/**
 * Compact family label for horizontal bars (card title already says “families”).
 * Drops the long “Family of … and …” wording in favor of abbreviated partner names.
 */
function formatFamilyOfPartnerLabelChart(label: string | undefined, fallbackId: string): string {
  const raw = (label ?? "").trim();
  if (!raw) return truncateChartLabel(`Fam ${fallbackId}`, 28);
  const prefix = "Family of ";
  if (!raw.toLowerCase().startsWith(prefix.toLowerCase())) {
    return truncateChartLabel(raw, 34);
  }
  const body = raw.slice(prefix.length).trim();
  const joint = /\s+and\s+/i;
  if (joint.test(body)) {
    const idx = body.search(joint);
    const a = formatGedcomFullNameForDisplay(body.slice(0, idx).trim()) || body.slice(0, idx).trim();
    const b = formatGedcomFullNameForDisplay(body.slice(idx).replace(/^\s+and\s+/i, "").trim()) || "";
    const sa = abbreviateDisplayNameForChart(a, 15);
    const sb = abbreviateDisplayNameForChart(b, 15);
    return truncateChartLabel(`${sa} · ${sb}`, 34);
  }
  const one = abbreviateDisplayNameForChart(formatGedcomFullNameForDisplay(body) || body, 30);
  return truncateChartLabel(one, 34);
}

/** API returns `Family of …` using raw gedcom full_name; normalize slashes like elsewhere. */
function formatFamilyOfPartnerLabel(label: string | undefined, fallbackId: string, maxLen = 52): string {
  const raw = (label ?? "").trim();
  if (!raw) return truncateChartLabel(`Family ${fallbackId}`, maxLen);
  const prefix = "Family of ";
  if (!raw.toLowerCase().startsWith(prefix.toLowerCase())) {
    return truncateChartLabel(raw, maxLen);
  }
  const body = raw.slice(prefix.length).trim();
  const joint = /\s+and\s+/i;
  if (joint.test(body)) {
    const idx = body.search(joint);
    const a = body.slice(0, idx).trim();
    const b = body.slice(idx).replace(/^\s+and\s+/i, "").trim();
    const fa = formatGedcomFullNameForDisplay(a) || a;
    const fb = formatGedcomFullNameForDisplay(b) || b;
    return truncateChartLabel(`${prefix}${fa} and ${fb}`, maxLen);
  }
  const one = formatGedcomFullNameForDisplay(body) || body;
  return truncateChartLabel(`${prefix}${one}`, maxLen);
}

/** True when every numeric value in the spec is zero, or data is a single “no data” placeholder pie. */
function isAnalyticsPlotSpecEmpty(spec: { data: Data[]; layout: Partial<Layout> }): boolean {
  const traces = spec.data ?? [];
  if (traces.length === 0) return true;

  for (const t of traces) {
    const tr = t as {
      type?: string;
      labels?: string[];
      values?: unknown[];
      x?: unknown[];
      y?: unknown[];
      orientation?: string;
    };
    if (tr.type === "pie") {
      const values = (tr.values ?? []).map((v) => Number(v) || 0);
      const labels = tr.labels ?? [];
      const sum = values.reduce((a, b) => a + b, 0);
      if (sum <= 0) continue;
      const lab = labels.length === 1 ? String(labels[0]).trim() : "";
      const placeholderSingleSlice =
        values.length === 1 &&
        Math.abs(values[0]! - 1) < 1e-9 &&
        labels.length === 1 &&
        (/^no\b/i.test(lab) || /^nothing\b/i.test(lab));
      if (placeholderSingleSlice) continue;
      return false;
    }
    if (tr.type === "bar") {
      const nums =
        tr.orientation === "h"
          ? (tr.x ?? []).map((v) => Number(v) || 0)
          : (tr.y ?? []).map((v) => Number(v) || 0);
      if (nums.length === 0) continue;
      if (nums.some((n) => n > 0)) return false;
    }
  }
  return true;
}

function StatisticsPlotly({
  spec,
  emptyMessage,
  className = "min-h-[300px]",
}: {
  spec: { data: Data[]; layout: Partial<Layout> };
  emptyMessage: string;
  className?: string;
}) {
  if (isAnalyticsPlotSpecEmpty(spec)) {
    return (
      <p className="text-muted mx-auto max-w-md py-10 text-center font-body text-sm leading-relaxed">{emptyMessage}</p>
    );
  }
  return (
    <PlotlyChart
      data={spec.data}
      layout={spec.layout}
      config={{ displayModeBar: false, responsive: true }}
      className={className}
    />
  );
}

function horizontalBar(labels: string[], values: number[], title: string): { data: Data[]; layout: Partial<Layout> } {
  const pairs = labels.map((l, i) => ({ l, v: values[i] ?? 0 }));
  pairs.sort((a, b) => a.v - b.v);
  const maxLabelLen = pairs.reduce((m, p) => Math.max(m, String(p.l).length), 8);
  /** Cap width so long labels do not dominate the chart; labels should be pre-shortened where needed. */
  const capped = Math.min(maxLabelLen, 38);
  const leftMargin = Math.min(220, 40 + capped * 5);
  return {
    data: [
      {
        type: "bar",
        orientation: "h",
        x: pairs.map((p) => p.v),
        y: pairs.map((p) => p.l),
        marker: { color: BAR },
      },
    ],
    layout: {
      title: { text: title, font: { size: 15 } },
      margin: { l: leftMargin, r: 28, t: 48, b: 48 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: FONT, size: 12 },
      xaxis: { title: { text: "Count" }, automargin: true },
      yaxis: {
        automargin: true,
        tickfont: { size: 11 },
      },
      height: Math.min(720, 120 + pairs.length * 22),
    },
  };
}

const SEX_LIVING_SEGMENTS: {
  key: keyof NonNullable<IndividualsPayload["sex_by_living"]>;
  label: string;
  color: string;
}[] = [
  { key: "living_male", label: "Living · male", color: "#6b9e88" },
  { key: "dead_male", label: "Dead · male", color: "#3d5a4a" },
  { key: "living_female", label: "Living · female", color: "#d4a5bc" },
  { key: "dead_female", label: "Dead · female", color: "#8b5a6b" },
  { key: "living_unknown", label: "Living · unknown", color: "#c5cbc2" },
  { key: "dead_unknown", label: "Dead · unknown", color: "#7c8478" },
];

/** Sex × living/dead — six-segment pie (drops zero slices). */
function sexLivingPie(data: IndividualsPayload["sex_by_living"]): { data: Data[]; layout: Partial<Layout> } {
  const pairs = SEX_LIVING_SEGMENTS.map((s) => ({
    label: s.label,
    value: Number(data?.[s.key]) || 0,
    color: s.color,
  })).filter((p) => p.value > 0);

  return {
    data: [
      {
        type: "pie",
        labels: pairs.map((p) => p.label),
        values: pairs.map((p) => p.value),
        marker: { colors: pairs.map((p) => p.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** Legacy 3-way pie if sex_by_living is absent. */
function sexPieFallback(rows: IndividualsPayload["by_sex"]): { data: Data[]; layout: Partial<Layout> } {
  const dataRows = rows ?? [];
  const labels = dataRows.map((r) => (r.sex === "U" ? "Unknown" : String(r.sex)));
  const values = dataRows.map((r) => Number(r.count) || 0);
  const colors = labels.map((l) => (l === "M" ? "#3d5a4a" : l === "F" ? "#8b5a6b" : "#7c8478"));
  return {
    data: [
      {
        type: "pie",
        labels: labels.length ? labels : ["No data"],
        values: values.length ? values : [1],
        marker: { colors: labels.length ? colors : ["#ccc"], line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

function sexPieFromIndividuals(individuals: IndividualsPayload): { data: Data[]; layout: Partial<Layout> } {
  const sl = individuals.sex_by_living;
  if (sl != null && typeof sl === "object") {
    const total = SEX_LIVING_SEGMENTS.reduce((acc, s) => acc + (Number(sl[s.key]) || 0), 0);
    if (total > 0) return sexLivingPie(sl);
  }
  return sexPieFallback(individuals.by_sex);
}

const PARTNER_MIX_SEGMENTS: {
  key: keyof Pick<
    NonNullable<FamiliesPayload["summary"]>,
    "both_partners" | "husband_only" | "wife_only" | "no_partner_record"
  >;
  label: string;
  color: string;
}[] = [
  { key: "both_partners", label: "Both partners", color: "#3d5a4a" },
  { key: "husband_only", label: "Father only", color: "#6b9e88" },
  { key: "wife_only", label: "Mother only", color: "#8b5a6b" },
  { key: "no_partner_record", label: "No spouse linked", color: "#a8a29e" },
];

/** How often place records are attached to individuals, families, events, and media. */
function placesReferencePie(rc: PlacesPayload["reference_counts"]): { data: Data[]; layout: Partial<Layout> } {
  const segments: { label: string; value: number; color: string }[] = [
    { label: "Birth", value: Number(rc?.birth_place_links) || 0, color: "#3d5a4a" },
    { label: "Death", value: Number(rc?.death_place_links) || 0, color: "#5c7a6a" },
    { label: "Marriage", value: Number(rc?.marriage_place_links) || 0, color: "#6b8cae" },
    { label: "Divorce", value: Number(rc?.divorce_place_links) || 0, color: "#9ca3af" },
    { label: "Events", value: Number(rc?.event_place_links) || 0, color: "#8b5a6b" },
    { label: "Media links", value: Number(rc?.media_place_links) || 0, color: "#c4a574" },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No data"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  return {
    data: [
      {
        type: "pie",
        labels: segments.map((s) => s.label),
        values: segments.map((s) => s.value),
        marker: { colors: segments.map((s) => s.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** How often date records are attached to individuals, families, events, and media. */
function datesReferencePie(rc: DatesPayload["reference_counts"]): { data: Data[]; layout: Partial<Layout> } {
  const segments: { label: string; value: number; color: string }[] = [
    { label: "Birth", value: Number(rc?.birth_date_links) || 0, color: "#3d5a4a" },
    { label: "Death", value: Number(rc?.death_date_links) || 0, color: "#5c7a6a" },
    { label: "Marriage", value: Number(rc?.marriage_date_links) || 0, color: "#6b8cae" },
    { label: "Divorce", value: Number(rc?.divorce_date_links) || 0, color: "#9ca3af" },
    { label: "Events", value: Number(rc?.event_date_links) || 0, color: "#8b5a6b" },
    { label: "Media links", value: Number(rc?.media_date_links) || 0, color: "#c4a574" },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No data"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  return {
    data: [
      {
        type: "pie",
        labels: segments.map((s) => s.label),
        values: segments.map((s) => s.value),
        marker: { colors: segments.map((s) => s.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** Top app tags assigned to GEDCOM media (tag colors from the tags table when set). */
function mediaTagPie(rows: MediaPayload["top_media_tags"]): { data: Data[]; layout: Partial<Layout> } {
  const list = rows ?? [];
  if (list.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No tags on media"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  const colors = pieColorsFromOptionalHex(list.map((r) => r.color));

  return {
    data: [
      {
        type: "pie",
        labels: list.map((r) => String(r.name ?? "—")),
        values: list.map((r) => Number(r.tag_count) || 0),
        marker: {
          colors,
          line: PIE_SLICE_OUTLINE,
        },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>assignments: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** Resolved vs not resolved (open + archived) for open_questions. */
function openQuestionsResolvedPie(s: OpenQuestionsPayload["summary"]): { data: Data[]; layout: Partial<Layout> } {
  const resolved = Number(s?.resolved) || 0;
  const unresolved = Number(s?.unresolved) || 0;
  const segments: { label: string; value: number; color: string }[] = [
    { label: "Resolved", value: resolved, color: "#3d5a4a" },
    { label: "Not resolved (open or archived)", value: unresolved, color: "#c4a574" },
  ].filter((x) => x.value > 0);

  if (segments.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No open questions"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  return {
    data: [
      {
        type: "pie",
        labels: segments.map((x) => x.label),
        values: segments.map((x) => x.value),
        marker: { colors: segments.map((x) => x.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** Note junction rows: which entity types hold NOTE pointers (four junction tables). */
function notesJunctionTypePie(lc: NotesPayload["link_counts"]): { data: Data[]; layout: Partial<Layout> } {
  const segments: { label: string; value: number; color: string }[] = [
    { label: "Individual ↔ note", value: Number(lc?.individual_note_links) || 0, color: "#3d5a4a" },
    { label: "Family ↔ note", value: Number(lc?.family_note_links) || 0, color: "#6b8cae" },
    { label: "Event ↔ note", value: Number(lc?.event_note_links) || 0, color: "#8b5a6b" },
    { label: "Source ↔ note", value: Number(lc?.source_note_links) || 0, color: "#c4a574" },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No note links"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  return {
    data: [
      {
        type: "pie",
        labels: segments.map((s) => s.label),
        values: segments.map((s) => s.value),
        marker: { colors: segments.map((s) => s.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>junction rows: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** Event instances: standard GEDCOM catalog vs custom catalog vs missing junction. */
function eventOriginPie(ob: EventsPayload["origin_breakdown"]): { data: Data[]; layout: Partial<Layout> } {
  const standard = Number(ob?.standard_catalog_events) || 0;
  const custom = Number(ob?.custom_catalog_events) || 0;
  const unlinked = Number(ob?.unlinked_to_catalog) || 0;
  const segments: { label: string; value: number; color: string }[] = [
    { label: "Standard GEDCOM types", value: standard, color: "#3d5a4a" },
    { label: "Custom types", value: custom, color: "#8b5a6b" },
    { label: "Not linked to type catalog", value: unlinked, color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No data"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  return {
    data: [
      {
        type: "pie",
        labels: segments.map((s) => s.label),
        values: segments.map((s) => s.value),
        marker: { colors: segments.map((s) => s.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

function familyPartnerPie(summary: FamiliesPayload["summary"]): { data: Data[]; layout: Partial<Layout> } {
  const pairs = PARTNER_MIX_SEGMENTS.map((s) => ({
    label: s.label,
    value: Number(summary?.[s.key]) || 0,
    color: s.color,
  })).filter((p) => p.value > 0);

  if (pairs.length === 0) {
    return {
      data: [
        {
          type: "pie",
          labels: ["No data"],
          values: [1],
          marker: { colors: ["#e5e5e5"] },
          textinfo: "label",
        },
      ],
      layout: pieLayoutBase(),
    };
  }

  return {
    data: [
      {
        type: "pie",
        labels: pairs.map((p) => p.label),
        values: pairs.map((p) => p.value),
        marker: { colors: pairs.map((p) => p.color), line: PIE_SLICE_OUTLINE },
        textinfo: "label+percent",
        hovertemplate: "%{label}<br>count: %{value}<br>%{percent}<extra></extra>",
      },
    ],
    layout: pieLayoutBase(),
  };
}

/** Room for outside slice labels (Plotly draws them above/beside the pie). */
function pieLayoutBase(): Partial<Layout> {
  return {
    margin: { l: 32, r: 32, t: 80, b: 92 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: FONT, size: 12 },
    showlegend: true,
    legend: { orientation: "h", y: -0.2, yanchor: "top" },
    height: 440,
  };
}

function verticalBar(
  categories: string[],
  values: number[],
  title: string,
  xTitle: string,
  opts?: { yAxisTitle?: string; height?: number },
): { data: Data[]; layout: Partial<Layout> } {
  const yAxisTitle = opts?.yAxisTitle ?? "Count";
  const height = opts?.height ?? 340;
  return {
    data: [
      {
        type: "bar",
        x: categories,
        y: values,
        marker: { color: BAR },
      },
    ],
    layout: {
      title: { text: title, font: { size: 15 } },
      margin: { l: 48, r: 16, t: 48, b: 72 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: FONT, size: 12 },
      xaxis: {
        title: { text: xTitle },
        tickangle: -35,
        automargin: true,
      },
      yaxis: { title: { text: yAxisTitle } },
      height,
    },
  };
}

type Props = {
  treeId: string | null;
};

export function StatisticsAnalyticsEnginePreview({ treeId }: Props) {
  const [given, setGiven] = useState<GivenNamesPayload | null>(null);
  const [surnames, setSurnames] = useState<SurnamesPayload | null>(null);
  const [individuals, setIndividuals] = useState<IndividualsPayload | null>(null);
  const [families, setFamilies] = useState<FamiliesPayload | null>(null);
  const [events, setEvents] = useState<EventsPayload | null>(null);
  const [places, setPlaces] = useState<PlacesPayload | null>(null);
  const [dates, setDates] = useState<DatesPayload | null>(null);
  const [media, setMedia] = useState<MediaPayload | null>(null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestionsPayload | null>(null);
  const [notes, setNotes] = useState<NotesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!treeId) return;
    setLoading(true);
    setErr(null);
    try {
      const limit = 30;
      const base = `/api/research/trees/${encodeURIComponent(treeId)}/analytics`;
      const [gRes, sRes, iRes, fRes, eRes, pRes, dRes, mRes, oqRes, nRes] = await Promise.all([
        fetch(`${base}/given-names?limit=${limit}`, { cache: "no-store" }),
        fetch(`${base}/surnames?limit=${limit}`, { cache: "no-store" }),
        fetch(`${base}/individuals?top_n=10`, { cache: "no-store" }),
        fetch(`${base}/families`, { cache: "no-store" }),
        fetch(`${base}/events`, { cache: "no-store" }),
        fetch(`${base}/places`, { cache: "no-store" }),
        fetch(`${base}/dates`, { cache: "no-store" }),
        fetch(`${base}/media?top_n=10`, { cache: "no-store" }),
        fetch(`${base}/open-questions?top_n=10`, { cache: "no-store" }),
        fetch(`${base}/notes?top_n=10`, { cache: "no-store" }),
      ]);
      const gJson = await gRes.json().catch(() => null);
      const sJson = await sRes.json().catch(() => null);
      const iJson = await iRes.json().catch(() => null);
      const fJson = await fRes.json().catch(() => null);
      const eJson = await eRes.json().catch(() => null);
      const pJson = await pRes.json().catch(() => null);
      const dJson = await dRes.json().catch(() => null);
      const mJson = await mRes.json().catch(() => null);
      const oqJson = await oqRes.json().catch(() => null);
      const nJson = await nRes.json().catch(() => null);
      if (!gRes.ok) {
        throw new Error(messageFromResearchErrorJson(gJson, gRes.status));
      }
      if (!sRes.ok) {
        throw new Error(messageFromResearchErrorJson(sJson, sRes.status));
      }
      if (!iRes.ok) {
        throw new Error(messageFromResearchErrorJson(iJson, iRes.status));
      }
      if (!fRes.ok) {
        throw new Error(messageFromResearchErrorJson(fJson, fRes.status));
      }
      if (!eRes.ok) {
        throw new Error(messageFromResearchErrorJson(eJson, eRes.status));
      }
      if (!pRes.ok) {
        throw new Error(messageFromResearchErrorJson(pJson, pRes.status));
      }
      if (!dRes.ok) {
        throw new Error(messageFromResearchErrorJson(dJson, dRes.status));
      }
      if (!mRes.ok) {
        throw new Error(messageFromResearchErrorJson(mJson, mRes.status));
      }
      if (!oqRes.ok) {
        throw new Error(messageFromResearchErrorJson(oqJson, oqRes.status));
      }
      if (!nRes.ok) {
        throw new Error(messageFromResearchErrorJson(nJson, nRes.status));
      }
      setGiven(gJson as GivenNamesPayload);
      setSurnames(sJson as SurnamesPayload);
      setIndividuals(iJson as IndividualsPayload);
      setFamilies(fJson as FamiliesPayload);
      setEvents(eJson as EventsPayload);
      setPlaces(pJson as PlacesPayload);
      setDates(dJson as DatesPayload);
      setMedia(mJson as MediaPayload);
      setOpenQuestions(oqJson as OpenQuestionsPayload);
      setNotes(nJson as NotesPayload);
    } catch (e) {
      setGiven(null);
      setSurnames(null);
      setIndividuals(null);
      setFamilies(null);
      setEvents(null);
      setPlaces(null);
      setDates(null);
      setMedia(null);
      setOpenQuestions(null);
      setNotes(null);
      setErr(e instanceof Error ? e.message : "Failed to load research analytics.");
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!treeId) {
    return (
      <div
        role="status"
        className="border-border-subtle text-heading rounded-xl border bg-surface-inset p-6 font-body text-sm shadow-sm"
      >
        <p className="font-accent text-lg">Public tree not configured</p>
        <p className="text-muted mt-2">
          Set <code className="text-heading bg-surface px-1 py-0.5 text-xs">PUBLIC_RESEARCH_TREE_ID</code> or{" "}
          <code className="text-heading bg-surface px-1 py-0.5 text-xs">PUBLIC_STORY_TREE_ID</code>, and ensure{" "}
          <code className="text-heading bg-surface px-1 py-0.5 text-xs">PYTHON_API_URL</code> points at ligneous-python-api.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Statistics engine analytics preview" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-heading size-5 shrink-0 opacity-90" aria-hidden />
          <h2 className="font-accent text-heading text-xl tracking-tight">Stats engine (research analytics)</h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="border-border-subtle text-heading hover:bg-surface rounded-lg border bg-surface-2 px-3 py-1.5 font-body text-sm disabled:opacity-50"
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>
      <p className="text-muted max-w-3xl font-body text-sm leading-relaxed">
        This test section calls the research proxy only:{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">GET …/analytics/given-names</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/surnames</code>, and{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/individuals</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/families</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/events</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/places</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/dates</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/media</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/open-questions</code>,{" "}
        <code className="bg-surface text-heading rounded px-1 py-0.5 text-xs">…/analytics/notes</code> → ligneous-python-api. There is no Prisma
        fallback here so you can see real upstream failures.
      </p>

      {err ? (
        <div
          role="alert"
          className="border-border-subtle rounded-lg border border-[#b85450]/35 bg-[#fff5f5] px-4 py-3 font-body text-sm text-[#6b2824]"
        >
          {err}
        </div>
      ) : null}

      {loading && !given && !err ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-border-subtle rounded-xl border bg-surface-elevated p-4 shadow-sm">
              <div className="bg-surface skeleton mb-4 h-5 w-48 rounded" />
              <div className="skeleton h-[320px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : null}

      {given && surnames && individuals && families && events && places && dates && media && openQuestions && notes ? (
        <>
          <div id="stats-given-surnames" className="scroll-mt-24 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryPill label="Unique given names" value={given.summary?.total_unique_names} />
              <SummaryPill label="Individuals w/ names" value={given.summary?.total_individuals_with_names} />
              <SummaryPill label="Unique surnames" value={surnames.summary?.total_unique_surnames} />
              <SummaryPill label="Surname occurrences" value={surnames.summary?.total_occurrences} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Top given names" description="From gedcom_given_names_v2 aggregates.">
                <PlotlyFromPayload
                  given={given}
                  type="given-top"
                />
              </ChartCard>
              <ChartCard title="Given names — frequency buckets" description="Distinct names per occurrence bucket.">
                <PlotlyFromPayload given={given} type="given-freq" />
              </ChartCard>
              <ChartCard title="Top surnames" description="From gedcom_surnames_v2.">
                <PlotlyFromPayload surnames={surnames} type="sur-top" />
              </ChartCard>
              <ChartCard title="Surnames — frequency buckets" description="Distinct surnames per bucket.">
                <PlotlyFromPayload surnames={surnames} type="sur-freq" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-individuals" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">Individuals</h3>
            <p className="text-muted mb-4 font-body text-sm">
              Row-level fields from <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_individuals_v2</code>; family roles use{" "}
              <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_family_children_v2</code> (child) and partner columns on{" "}
              <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_families_v2</code> (spouse).
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Total individuals" value={individuals.summary?.total} />
              <SummaryPill label="Living" value={individuals.summary?.living} />
              <SummaryPill label="Deceased" value={individuals.summary?.deceased} />
              <SummaryPill label="With birth year" value={individuals.summary?.with_birth_year} />
              <SummaryPill label="With death year" value={individuals.summary?.with_death_year} />
              <SummaryPill
                label="Only as child (not spouse in any family)"
                value={individuals.family_roles?.only_as_child}
              />
              <SummaryPill
                label="Only as spouse (not child in any family)"
                value={individuals.family_roles?.only_as_spouse}
              />
              <SummaryPill
                label="In multiple families as child"
                value={individuals.family_roles?.multiple_families_as_child}
              />
              <SummaryPill
                label="In multiple families as spouse"
                value={individuals.family_roles?.multiple_families_as_spouse}
              />
              <SummaryPill
                label="Avg lifespan · male (years)"
                value={individuals.lifespan_averages?.avg_lifespan_male}
                hint={
                  individuals.lifespan_averages?.males_with_age_at_death != null
                    ? `n = ${individuals.lifespan_averages.males_with_age_at_death.toLocaleString()} with age_at_death`
                    : undefined
                }
              />
              <SummaryPill
                label="Avg lifespan · female (years)"
                value={individuals.lifespan_averages?.avg_lifespan_female}
                hint={
                  individuals.lifespan_averages?.females_with_age_at_death != null
                    ? `n = ${individuals.lifespan_averages.females_with_age_at_death.toLocaleString()} with age_at_death`
                    : undefined
                }
              />
              <SummaryPill
                label="GEDCOM ASSO rows"
                value={individuals.associations?.association_records}
                hint="gedcom_individual_associations_v2"
              />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Longest lived"
                description="Top 10 by age_at_death (years). Query param top_n on the API can raise the limit."
              >
                <LifespanTable rows={individuals.oldest_lived ?? []} />
              </ChartCard>
              <ChartCard
                title="Youngest died"
                description="Shortest age_at_death (years). Useful for infant mortality; ties broken by name."
              >
                <LifespanTable rows={individuals.youngest_died ?? []} />
              </ChartCard>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Sex"
                description="Living vs deceased by sex (unknown = not M/F). Zero-count slices are omitted."
                chartOverflow="visible"
              >
                <PlotlyFromIndividuals individuals={individuals} type="sex" />
              </ChartCard>
              <ChartCard title="Birth year by decade" description="Individuals with a parsed birth year.">
                <PlotlyFromIndividuals individuals={individuals} type="birth-decade" />
              </ChartCard>
              <ChartCard title="Death year by decade" description="Individuals with a parsed death year.">
                <PlotlyFromIndividuals individuals={individuals} type="death-decade" />
              </ChartCard>
              <ChartCard title="Age at death" description="Where age_at_death is populated.">
                <PlotlyFromIndividuals individuals={individuals} type="age-at-death" />
              </ChartCard>
            </div>
            <div className="mt-6">
              <ChartCard title="Top birth countries" description="From birth_country on the individual row (Unknown if blank).">
                <PlotlyFromIndividuals individuals={individuals} type="birth-countries" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-families" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">Families</h3>
            <p className="text-muted mb-4 font-body text-sm">
              Summary counts from couple and family records, children links, marriage events, and where marriages took place.
            </p>
            <p className="text-heading mb-2 font-body text-xs font-semibold uppercase tracking-wide">Children and marriage</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryPill
                label="Most children in one family"
                value={families.children_record_extremes?.max_children}
                hint="Largest recorded child count on a single family"
              />
              <SummaryPill
                label="Fewest children in one family"
                value={families.children_record_extremes?.min_children}
                hint="Smallest child count on a single family (often zero)"
              />
              <SummaryPill
                label="Families with a non-biological child"
                value={families.families_with_nonbiological_children}
                hint="At least one parent–child link not marked as biological"
              />
              <SummaryPill
                label="Families with a marriage event"
                value={families.families_with_marriage_event}
                hint="Has a marriage event linked to the family"
              />
            </div>
            <p className="text-heading mb-2 mt-8 font-body text-xs font-semibold uppercase tracking-wide">Overview</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Total families" value={families.summary?.total} />
              <SummaryPill label="Both partners listed" value={families.summary?.both_partners} />
              <SummaryPill label="Father linked only" value={families.summary?.husband_only} />
              <SummaryPill label="Mother linked only" value={families.summary?.wife_only} />
              <SummaryPill label="No spouse linked" value={families.summary?.no_partner_record} />
              <SummaryPill label="Marriage year known" value={families.summary?.with_marriage_year} />
              <SummaryPill label="Marked divorced" value={families.summary?.divorced} />
              <SummaryPill
                label="Families with children"
                value={families.summary?.with_children_denorm}
                hint="At least one child recorded on the family"
              />
              <SummaryPill label="Marriage place known" value={families.summary?.with_marriage_place} />
              <SummaryPill label="Families with notes" value={families.junction_counts?.families_with_notes} />
              <SummaryPill label="Families with sources" value={families.junction_counts?.families_with_sources} />
              <SummaryPill label="Families with any event" value={families.junction_counts?.families_with_events} />
              <SummaryPill label="Note links (total)" value={families.junction_counts?.note_links} />
              <SummaryPill label="Source links (total)" value={families.junction_counts?.source_links} />
              <SummaryPill label="Event links (total)" value={families.junction_counts?.event_links} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Parents linked on the family"
                description="Whether both spouses, one parent, or neither are attached. Small slices may be hidden."
                chartOverflow="visible"
              >
                <PlotlyFromFamilies families={families} type="partner-pie" />
              </ChartCard>
              <ChartCard
                title="When couples married"
                description="By decade, when a marriage year is stored on the family."
              >
                <PlotlyFromFamilies families={families} type="marriage-decade" />
              </ChartCard>
              <ChartCard
                title="Where couples married"
                description="Country from the marriage place, when available."
              >
                <PlotlyFromFamilies families={families} type="marriage-countries" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-events" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">Events</h3>
            <p className="text-muted mb-4 font-body text-sm">
              Births, deaths, marriages, and other life events from your tree: event records, dates, places, and links to
              people and sources.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Total events" value={events.summary?.total} />
              <SummaryPill label="Events with a date" value={events.summary?.with_date} />
              <SummaryPill label="Events with a place" value={events.summary?.with_place} />
              <SummaryPill
                label="Events with a custom type"
                value={events.summary?.with_custom_type}
                hint="Extra subtype text beyond the standard tag"
              />
              <SummaryPill
                label="Linked to a person"
                value={events.junction_counts?.links_to_individuals}
                hint="Event attached to an individual"
              />
              <SummaryPill
                label="Linked to a family"
                value={events.junction_counts?.links_to_families}
                hint="Event attached to a couple or family"
              />
              <SummaryPill label="Events that have notes" value={events.junction_counts?.events_with_notes} />
              <SummaryPill label="Note links (total)" value={events.junction_counts?.note_links} />
              <SummaryPill label="Events that have sources" value={events.junction_counts?.events_with_sources} />
              <SummaryPill label="Source links (total)" value={events.junction_counts?.source_links} />
              <SummaryPill label="Media links (total)" value={events.junction_counts?.media_links} />
              <SummaryPill
                label="Events · standard catalog types"
                value={events.origin_breakdown?.standard_catalog_events}
                hint="Linked to a non-custom row in the event type catalog"
              />
              <SummaryPill
                label="Events · custom catalog types"
                value={events.origin_breakdown?.custom_catalog_events}
                hint="Linked to a custom definition (e.g. EVEN with a subtype)"
              />
              <SummaryPill
                label="Distinct standard types in use"
                value={events.type_catalog_breakdown?.distinct_standard_types}
                hint="How many different GEDCOM-level tags appear for this tree"
              />
              <SummaryPill
                label="Distinct custom types in use"
                value={events.type_catalog_breakdown?.distinct_custom_types}
                hint="How many different custom event definitions appear"
              />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <ChartCard
                title="Most common event types"
                description="Plain-language names from the type catalog. Hover for counts."
              >
                <PlotlyFromEvents events={events} type="event-types" />
              </ChartCard>
              <ChartCard
                title="Events by year"
                description="Uses the parsed year on the event date when present."
              >
                <PlotlyFromEvents events={events} type="year-decade" />
              </ChartCard>
              <ChartCard
                title="Events by place country"
                description="Country on the event place when the place has a country set."
              >
                <PlotlyFromEvents events={events} type="event-countries" />
              </ChartCard>
            </div>
            <div className="mt-6 grid gap-6 lg:max-w-xl">
              <ChartCard
                title="Standard vs custom events"
                description="Counts event records: standard GEDCOM catalog types, custom catalog types, and any row not linked to the catalog yet."
                chartOverflow="visible"
              >
                <PlotlyFromEvents events={events} type="event-origin-pie" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-places" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">Places</h3>
            <p className="text-muted mb-4 font-body text-sm">
              Canonical place rows in <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_places_v2</code>{" "}
              and where they are referenced from births, deaths, marriages, events, and media.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Place records" value={places.summary?.total_places} />
              <SummaryPill label="With coordinates" value={places.summary?.with_coordinates} hint="Latitude and longitude set" />
              <SummaryPill label="With country" value={places.summary?.with_country} />
              <SummaryPill label="With state / region" value={places.summary?.with_state} />
              <SummaryPill label="With county" value={places.summary?.with_county} />
              <SummaryPill label="With parsed name" value={places.summary?.with_parsed_name} hint="Structured name field populated" />
              <SummaryPill label="Birth place links" value={places.reference_counts?.birth_place_links} hint="Individuals with birth_place_id" />
              <SummaryPill label="Death place links" value={places.reference_counts?.death_place_links} />
              <SummaryPill label="Marriage place links" value={places.reference_counts?.marriage_place_links} />
              <SummaryPill label="Divorce place links" value={places.reference_counts?.divorce_place_links} />
              <SummaryPill label="Event place links" value={places.reference_counts?.event_place_links} />
              <SummaryPill label="Media ↔ place links" value={places.reference_counts?.media_place_links} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Place references by record type"
                description="Total attachment counts: one individual can contribute both birth and death."
                chartOverflow="visible"
              >
                <PlotlyFromPlaces places={places} type="reference-pie" />
              </ChartCard>
              <ChartCard
                title="Most referenced places"
                description="Combined references across birth, death, marriage, divorce, events, and media."
              >
                <PlotlyFromPlaces places={places} type="top-places" />
              </ChartCard>
              <ChartCard title="Places by country" description="Distinct place rows with each country value (Unknown if unset).">
                <PlotlyFromPlaces places={places} type="countries" />
              </ChartCard>
              <ChartCard title="Places by state / region" description="Distinct place rows with each state value (Unknown if unset).">
                <PlotlyFromPlaces places={places} type="states" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-dates" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">Dates</h3>
            <p className="text-muted mb-4 font-body text-sm">
              Canonical date rows in <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_dates_v2</code>{" "}
              (GEDCOM qualifiers, calendars, parsed components) and references from births, deaths, marriages, events, and media.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Date records" value={dates.summary?.total_dates} />
              <SummaryPill label="With parsed year" value={dates.summary?.with_year} />
              <SummaryPill label="With month" value={dates.summary?.with_month} hint="Month component present" />
              <SummaryPill label="With day" value={dates.summary?.with_day} hint="Day component present" />
              <SummaryPill label="With original text" value={dates.summary?.with_original_text} hint="Raw GEDCOM date string" />
              <SummaryPill label="With end / second date" value={dates.summary?.with_end_components} hint="Ranges (e.g. BET … AND …)" />
              <SummaryPill
                label="Range-style qualifiers"
                value={dates.summary?.range_style_records}
                hint="date_type BETWEEN or FROM_TO"
              />
              <SummaryPill label="Birth date links" value={dates.reference_counts?.birth_date_links} hint="Individuals with birth_date_id" />
              <SummaryPill label="Death date links" value={dates.reference_counts?.death_date_links} />
              <SummaryPill label="Marriage date links" value={dates.reference_counts?.marriage_date_links} />
              <SummaryPill label="Divorce date links" value={dates.reference_counts?.divorce_date_links} />
              <SummaryPill label="Event date links" value={dates.reference_counts?.event_date_links} />
              <SummaryPill label="Media ↔ date links" value={dates.reference_counts?.media_date_links} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Date references by record type"
                description="Total attachment counts; one person can use both birth and death dates."
                chartOverflow="visible"
              >
                <PlotlyFromDates dates={dates} type="reference-pie" />
              </ChartCard>
              <ChartCard
                title="Most referenced dates"
                description="Combined references across birth, death, marriage, divorce, events, and media. Label shows original text or parsed Y-M-D."
              >
                <PlotlyFromDates dates={dates} type="top-dates" />
              </ChartCard>
              <ChartCard
                title="GEDCOM date qualifiers"
                description="How often each date_type appears on stored date rows."
              >
                <PlotlyFromDates dates={dates} type="date-types" />
              </ChartCard>
              <ChartCard title="Calendar tags" description="Uppercased calendar field (UNKNOWN if blank).">
                <PlotlyFromDates dates={dates} type="calendars" />
              </ChartCard>
            </div>
            <div className="mt-6">
              <ChartCard
                title="Dates by year (decade)"
                description="All date rows with a parsed primary year."
              >
                <PlotlyFromDates dates={dates} type="decades" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-media" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">GEDCOM media</h3>
            <p className="text-muted mb-4 font-body text-sm">
              OBJE rows in <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_media_v2</code>, junction links to people,
              families, events, sources, places and dates, app tags, and albums tied to this tree.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Media objects (OBJE)" value={media.summary?.total_gedcom_media} />
              <SummaryPill label="With title" value={media.summary?.with_title} />
              <SummaryPill label="With FORM" value={media.summary?.with_form} hint="GEDCOM FORM when stored" />
              <SummaryPill label="Tag assignments on media" value={media.summary?.media_tag_assignment_rows} hint="Rows in gedcom_media_app_tags for this file" />
              <SummaryPill label="Distinct tags used" value={media.summary?.distinct_tags_on_media} />
              <SummaryPill label="Albums (this tree)" value={media.albums?.album_count_for_tree} hint="albums.tree_id matches research tree" />
              <SummaryPill
                label="Album ↔ GEDCOM media"
                value={media.albums?.album_gedcom_media_links}
                hint="album_gedcom_media rows for albums on this tree"
              />
              <SummaryPill label="Individual ↔ media links" value={media.link_counts?.individual_media_links} />
              <SummaryPill label="Family ↔ media links" value={media.link_counts?.family_media_links} />
              <SummaryPill label="Event ↔ media links" value={media.link_counts?.event_media_links} />
              <SummaryPill label="Source ↔ media links" value={media.link_counts?.source_media_links} />
              <SummaryPill label="Media ↔ place links" value={media.link_counts?.media_place_links} hint="gedcom_media_places_v2 rows" />
              <SummaryPill label="Media ↔ date links" value={media.link_counts?.media_date_links} hint="gedcom_media_dates_v2 rows" />
              <SummaryPill
                label="Most-linked place (media)"
                value={(media.top_places_for_media ?? [])[0]?.link_count}
                hint={(media.top_places_for_media ?? [])[0]?.label ?? "No place links"}
              />
              <SummaryPill
                label="Most-linked date (media)"
                value={(media.top_dates_for_media ?? [])[0]?.link_count}
                hint={(media.top_dates_for_media ?? [])[0]?.label ?? "No date links"}
              />
              <SummaryPill
                label="Person with most media"
                value={(media.top_individuals_by_media ?? [])[0]?.media_link_count}
                hint={formatGedcomFullNameForDisplay((media.top_individuals_by_media ?? [])[0]?.full_name ?? "") || undefined}
              />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Popular tags on media (top 10)"
                description="App tags on GEDCOM media: each tag’s color is used when it’s a non-neutral hex; otherwise slices use a fixed palette so every wedge is distinct."
                chartOverflow="visible"
              >
                <PlotlyFromMedia media={media} type="tag-pie" />
              </ChartCard>
              <ChartCard
                title="Top places linked from media"
                description="Places ranked by how many media→place junction rows point at them."
              >
                <PlotlyFromMedia media={media} type="top-places" />
              </ChartCard>
              <ChartCard
                title="Top dates linked from media"
                description="Canonical date rows ranked by media→date junction rows."
              >
                <PlotlyFromMedia media={media} type="top-dates" />
              </ChartCard>
              <ChartCard
                title="Individuals with the most media"
                description="People ranked by count of individual↔media links."
              >
                <PlotlyFromMedia media={media} type="top-individuals" />
              </ChartCard>
              <ChartCard
                title="Families with the most media"
                description="Families ranked by media link count. Y-axis uses short partner labels (e.g. initials + surname) so bars are readable; summary pills keep full text."
              >
                <PlotlyFromMedia media={media} type="top-families" />
              </ChartCard>
              <ChartCard title="Events with the most media" description="Events ranked by event↔media link count.">
                <PlotlyFromMedia media={media} type="top-events" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-open-questions" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">Open questions</h3>
            <p className="text-muted mb-4 font-body text-sm">
              Research and verification items in <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">open_questions</code> for this
              GEDCOM file, plus which individuals, media, families, and events have the most question links.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Open questions (total)" value={openQuestions.summary?.total} />
              <SummaryPill label="Resolved" value={openQuestions.summary?.resolved} hint="status = resolved" />
              <SummaryPill
                label="Not resolved"
                value={openQuestions.summary?.unresolved}
                hint="Open or archived — anything not resolved"
              />
              <SummaryPill
                label="Person with most questions"
                value={(openQuestions.top_individuals ?? [])[0]?.question_link_count}
                hint={formatGedcomFullNameForDisplay((openQuestions.top_individuals ?? [])[0]?.full_name ?? "") || undefined}
              />
              <SummaryPill
                label="Media with most questions"
                value={(openQuestions.top_media ?? [])[0]?.question_link_count}
                hint={(openQuestions.top_media ?? [])[0]?.label ?? undefined}
              />
              <SummaryPill
                label="Family with most questions"
                value={(openQuestions.top_families ?? [])[0]?.question_link_count}
                hint={formatFamilyOfPartnerLabel(
                  (openQuestions.top_families ?? [])[0]?.label,
                  String((openQuestions.top_families ?? [])[0]?.xref ?? "—"),
                  200,
                )}
              />
              <SummaryPill
                label="Event with most questions"
                value={(openQuestions.top_events ?? [])[0]?.question_link_count}
                hint={(openQuestions.top_events ?? [])[0]?.label ?? undefined}
              />
            </div>
            <div className="mt-6 grid gap-6 lg:max-w-xl">
              <ChartCard
                title="Resolved vs not resolved"
                description="Pie uses resolved count vs all other statuses (open and archived)."
                chartOverflow="visible"
              >
                <PlotlyFromOpenQuestions data={openQuestions} type="resolved-pie" />
              </ChartCard>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Top 10 individuals by question links"
                description="People linked from the most open questions (junction open_question_individuals)."
              >
                <PlotlyFromOpenQuestions data={openQuestions} type="top-individuals" />
              </ChartCard>
              <ChartCard
                title="Top 10 media by question links"
                description="GEDCOM media objects linked from the most open questions."
              >
                <PlotlyFromOpenQuestions data={openQuestions} type="top-media" />
              </ChartCard>
              <ChartCard
                title="Top 10 families by question links"
                description="Families linked from the most open questions; chart labels are shortened for readability."
              >
                <PlotlyFromOpenQuestions data={openQuestions} type="top-families" />
              </ChartCard>
              <ChartCard
                title="Top 10 events by question links"
                description="Events linked from the most open questions."
              >
                <PlotlyFromOpenQuestions data={openQuestions} type="top-events" />
              </ChartCard>
            </div>
          </div>

          <div id="stats-notes" className="border-border-subtle mt-2 scroll-mt-24 border-t pt-8">
            <h3 className="text-heading font-accent mb-1 text-lg tracking-tight">GEDCOM notes</h3>
            <p className="text-muted mb-4 font-body text-sm">
              NOTE records in <code className="text-heading bg-surface rounded px-1 py-0.5 text-xs">gedcom_notes_v2</code> and junction rows to individuals,
              families, events, and sources for this file.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryPill label="Notes (total)" value={notes.summary?.total_notes} />
              <SummaryPill label="Top-level NOTE" value={notes.summary?.top_level_notes} hint="is_top_level on gedcom_notes_v2" />
              <SummaryPill label="With xref" value={notes.summary?.with_xref} />
              <SummaryPill
                label="Avg content length (chars)"
                value={notes.summary?.avg_content_length}
                hint="Mean LENGTH(content) for this file"
              />
              <SummaryPill
                label="Distinct notes linked"
                value={notes.summary?.distinct_notes_linked}
                hint="Notes appearing in at least one junction table"
              />
              <SummaryPill label="Orphan notes" value={notes.summary?.orphan_notes} hint="No links in any of the four junction tables" />
              <SummaryPill label="Individual ↔ note links" value={notes.link_counts?.individual_note_links} />
              <SummaryPill label="Family ↔ note links" value={notes.link_counts?.family_note_links} />
              <SummaryPill label="Event ↔ note links" value={notes.link_counts?.event_note_links} />
              <SummaryPill label="Source ↔ note links" value={notes.link_counts?.source_note_links} />
              <SummaryPill
                label="Most-linked note"
                value={(notes.top_notes ?? [])[0]?.link_count}
                hint={
                  (() => {
                    const r = (notes.top_notes ?? [])[0];
                    if (!r) return "No linked notes";
                    const xr = (r.xref ?? "").trim();
                    const p = (r.preview ?? "").trim() || "(empty)";
                    return xr ? `${p} — ${xr}` : p;
                  })()
                }
              />
              <SummaryPill
                label="Person with most notes"
                value={(notes.top_individuals ?? [])[0]?.note_link_count}
                hint={formatGedcomFullNameForDisplay((notes.top_individuals ?? [])[0]?.full_name ?? "") || undefined}
              />
              <SummaryPill
                label="Source with most notes"
                value={(notes.top_sources ?? [])[0]?.note_link_count}
                hint={(notes.top_sources ?? [])[0]?.label ?? undefined}
              />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Note links by entity type"
                description="Share of junction rows across gedcom_individual_notes_v2, gedcom_family_notes_v2, gedcom_event_notes_v2, and gedcom_source_notes_v2."
                chartOverflow="visible"
              >
                <PlotlyFromNotes data={notes} type="junction-pie" />
              </ChartCard>
              <ChartCard
                title="Top 10 notes by total links"
                description="Notes ranked by sum of links across all junction types; bar labels use a content preview and xref when present."
              >
                <PlotlyFromNotes data={notes} type="top-notes" />
              </ChartCard>
              <ChartCard title="Top 10 individuals by note links" description="People with the most individual↔note junction rows.">
                <PlotlyFromNotes data={notes} type="top-individuals" />
              </ChartCard>
              <ChartCard
                title="Top 10 families by note links"
                description="Families ranked by note link count; chart labels are shortened for readability."
              >
                <PlotlyFromNotes data={notes} type="top-families" />
              </ChartCard>
              <ChartCard title="Top 10 events by note links" description="Events ranked by event↔note junction rows.">
                <PlotlyFromNotes data={notes} type="top-events" />
              </ChartCard>
              <ChartCard title="Top 10 sources by note links" description="Sources ranked by source↔note junction rows.">
                <PlotlyFromNotes data={notes} type="top-sources" />
              </ChartCard>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function formatSummaryNumber(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n).toLocaleString();
  return n.toFixed(1);
}

function SummaryPill({ label, value, hint }: { label: string; value: unknown; hint?: string }) {
  return (
    <div className="border-border-subtle rounded-lg border bg-surface-2 px-3 py-2 shadow-sm" title={hint}>
      <p className="text-subtle text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-heading text-lg font-semibold tabular-nums">{formatSummaryNumber(value)}</p>
      {hint ? <p className="text-muted mt-1 font-body text-[10px] leading-snug">{hint}</p> : null}
    </div>
  );
}

function LifespanTable({ rows }: { rows: LifespanRow[] }) {
  if (rows.length === 0) {
    return <p className="text-muted font-body text-sm">No rows (need age_at_death on individuals).</p>;
  }
  return (
    <div className="max-h-[min(420px,50vh)] overflow-auto">
      <table className="w-full border-collapse font-body text-sm">
        <thead>
          <tr className="border-border-subtle text-muted border-b text-left text-[10px] font-semibold uppercase tracking-wide">
            <th className="py-2 pr-3 font-semibold">Name</th>
            <th className="py-2 pr-3 font-semibold">Age</th>
            <th className="py-2 pr-3 font-semibold">Sex</th>
            <th className="py-2 pr-3 font-semibold">Birth</th>
            <th className="py-2 font-semibold">Death</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id ?? `${r.full_name}-${r.age_at_death}`} className="border-border-subtle/80 border-b last:border-0">
              <td
                className="text-heading max-w-[200px] truncate py-1.5 pr-3"
                title={formatGedcomFullNameForDisplay(r.full_name ?? "") || undefined}
              >
                {formatGedcomFullNameForDisplay(r.full_name ?? "") || "—"}
              </td>
              <td className="text-heading tabular-nums py-1.5 pr-3">{formatSummaryNumber(r.age_at_death)}</td>
              <td className="py-1.5 pr-3">{r.sex === "U" || r.sex == null ? "—" : r.sex}</td>
              <td className="tabular-nums py-1.5 pr-3">{r.birth_year != null ? r.birth_year : "—"}</td>
              <td className="tabular-nums py-1.5">{r.death_year != null ? r.death_year : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  /** Pie charts draw labels outside the SVG viewport; avoid overflow-x-auto clipping them. */
  chartOverflow = "default",
}: {
  title: string;
  description: string;
  children: ReactNode;
  chartOverflow?: "default" | "visible";
}) {
  const bodyClass =
    chartOverflow === "visible"
      ? "mt-3 min-w-0 overflow-visible pt-1"
      : "mt-3 min-w-0 overflow-x-auto";
  return (
    <div className="border-border-subtle rounded-xl border bg-surface-elevated p-4 shadow-sm md:p-5">
      <h3 className="text-heading font-body text-sm font-semibold tracking-tight">{title}</h3>
      <p className="text-muted mt-1 font-body text-xs leading-relaxed">{description}</p>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

function PlotlyFromPayload({
  given,
  surnames,
  type,
}: {
  given?: GivenNamesPayload;
  surnames?: SurnamesPayload;
  type: "given-top" | "given-freq" | "sur-top" | "sur-freq";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "given-top": {
      const rows = (given?.top_names ?? []).slice(0, 18);
      spec = horizontalBar(
        rows.map((r) => String(r.name ?? "—")),
        rows.map((r) => Number(r.frequency) || 0),
        "Top given names",
      );
      break;
    }
    case "given-freq": {
      const b = given?.frequency_distribution ?? [];
      spec = verticalBar(
        b.map((x) => String(x.bucket)),
        b.map((x) => Number(x.count) || 0),
        "Given names — frequency buckets",
        "Occurrences per name",
        { yAxisTitle: "Distinct names" },
      );
      break;
    }
    case "sur-top": {
      const rows = (surnames?.top_surnames ?? []).slice(0, 18);
      spec = horizontalBar(
        rows.map((r) => String(r.name ?? "—")),
        rows.map((r) => Number(r.frequency) || 0),
        "Top surnames",
      );
      break;
    }
    case "sur-freq": {
      const b = surnames?.frequency_distribution ?? [];
      spec = verticalBar(
        b.map((x) => String(x.bucket)),
        b.map((x) => Number(x.count) || 0),
        "Surnames — frequency buckets",
        "Occurrences per surname",
        { yAxisTitle: "Distinct surnames" },
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function PlotlyFromIndividuals({
  individuals,
  type,
}: {
  individuals: IndividualsPayload;
  type: "sex" | "birth-decade" | "death-decade" | "age-at-death" | "birth-countries";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "sex": {
      spec = sexPieFromIndividuals(individuals);
      break;
    }
    case "birth-decade": {
      const rows = individuals.birth_by_decade ?? [];
      spec = verticalBar(
        rows.map((r) => `${r.decade}s`),
        rows.map((r) => Number(r.count) || 0),
        "Birth year by decade",
        "Decade (start year)",
        { yAxisTitle: "Individuals", height: Math.min(520, 120 + rows.length * 28) },
      );
      break;
    }
    case "death-decade": {
      const rows = individuals.death_by_decade ?? [];
      spec = verticalBar(
        rows.map((r) => `${r.decade}s`),
        rows.map((r) => Number(r.count) || 0),
        "Death year by decade",
        "Decade (start year)",
        { yAxisTitle: "Individuals", height: Math.min(520, 120 + rows.length * 28) },
      );
      break;
    }
    case "age-at-death": {
      const rows = individuals.age_at_death_buckets ?? [];
      spec = verticalBar(
        rows.map((r) => String(r.bucket)),
        rows.map((r) => Number(r.count) || 0),
        "Age at death",
        "Age bucket (years)",
        { yAxisTitle: "Individuals" },
      );
      break;
    }
    case "birth-countries": {
      const rows = (individuals.top_birth_countries ?? []).slice(0, 24);
      spec = horizontalBar(
        rows.map((r) => String(r.country ?? "—")),
        rows.map((r) => Number(r.count) || 0),
        "Top birth countries",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

const GEDCOM_DATE_TYPE_LABELS: Record<string, string> = {
  EXACT: "Exact",
  ABOUT: "About",
  BEFORE: "Before",
  AFTER: "After",
  BETWEEN: "Between",
  CALCULATED: "Calculated",
  ESTIMATED: "Estimated",
  FROM_TO: "From / to",
  UNKNOWN: "Unknown",
};

function formatDateTypeLabel(raw: string | undefined): string {
  const k = (raw ?? "").trim().toUpperCase();
  return GEDCOM_DATE_TYPE_LABELS[k] ?? (raw ? raw.replace(/_/g, " ") : "—");
}

function formatCalendarChartLabel(raw: string | undefined): string {
  const u = (raw ?? "").trim().toUpperCase();
  if (u === "UNKNOWN" || u === "") return "Unknown";
  return u.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function PlotlyFromDates({
  dates,
  type,
}: {
  dates: DatesPayload;
  type: "reference-pie" | "top-dates" | "date-types" | "calendars" | "decades";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "reference-pie": {
      spec = datesReferencePie(dates.reference_counts);
      break;
    }
    case "top-dates": {
      const rows = (dates.top_dates ?? []).slice(0, 22);
      const labels = rows.map((r) => {
        const base = truncateChartLabel(String(r.label ?? r.date_id ?? "—"), 22);
        const q = formatDateTypeLabel(r.date_type);
        return truncateChartLabel(`${base} (${q})`, 36);
      });
      spec = horizontalBar(labels, rows.map((r) => Number(r.reference_count) || 0), "References");
      break;
    }
    case "date-types": {
      const rows = dates.by_date_type ?? [];
      spec = horizontalBar(
        rows.map((r) => formatDateTypeLabel(r.date_type)),
        rows.map((r) => Number(r.count) || 0),
        "Date qualifiers",
      );
      break;
    }
    case "calendars": {
      const rows = (dates.calendar_distribution ?? []).slice(0, 24);
      spec = horizontalBar(
        rows.map((r) => formatCalendarChartLabel(r.calendar)),
        rows.map((r) => Number(r.count) || 0),
        "Calendar tags",
      );
      break;
    }
    case "decades": {
      const rows = dates.year_by_decade ?? [];
      spec = verticalBar(
        rows.map((r) => `${r.decade}s`),
        rows.map((r) => Number(r.count) || 0),
        "Dates by decade",
        "Decade",
        { yAxisTitle: "Date records", height: Math.min(520, 120 + rows.length * 28) },
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function PlotlyFromMedia({
  media,
  type,
}: {
  media: MediaPayload;
  type:
    | "tag-pie"
    | "top-places"
    | "top-dates"
    | "top-individuals"
    | "top-families"
    | "top-events";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "tag-pie": {
      spec = mediaTagPie(media.top_media_tags);
      break;
    }
    case "top-places": {
      const rows = media.top_places_for_media ?? [];
      const labels = rows.map((r) => {
        const base = truncateChartLabel(String(r.label ?? r.place_id ?? "—"), 26);
        const c = (r.country ?? "").trim();
        return c ? truncateChartLabel(`${base} (${c})`, 36) : base;
      });
      spec = horizontalBar(labels, rows.map((r) => Number(r.link_count) || 0), "Media ↔ place links");
      break;
    }
    case "top-dates": {
      const rows = media.top_dates_for_media ?? [];
      const labels = rows.map((r) => {
        const base = truncateChartLabel(String(r.label ?? r.date_id ?? "—"), 22);
        const q = formatDateTypeLabel(r.date_type);
        return truncateChartLabel(`${base} (${q})`, 36);
      });
      spec = horizontalBar(labels, rows.map((r) => Number(r.link_count) || 0), "Media ↔ date links");
      break;
    }
    case "top-individuals": {
      const rows = media.top_individuals_by_media ?? [];
      spec = horizontalBar(
        rows.map((r) =>
          abbreviateDisplayNameForChart(
            String(formatGedcomFullNameForDisplay(r.full_name ?? "") || r.individual_id || "—"),
            22,
          ),
        ),
        rows.map((r) => Number(r.media_link_count) || 0),
        "Links per person",
      );
      break;
    }
    case "top-families": {
      const rows = media.top_families_by_media ?? [];
      spec = horizontalBar(
        rows.map((r) => formatFamilyOfPartnerLabelChart(r.label, String(r.xref ?? r.family_id ?? "—"))),
        rows.map((r) => Number(r.media_link_count) || 0),
        "Links per family",
      );
      break;
    }
    case "top-events": {
      const rows = media.top_events_by_media ?? [];
      spec = horizontalBar(
        rows.map((r) => truncateChartLabel(String(r.label ?? r.event_id ?? "—"), 34)),
        rows.map((r) => Number(r.media_link_count) || 0),
        "Links per event",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function noteBarLabel(row: NonNullable<NotesPayload["top_notes"]>[number]): string {
  const preview = (row.preview ?? "").trim() || "(empty)";
  const xr = (row.xref ?? "").trim();
  const base = truncateChartLabel(preview, 28);
  if (xr) return truncateChartLabel(`${base} (${xr})`, 36);
  return truncateChartLabel(base, 36);
}

function PlotlyFromNotes({
  data,
  type,
}: {
  data: NotesPayload;
  type:
    | "junction-pie"
    | "top-notes"
    | "top-individuals"
    | "top-families"
    | "top-events"
    | "top-sources";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "junction-pie": {
      spec = notesJunctionTypePie(data.link_counts);
      break;
    }
    case "top-notes": {
      const rows = data.top_notes ?? [];
      spec = horizontalBar(
        rows.map((r) => noteBarLabel(r)),
        rows.map((r) => Number(r.link_count) || 0),
        "Total links per note",
      );
      break;
    }
    case "top-individuals": {
      const rows = data.top_individuals ?? [];
      spec = horizontalBar(
        rows.map((r) =>
          abbreviateDisplayNameForChart(
            String(formatGedcomFullNameForDisplay(r.full_name ?? "") || r.individual_id || "—"),
            22,
          ),
        ),
        rows.map((r) => Number(r.note_link_count) || 0),
        "Note links per person",
      );
      break;
    }
    case "top-families": {
      const rows = data.top_families ?? [];
      spec = horizontalBar(
        rows.map((r) => formatFamilyOfPartnerLabelChart(r.label, String(r.xref ?? r.family_id ?? "—"))),
        rows.map((r) => Number(r.note_link_count) || 0),
        "Note links per family",
      );
      break;
    }
    case "top-events": {
      const rows = data.top_events ?? [];
      spec = horizontalBar(
        rows.map((r) => truncateChartLabel(String(r.label ?? r.event_id ?? "—"), 34)),
        rows.map((r) => Number(r.note_link_count) || 0),
        "Note links per event",
      );
      break;
    }
    case "top-sources": {
      const rows = data.top_sources ?? [];
      spec = horizontalBar(
        rows.map((r) => truncateChartLabel(String(r.label ?? r.source_id ?? "—"), 34)),
        rows.map((r) => Number(r.note_link_count) || 0),
        "Note links per source",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function PlotlyFromOpenQuestions({
  data,
  type,
}: {
  data: OpenQuestionsPayload;
  type: "resolved-pie" | "top-individuals" | "top-media" | "top-families" | "top-events";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "resolved-pie": {
      spec = openQuestionsResolvedPie(data.summary);
      break;
    }
    case "top-individuals": {
      const rows = data.top_individuals ?? [];
      spec = horizontalBar(
        rows.map((r) =>
          abbreviateDisplayNameForChart(
            String(formatGedcomFullNameForDisplay(r.full_name ?? "") || r.individual_id || "—"),
            22,
          ),
        ),
        rows.map((r) => Number(r.question_link_count) || 0),
        "Question links per person",
      );
      break;
    }
    case "top-media": {
      const rows = data.top_media ?? [];
      spec = horizontalBar(
        rows.map((r) => truncateChartLabel(String(r.label ?? r.media_id ?? "—"), 34)),
        rows.map((r) => Number(r.question_link_count) || 0),
        "Question links per media",
      );
      break;
    }
    case "top-families": {
      const rows = data.top_families ?? [];
      spec = horizontalBar(
        rows.map((r) => formatFamilyOfPartnerLabelChart(r.label, String(r.xref ?? r.family_id ?? "—"))),
        rows.map((r) => Number(r.question_link_count) || 0),
        "Question links per family",
      );
      break;
    }
    case "top-events": {
      const rows = data.top_events ?? [];
      spec = horizontalBar(
        rows.map((r) => truncateChartLabel(String(r.label ?? r.event_id ?? "—"), 34)),
        rows.map((r) => Number(r.question_link_count) || 0),
        "Question links per event",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function PlotlyFromFamilies({
  families,
  type,
}: {
  families: FamiliesPayload;
  type: "partner-pie" | "marriage-decade" | "marriage-countries";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "partner-pie": {
      spec = familyPartnerPie(families.summary);
      break;
    }
    case "marriage-decade": {
      const rows = families.marriage_by_decade ?? [];
      spec = verticalBar(
        rows.map((r) => `${r.decade}s`),
        rows.map((r) => Number(r.count) || 0),
        "Marriages by decade",
        "Decade",
        { yAxisTitle: "Families", height: Math.min(520, 120 + rows.length * 28) },
      );
      break;
    }
    case "marriage-countries": {
      const rows = (families.marriage_country_distribution ?? []).slice(0, 24);
      spec = horizontalBar(
        rows.map((r) => String(r.country ?? "—")),
        rows.map((r) => Number(r.count) || 0),
        "Marriages by country",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function PlotlyFromPlaces({
  places,
  type,
}: {
  places: PlacesPayload;
  type: "reference-pie" | "top-places" | "countries" | "states";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "reference-pie": {
      spec = placesReferencePie(places.reference_counts);
      break;
    }
    case "top-places": {
      const rows = (places.top_places ?? []).slice(0, 22);
      const labels = rows.map((r) => {
        const base = truncateChartLabel(String(r.label ?? r.place_id ?? "—"), 26);
        const c = (r.country ?? "").trim();
        return c ? truncateChartLabel(`${base} (${c})`, 36) : base;
      });
      spec = horizontalBar(labels, rows.map((r) => Number(r.reference_count) || 0), "References");
      break;
    }
    case "countries": {
      const rows = (places.country_distribution ?? []).slice(0, 24);
      spec = horizontalBar(
        rows.map((r) => String(r.country ?? "—")),
        rows.map((r) => Number(r.count) || 0),
        "Places by country",
      );
      break;
    }
    case "states": {
      const rows = (places.state_distribution ?? []).slice(0, 24);
      spec = horizontalBar(
        rows.map((r) => String(r.state ?? "—")),
        rows.map((r) => Number(r.count) || 0),
        "Places by state / region",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}

function PlotlyFromEvents({
  events,
  type,
}: {
  events: EventsPayload;
  type: "event-types" | "year-decade" | "event-countries" | "event-origin-pie";
}) {
  let spec: { data: Data[]; layout: Partial<Layout> };
  switch (type) {
    case "event-types": {
      const rows = (events.by_event_type ?? []).slice(0, 22);
      spec = horizontalBar(
        rows.map((r) => truncateChartLabel(String(r.label ?? r.tag ?? "—"), 36)),
        rows.map((r) => Number(r.count) || 0),
        "Event types",
      );
      break;
    }
    case "event-origin-pie": {
      spec = eventOriginPie(events.origin_breakdown);
      break;
    }
    case "year-decade": {
      const rows = events.year_by_decade ?? [];
      spec = verticalBar(
        rows.map((r) => `${r.decade}s`),
        rows.map((r) => Number(r.count) || 0),
        "Events by decade",
        "Decade",
        { yAxisTitle: "Events", height: Math.min(520, 120 + rows.length * 28) },
      );
      break;
    }
    case "event-countries": {
      const rows = (events.place_country_distribution ?? []).slice(0, 24);
      spec = horizontalBar(
        rows.map((r) => String(r.country ?? "—")),
        rows.map((r) => Number(r.count) || 0),
        "Events by country",
      );
      break;
    }
    default:
      spec = { data: [], layout: {} };
  }

  return (
    <StatisticsPlotly
      spec={spec}
      emptyMessage="Nothing to chart — every value is zero or there are no rows for this view."
    />
  );
}
