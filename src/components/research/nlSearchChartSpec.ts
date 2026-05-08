import type { Data, Layout } from "plotly.js";

export type NlChartSpec = {
  data: Data[];
  layout: Partial<Layout>;
};

const BAR_COLOR = "#3d5a4a";

function capRows<T>(rows: T[], n = 28): T[] {
  return rows.slice(0, n);
}

/** Horizontal bar chart: labels on y-axis, values on x-axis (readable for long strings). */
function horizontalBar(labels: string[], values: number[], title: string, heightBoost = 0): NlChartSpec {
  const pairs = labels.map((l, i) => ({ l, v: values[i] ?? 0 }));
  pairs.sort((a, b) => a.v - b.v);
  const y = pairs.map((p) => p.l);
  const x = pairs.map((p) => p.v);
  const maxLabelLen = pairs.reduce((m, p) => Math.max(m, String(p.l).length), 8);
  const leftMargin = Math.min(340, 64 + maxLabelLen * 8);
  return {
    data: [
      {
        type: "bar",
        orientation: "h",
        x,
        y,
        marker: { color: BAR_COLOR },
      },
    ],
    layout: {
      title: { text: title, font: { size: 15 } },
      margin: { l: leftMargin, r: 28, t: 48, b: 48 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#2a2a2a", size: 12 },
      xaxis: { title: { text: "Count" }, automargin: true },
      yaxis: { automargin: true, tickfont: { size: 11 } },
      height: Math.min(720, 120 + y.length * 22 + heightBoost),
    },
  };
}

function asObjArray(val: unknown): Record<string, unknown>[] {
  if (!Array.isArray(val)) return [];
  return val.filter((x): x is Record<string, unknown> => x !== null && typeof x === "object");
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** Build a Plotly figure when aggregated NL results lend themselves to a simple bar chart. */
export function nlSearchChartSpec(intent: string, result: Record<string, unknown> | null): NlChartSpec | null {
  if (!result) return null;

  switch (intent) {
    case "top_surnames": {
      const rows = capRows(asObjArray(result.top_surnames));
      if (rows.length < 2) return null;
      const labels = rows.map((r) => String(r.name ?? r.surname ?? "—"));
      const vals = rows.map((r) => num(r.frequency ?? r.count));
      return horizontalBar(labels, vals, "Top surnames");
    }
    case "top_given_names": {
      const rows = capRows(asObjArray(result.top_given_names));
      if (rows.length < 2) return null;
      const labels = rows.map((r) => String(r.name ?? "—"));
      const vals = rows.map((r) => num(r.frequency ?? r.count));
      return horizontalBar(labels, vals, "Top given names");
    }
    case "cause_of_death": {
      const rows = capRows(asObjArray(result.causes));
      if (rows.length < 2) return null;
      const labels = rows.map((r) => String(r.cause ?? r.cause_label ?? "—"));
      const vals = rows.map((r) => num(r.count ?? r.occurrence_count));
      return horizontalBar(labels, vals, "Recorded causes (DEAT)");
    }
    case "migration_places": {
      const rows = capRows(asObjArray(result.countries));
      if (rows.length < 2) return null;
      const labels = rows.map((r) => String(r.country ?? "—"));
      const vals = rows.map((r) => num(r.count ?? r.individual_count));
      return horizontalBar(labels, vals, "Birth countries");
    }
    case "occupation_stats": {
      const rows = capRows(asObjArray(result.occupations));
      if (rows.length < 2) return null;
      const labels = rows.map((r) => String(r.occupation ?? "—"));
      const vals = rows.map((r) => num(r.count));
      return horizontalBar(labels, vals, "Top occupations");
    }
    case "surname_by_place": {
      const rows = capRows(asObjArray(result.surnames));
      if (rows.length < 2) return null;
      const labels = rows.map((r) => String(r.surname ?? r.name ?? "—"));
      const vals = rows.map((r) => num(r.count));
      return horizontalBar(labels, vals, `Surnames — ${String(result.place ?? "")}`.trim() || "Surnames by place");
    }
    case "names_by_decade": {
      const rows = asObjArray(result.by_decade);
      if (rows.length < 2) return null;
      const byD = new Map<number, number>();
      for (const r of rows) {
        const d = num(r.decade);
        byD.set(d, (byD.get(d) ?? 0) + num(r.count));
      }
      const decades = [...byD.keys()].sort((a, b) => a - b);
      if (decades.length < 2) return null;
      const counts = decades.map((d) => byD.get(d) ?? 0);
      return {
        data: [
          {
            type: "bar",
            x: decades.map(String),
            y: counts,
            marker: { color: BAR_COLOR },
          },
        ],
        layout: {
          title: { text: "Name records by birth decade", font: { size: 15 } },
          margin: { l: 48, r: 24, t: 48, b: 64 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#2a2a2a", size: 12 },
          xaxis: { title: { text: "Decade" } },
          yaxis: { title: { text: "Individuals (rows)" } },
          height: 380,
        },
      };
    }
    case "lifespan_stats": {
      const summary = result.summary as Record<string, unknown> | undefined;
      if (!summary || summary.count === undefined || summary.count === 0) return null;
      const avg = num(summary.avg_age);
      const mn = summary.min_age;
      const mx = summary.max_age;
      const labels = ["Average", "Min", "Max"];
      const vals = [avg, num(mn), num(mx)];
      const spec = horizontalBar(labels, vals, `Lifespan (age at death), n=${String(summary.count)}`);
      spec.layout.margin = { l: 96, r: 24, t: 48, b: 40 };
      return spec;
    }
    default:
      return null;
  }
}
