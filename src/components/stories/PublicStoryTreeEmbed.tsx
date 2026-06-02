"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { PersonCardLayout, PersonCardVariant, PersonCompactCardSize } from "@/lib/person-card-layout";
import type { TreeViewerPartnersUrl } from "@/lib/treeViewerUrl";
import { embedChartOpenHref } from "@/lib/profile-chart-options";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";

// Heavy interactive viewer — load only when a tree embed actually renders, client-only.
const FamilyTree = dynamic(() => import("@/components/TreeViewer").then((m) => m.FamilyTree), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-text/60">Loading chart…</div>
  ),
});

type Block = ReaderStoryBlock & Record<string, unknown>;

/** Mirrors `StoryTreeEmbedData` authored by the StoryCreator inspector. */
type TreeEmbedData = {
  rootPersonId?: string;
  rootPersonXref?: string;
  rootPersonLabel?: string;
  generations?: number;
  chartType?: "pedigree" | "verticalPedigree" | "descendancy" | "fan";
  cardVariant?: PersonCardVariant;
  cardLayout?: PersonCardLayout;
  compactCardSize?: PersonCompactCardSize;
};

// StoryCreator stores camelCase chart names; the visualization engine uses snake_case.
const CHART_TYPE_MAP: Record<NonNullable<TreeEmbedData["chartType"]>, ChartViewStrategyName> = {
  pedigree: "pedigree",
  verticalPedigree: "vertical_pedigree",
  descendancy: "descendancy",
  fan: "fan_chart",
};

type ChartDefaults = {
  cardVariant?: PersonCardVariant;
  cardSize?: PersonCompactCardSize;
  cardLayout?: PersonCardLayout;
  partnersUrl?: TreeViewerPartnersUrl;
  parentPairGap?: number;
};

// Same per-chart defaults the public profile page applies (IndividualChartEmbed).
const CHART_DEFAULTS: Record<ChartViewStrategyName, ChartDefaults> = {
  pedigree: { cardVariant: "compact-avatar", cardSize: "large", parentPairGap: 0 },
  vertical_pedigree: { cardVariant: "compact-avatar", cardSize: "large" },
  descendancy: { partnersUrl: "open", cardLayout: "avatarLeftActionsRight" },
  fan_chart: {},
};

export function PublicStoryTreeEmbed({ block }: { block: ReaderStoryBlock }) {
  const b = block as Block;
  const data = (b.data as TreeEmbedData | null | undefined) ?? {};

  // FamilyTree's root id is a GEDCOM xref (e.g. "@I123@"), as on profile pages.
  const rootXref = (data.rootPersonXref ?? data.rootPersonId ?? "").trim();
  const chart: ChartViewStrategyName = CHART_TYPE_MAP[data.chartType ?? "fan"] ?? "fan_chart";
  const defaults = CHART_DEFAULTS[chart];

  // Story-authored card overrides win; otherwise fall back to the chart's defaults.
  const cardVariant = data.cardVariant ?? defaults.cardVariant ?? null;
  const compactCardSize = data.compactCardSize ?? defaults.cardSize ?? null;
  const cardLayout = data.cardLayout ?? defaults.cardLayout ?? null;
  const depth =
    typeof data.generations === "number" ? Math.max(1, Math.min(10, data.generations)) : null;

  // Layout chrome shared with the other embeds.
  const embedWidthPct = typeof b.embedWidthPct === "number" ? b.embedWidthPct : 100;
  const embedAlign = (b.embedAlign as "left" | "center" | "right" | undefined) ?? "center";
  const containerStyle: React.CSSProperties = {
    width: `${embedWidthPct}%`,
    marginLeft: embedAlign === "left" ? 0 : "auto",
    marginRight: embedAlign === "right" ? 0 : "auto",
  };
  const label = typeof b.label === "string" && b.hideTitle !== true ? b.label.trim() : "";
  const caption = typeof b.caption === "string" && b.hideCaption !== true ? b.caption.trim() : "";

  if (!rootXref) {
    return (
      <div className="my-6 rounded-xl border border-dashed border-border bg-surface-2/60 px-4 py-8 text-center text-sm text-text/75">
        This tree embed has no root person selected. Open the editor to choose one.
      </div>
    );
  }

  const rootName = data.rootPersonLabel ?? null;
  const openHref = embedChartOpenHref({ rootXref, chart, rootName });

  return (
    <div className="my-6 w-full">
      <div style={containerStyle}>
        {label ? <p className="mb-1 text-sm font-semibold text-text">{label}</p> : null}

        <div
          style={{
            height: 600,
            width: "100%",
            overflow: "hidden",
            borderRadius: 12,
            border: "1px solid var(--border-subtle, #e5dcc8)",
          }}
        >
          <FamilyTree
            initialRootId={rootXref}
            rootName={rootName}
            initialChartStrategy={chart}
            initialUrlDepth={depth}
            initialPersonCardVariant={cardVariant}
            initialCompactCardSize={compactCardSize}
            initialPersonCardLayout={cardLayout}
            initialPartnersUrl={defaults.partnersUrl ?? null}
            initialParentPairGap={defaults.parentPairGap ?? null}
            embedMode
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          {caption ? (
            <div
              className="text-xs text-text/65 [&_a]:text-primary [&_a]:underline [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: caption }}
            />
          ) : (
            <span />
          )}
          <Link
            href={openHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle/80 bg-surface px-3 py-1.5 text-xs font-semibold text-link shadow-sm transition hover:border-link/30 hover:bg-link-soft-bg"
          >
            Open in Tree Viewer
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
