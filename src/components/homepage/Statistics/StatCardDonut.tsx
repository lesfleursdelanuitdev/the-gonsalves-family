"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PlotlyChart } from "@/components/plotly/PlotlyChart";
import { cn } from "@/lib/utils";
import type { HomeStatDonutChart, HomeStatSlice } from "@/types/tree";

const COLORS = [
  "#8B2E2E",
  "#1F3D28",
  "#A67C52",
  "#4A6A8A",
  "#6B5B4D",
  "#7D5A5A",
  "#2F5D50",
  "#8B7355",
  "#5C5348",
  "#9C7B2E",
];

const PLOT_HEIGHT = 220;

const PLOT_CONFIG = {
  displayModeBar: false,
  responsive: true,
  scrollZoom: false,
} as const;

/** Ordinal labels from `buildHomeMiniCharts` — line chart keeps this order, including zeros. */
const CHILDREN_BUCKET_LABELS = [
  "0 children",
  "1 child",
  "2 children",
  "3 children",
  "4+ children",
] as const;

export type StatCardDonutProps = {
  chart: HomeStatDonutChart;
  pending?: boolean;
  className?: string;
  /** `line`: children buckets. `bar`: horizontal bars (places). `staggered`: donut with pulled sectors (gender). Default: donut pie. */
  variant?: "donut" | "line" | "bar" | "staggered";
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleAnnotationHtml(titleLine1: string, titleLine2: string | undefined): string {
  return titleLine2 && titleLine2.length > 0
    ? `<b>${escapeHtml(titleLine1)}</b><br><span style="font-size:10px;font-weight:600;color:#5c5348">${escapeHtml(titleLine2)}</span>`
    : `<b>${escapeHtml(titleLine1)}</b>`;
}

function orderedChildrenSeries(slices: HomeStatSlice[]): { labels: string[]; values: number[] } {
  const map = new Map(slices.map((s) => [s.label, s.value]));
  return {
    labels: [...CHILDREN_BUCKET_LABELS],
    values: CHILDREN_BUCKET_LABELS.map((l) => map.get(l) ?? 0),
  };
}

function buildDonutPlot(
  slices: HomeStatSlice[],
  titleLine1: string,
  titleLine2: string | undefined,
  options?: { staggerPull?: boolean },
): { data: Data[]; layout: Partial<Layout> } {
  const filtered = slices.filter((s) => s.value > 0);
  const total = filtered.reduce((acc, s) => acc + s.value, 0);
  const centerText = titleAnnotationHtml(titleLine1, titleLine2);
  const stagger = options?.staggerPull === true;

  const baseLayout: Partial<Layout> = {
    margin: stagger ? { l: 10, r: 10, t: 10, b: 10 } : { l: 4, r: 4, t: 4, b: 4 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    showlegend: false,
    height: PLOT_HEIGHT,
    autosize: true,
    annotations: [
      {
        text: centerText,
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: 0.5,
        xanchor: "center",
        yanchor: "middle",
        showarrow: false,
        font: {
          size: 11,
          family: "system-ui, -apple-system, sans-serif",
          color: "#3d362f",
        },
      },
    ],
  };

  if (total <= 0) {
    const empty: Data[] = [
      {
        type: "pie",
        labels: ["—"],
        values: [1],
        hole: 0.55,
        marker: { colors: ["rgba(60,45,25,0.08)"] },
        textinfo: "none",
        hoverinfo: "skip",
        sort: false,
      },
    ];
    return { data: empty, layout: baseLayout };
  }

  const d: Data[] = [
    {
      type: "pie",
      labels: filtered.map((s) => s.label),
      values: filtered.map((s) => s.value),
      hole: stagger ? 0.5 : 0.55,
      ...(stagger
        ? {
            pull: filtered.map((_, i) => 0.03 + ((i * 5) % 4) * 0.022),
          }
        : {}),
      marker: {
        colors: filtered.map((_, i) => COLORS[i % COLORS.length]!),
        line: { color: "rgba(255,253,247,0.55)", width: 1 },
      },
      textinfo: "none",
      sort: false,
      direction: "clockwise",
      rotation: 90,
      hovertemplate: "<b>%{label}</b><br>%{value:,}<br>%{percent}<extra></extra>",
    },
  ];

  return { data: d, layout: baseLayout };
}

function buildLinePlot(
  slices: HomeStatSlice[],
  titleLine1: string,
  titleLine2: string | undefined,
  options?: {
    seriesMode?: "childrenBuckets" | "sliceOrder";
    yAxisTitle?: string;
    hoverCountsLabel?: string;
  },
): { data: Data[]; layout: Partial<Layout> } {
  const mode = options?.seriesMode ?? "childrenBuckets";
  const yTitle = options?.yAxisTitle ?? (mode === "childrenBuckets" ? "Families" : "Count");
  const hoverLabel = options?.hoverCountsLabel ?? (mode === "childrenBuckets" ? "families" : "count");

  const { labels, values } =
    mode === "childrenBuckets"
      ? orderedChildrenSeries(slices)
      : (() => {
          const filtered = slices.filter((s) => s.value > 0);
          return {
            labels: filtered.map((s) => s.label),
            values: filtered.map((s) => s.value),
          };
        })();
  const maxY = Math.max(1, ...values);
  const titleText = titleAnnotationHtml(titleLine1, titleLine2);

  const layout: Partial<Layout> = {
    margin: { l: 40, r: 8, t: 36, b: 52 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "rgba(255,253,247,0.4)",
    showlegend: false,
    height: PLOT_HEIGHT,
    autosize: true,
    annotations: [
      {
        text: titleText,
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: 1.02,
        xanchor: "center",
        yanchor: "bottom",
        showarrow: false,
        font: {
          size: 11,
          family: "system-ui, -apple-system, sans-serif",
          color: "#3d362f",
        },
      },
    ],
    xaxis: {
      type: "category",
      categoryorder: "array",
      categoryarray: labels,
      tickangle: mode === "childrenBuckets" ? -28 : -35,
      automargin: true,
      gridcolor: "rgba(0,0,0,0.06)",
      zeroline: false,
      fixedrange: true,
      tickfont: { size: 10, color: "#5c5348" },
    },
    yaxis: {
      title: { text: yTitle, font: { size: 10, color: "#5c5348" } },
      rangemode: "tozero",
      range: [0, maxY * 1.08],
      gridcolor: "rgba(0,0,0,0.06)",
      zeroline: false,
      fixedrange: true,
      tickfont: { size: 10, color: "#5c5348" },
    },
  };

  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const empty: Data[] = [
      {
        type: "scatter",
        mode: "lines",
        x: labels,
        y: labels.map(() => 0),
        line: { color: "rgba(60,45,25,0.12)", width: 2 },
        hoverinfo: "skip",
      },
    ];
    return { data: empty, layout };
  }

  const c = COLORS[0]!;
  const hovertemplate = `<b>%{x}</b><br>%{y:,} ${escapeHtml(hoverLabel)}<extra></extra>`;
  const d: Data[] = [
    {
      type: "scatter",
      mode: "lines+markers",
      x: labels,
      y: values,
      line: { color: c, width: 2.5, shape: "linear" },
      marker: { color: c, size: 10, line: { color: "#fff", width: 1 } },
      hovertemplate,
    },
  ];

  return { data: d, layout };
}

function buildBarPlot(
  slices: HomeStatSlice[],
  titleLine1: string,
  titleLine2: string | undefined,
  options?: { xAxisTitle?: string; hoverCountsLabel?: string },
): { data: Data[]; layout: Partial<Layout> } {
  const filtered = slices.filter((s) => s.value > 0);
  const titleText = titleAnnotationHtml(titleLine1, titleLine2);
  const maxX = Math.max(1, ...filtered.map((s) => s.value));
  const xAxisTitle = options?.xAxisTitle ?? "Births";
  const hoverCountsLabel = options?.hoverCountsLabel ?? "births";

  const layout: Partial<Layout> = {
    margin: { l: 4, r: 8, t: 38, b: 32 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "rgba(255,253,247,0.4)",
    showlegend: false,
    height: PLOT_HEIGHT,
    autosize: true,
    bargap: 0.28,
    annotations: [
      {
        text: titleText,
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: 1.02,
        xanchor: "center",
        yanchor: "bottom",
        showarrow: false,
        font: {
          size: 11,
          family: "system-ui, -apple-system, sans-serif",
          color: "#3d362f",
        },
      },
    ],
    xaxis: {
      title: { text: xAxisTitle, font: { size: 10, color: "#5c5348" } },
      rangemode: "tozero",
      range: [0, maxX * 1.08],
      gridcolor: "rgba(0,0,0,0.06)",
      zeroline: false,
      fixedrange: true,
      tickfont: { size: 10, color: "#5c5348" },
    },
    yaxis: {
      type: "category",
      categoryorder: "array",
      categoryarray: filtered.map((s) => s.label),
      automargin: true,
      tickfont: { size: 9, color: "#3d362f" },
      fixedrange: true,
      /** First slice = highest count (API order) — show at top of the card. */
      autorange: "reversed",
    },
  };

  if (filtered.length === 0) {
    const empty: Data[] = [
      {
        type: "bar",
        orientation: "h",
        x: [0],
        y: ["—"],
        marker: { color: "rgba(60,45,25,0.08)" },
        hoverinfo: "skip",
      },
    ];
    return { data: empty, layout };
  }

  const d: Data[] = [
    {
      type: "bar",
      orientation: "h",
      x: filtered.map((s) => s.value),
      y: filtered.map((s) => s.label),
      marker: {
        color: filtered.map((_, i) => COLORS[i % COLORS.length]!),
        line: { color: "rgba(255,253,247,0.65)", width: 0.5 },
      },
      hovertemplate: `<b>%{y}</b><br>%{x:,} ${escapeHtml(hoverCountsLabel)}<extra></extra>`,
    },
  ];

  return { data: d, layout };
}

/**
 * Plotly chart for homepage stat cards — donut, staggered donut, line, or bar.
 */
export function StatCardDonut({
  chart,
  pending,
  className,
  variant = "donut",
}: StatCardDonutProps) {
  const {
    slices,
    titleLine1,
    titleLine2,
    variant: chartVariant,
    lineSeriesMode,
    lineYAxisTitle,
    lineHoverCountsLabel,
    barXAxisTitle,
    barHoverCountsLabel,
  } = chart;

  const effectiveVariant = chartVariant ?? variant;

  const { data, layout } = useMemo(() => {
    if (effectiveVariant === "line") {
      return buildLinePlot(slices, titleLine1, titleLine2, {
        seriesMode: lineSeriesMode ?? "childrenBuckets",
        yAxisTitle: lineYAxisTitle,
        hoverCountsLabel: lineHoverCountsLabel,
      });
    }
    if (effectiveVariant === "bar") {
      return buildBarPlot(slices, titleLine1, titleLine2, {
        xAxisTitle: barXAxisTitle,
        hoverCountsLabel: barHoverCountsLabel,
      });
    }
    if (effectiveVariant === "staggered") {
      return buildDonutPlot(slices, titleLine1, titleLine2, { staggerPull: true });
    }
    return buildDonutPlot(slices, titleLine1, titleLine2);
  }, [
    effectiveVariant,
    slices,
    titleLine1,
    titleLine2,
    lineSeriesMode,
    lineYAxisTitle,
    lineHoverCountsLabel,
    barXAxisTitle,
    barHoverCountsLabel,
  ]);

  if (pending) {
    return (
      <div
        className={cn("min-h-[220px] h-[220px] animate-pulse rounded-lg bg-black/[0.06]", className)}
        aria-hidden
      />
    );
  }

  return (
    <PlotlyChart
      data={data}
      layout={layout}
      config={PLOT_CONFIG}
      className={cn("[&_.js-plotly-plot]:cursor-default", className)}
      style={{ height: PLOT_HEIGHT, minHeight: PLOT_HEIGHT }}
    />
  );
}
