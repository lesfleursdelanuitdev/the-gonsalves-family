"use client";

import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import type { CSSProperties, ComponentType } from "react";
import type * as PlotlyJS from "plotly.js";

const PlotDynamic = dynamic(async () => (await import("react-plotly.js")).default, {
  ssr: false,
}) as ComponentType<PlotParams>;

export type PlotlyChartProps = {
  data: PlotlyJS.Data[];
  layout?: Partial<PlotlyJS.Layout>;
  config?: Partial<PlotlyJS.Config>;
  /** Applied to the outer wrapper ``div``. */
  className?: string;
  style?: CSSProperties;
};

/**
 * Next.js–safe Plotly wrapper (loads on the client only).
 */
export function PlotlyChart({ data, layout, config, className, style }: PlotlyChartProps) {
  const outer: CSSProperties = {
    width: "100%",
    overflow: "hidden",
    position: "relative",
    ...style,
  };
  if (outer.minHeight == null) outer.minHeight = 360;
  if (outer.height == null) outer.height = outer.minHeight;

  const plotMin = outer.minHeight ?? 360;
  const plotHeight = outer.height ?? plotMin;

  return (
    <div className={className} style={outer}>
      <PlotDynamic
        data={data}
        layout={layout ?? {}}
        config={config}
        useResizeHandler
        style={{
          width: "100%",
          height: plotHeight,
          minHeight: plotMin,
          overflow: "hidden",
        }}
      />
    </div>
  );
}
