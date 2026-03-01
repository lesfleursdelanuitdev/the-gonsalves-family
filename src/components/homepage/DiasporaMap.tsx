"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection } from "geojson";

const WORLD_ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const LINE_DRAW_DURATION = 1000;
const DOT_TRAVEL_DURATION = 1200;

// Diaspora locations [longitude, latitude]
const LOCATIONS = {
  madeira: [-16.96, 32.76] as [number, number],
  guyana: [-58.2, 6.8] as [number, number],
  uk: [-0.1, 51.5] as [number, number],
  canada: [-79.4, 43.7] as [number, number], // Toronto
  usa: [-74, 40.7] as [number, number], // New York
  california: [-118.24, 34.05] as [number, number],
} as const;

// Hub-and-spoke: Madeira → Guyana, then Guyana → each diaspora
const JOURNEY_PATHS: [number, number][][] = [
  [LOCATIONS.madeira, LOCATIONS.guyana],
  [LOCATIONS.guyana, LOCATIONS.california],
  [LOCATIONS.guyana, LOCATIONS.canada],
  [LOCATIONS.guyana, LOCATIONS.usa],
  [LOCATIONS.guyana, LOCATIONS.uk],
];

type DiasporaMapProps = {
  variant?: "default" | "background";
};

export function DiasporaMap({ variant = "default" }: DiasporaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const worldRef = useRef<FeatureCollection | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const runPathAnimation = (
      mapG: d3.Selection<SVGGElement, unknown, null, undefined>,
      pathElements: SVGPathElement[],
    ) => {
      if (hasAnimatedRef.current || pathElements.length === 0) return;
      hasAnimatedRef.current = true;

      const dot = mapG.select<SVGCircleElement>(".traveling-dot");

      const animatePathAndDot = (index: number) => {
        if (index >= pathElements.length) return;

        const pathEl = pathElements[index];
        const length = pathEl.getTotalLength();
        const pathSel = d3.select(pathEl);

        pathSel
          .attr("stroke-dasharray", `${length} ${length}`)
          .attr("stroke-dashoffset", length)
          .transition()
          .duration(LINE_DRAW_DURATION)
          .ease(d3.easeCubicInOut)
          .attr("stroke-dashoffset", 0)
          .on("end", () => {
            pathSel.transition().duration(300).attr("stroke-dasharray", "4 3");
            // Dot travels along this path
            const start = performance.now();
            const tick = () => {
              const elapsed = performance.now() - start;
              const t = Math.min(elapsed / DOT_TRAVEL_DURATION, 1);
              const point = pathEl.getPointAtLength(t * length);
              dot.attr("cx", point.x).attr("cy", point.y).attr("opacity", 1);
              if (t < 1) {
                requestAnimationFrame(tick);
              } else {
                animatePathAndDot(index + 1);
              }
            };
            requestAnimationFrame(tick);
          });
      };

      animatePathAndDot(0);
    };

    const render = (countries: FeatureCollection, width: number, height: number) => {
      const svgEl = d3.select(svg);
      svgEl.selectAll("*").remove();
      svgEl.attr("width", width).attr("height", height).attr("viewBox", [0, 0, width, height]);

      const projection = d3
        .geoMercator()
        .scale(width / 6.5)
        .center([-30, 20])
        .translate([width / 2, height / 2]);
      const pathGenerator = d3.geoPath().projection(projection);

      // Zoomable layer (all map content lives here)
      const mapG = svgEl.append("g").attr("class", "zoom-layer");

      mapG.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(countries.features)
        .join("path")
        .attr("d", (d) => pathGenerator(d) ?? "")
        .attr("fill", "var(--map-land)")
        .attr("stroke", "var(--map-land-stroke)")
        .attr("stroke-width", 0.5);

      const pathElements: SVGPathElement[] = [];
      JOURNEY_PATHS.forEach((coords) => {
        const journeyLine: GeoJSON.LineString = {
          type: "LineString",
          coordinates: coords,
        };
        const pathD = pathGenerator(journeyLine) ?? "";
        const pathNode = mapG
          .append("path")
          .attr("class", "journey-path")
          .attr("d", pathD)
          .attr("fill", "none")
          .attr("stroke", "var(--accent-muted)")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4 3")
          .attr("opacity", 0.8)
          .node();
        if (pathNode) pathElements.push(pathNode);
      });

      // Traveling dot (starts invisible at Madeira)
      const firstPath = pathElements[0];
      const startPoint = firstPath ? firstPath.getPointAtLength(0) : { x: 0, y: 0 };
      mapG.append("circle")
        .attr("class", "traveling-dot")
        .attr("cx", startPoint.x)
        .attr("cy", startPoint.y)
        .attr("r", 4)
        .attr("fill", "var(--accent)")
        .attr("stroke", "var(--text)")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0);

      const markers = [
        { coords: LOCATIONS.madeira, highlight: true },
        { coords: LOCATIONS.guyana, highlight: true },
        { coords: LOCATIONS.uk, highlight: false },
        { coords: LOCATIONS.canada, highlight: false },
        { coords: LOCATIONS.usa, highlight: false },
        { coords: LOCATIONS.california, highlight: false },
      ];
      const markerG = mapG.append("g").attr("class", "markers");
      markers.forEach(({ coords, highlight }) => {
        const [x, y] = projection(coords as [number, number]) ?? [0, 0];
        markerG
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 4)
          .attr("fill", highlight ? "var(--accent)" : "var(--accent-muted)")
          .attr("stroke", "var(--text)")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.95);
      });

      // Zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .on("zoom", (event) => {
          mapG.attr("transform", event.transform.toString());
        });

      svgEl.call(zoom);
      zoomBehaviorRef.current = zoom;

      runPathAnimation(mapG, pathElements);
    };

    const draw = () => {
      const width = container.clientWidth;
      if (width === 0) return;
      const height =
        variant === "background"
          ? container.clientHeight
          : Math.round(width * (9 / 16));
      if (worldRef.current) {
        render(worldRef.current, width, height);
      }
    };

    fetch(WORLD_ATLAS_URL)
      .then((res) => res.json())
      .then((world: Topology) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const countries = feature(world, (world as any).objects.countries) as FeatureCollection;
        worldRef.current = countries;
        const width = container.clientWidth || 640;
        const height =
          variant === "background"
            ? container.clientHeight
            : Math.round(width * (9 / 16));
        render(countries, width, height);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load map");
        setLoading(false);
      });

    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [variant]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.4);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleReset = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${variant === "background" ? "absolute inset-0" : "relative w-full rounded-lg"}`}
      style={variant === "default" ? { aspectRatio: "16/9" } : undefined}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-inset">
          <span className="text-sm text-muted">Loading map…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-inset">
          <span className="text-sm text-muted">{error}</span>
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-auto cursor-grab active:cursor-grabbing touch-none"
        style={{ display: loading || error ? "none" : "block" }}
      />
      {!loading && !error && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded bg-surface/90 text-lg font-medium text-text shadow-sm transition hover:bg-surface-elevated active:scale-95"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded bg-surface/90 text-lg font-medium text-text shadow-sm transition hover:bg-surface-elevated active:scale-95"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex h-8 w-8 items-center justify-center rounded bg-surface/90 text-sm font-medium text-text shadow-sm transition hover:bg-surface-elevated active:scale-95"
            aria-label="Reset view"
          >
            ⟲
          </button>
        </div>
      )}
    </div>
  );
}
