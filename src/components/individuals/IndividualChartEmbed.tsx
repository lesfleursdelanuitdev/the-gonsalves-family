"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import type { PersonCardLayout, PersonCardVariant, PersonCompactCardSize } from "@/lib/person-card-layout";
import type { TreeViewerPartnersUrl } from "@/lib/treeViewerUrl";
import { embedChartOpenHref } from "@/lib/profile-chart-options";
import { FamilyTree } from "@/components/TreeViewer";

interface EmbedConfig {
  cardVariant?: PersonCardVariant;
  cardSize?: PersonCompactCardSize;
  cardLayout?: PersonCardLayout;
  partnersUrl?: TreeViewerPartnersUrl;
  parentPairGap?: number;
}

const EMBED_CONFIG: Record<ChartViewStrategyName, EmbedConfig> = {
  pedigree: {
    cardVariant: "compact-avatar",
    cardSize: "large",
    parentPairGap: 0,
  },
  vertical_pedigree: {
    cardVariant: "compact-avatar",
    cardSize: "large",
  },
  descendancy: {
    partnersUrl: "open",
    cardLayout: "avatarLeftActionsRight",
  },
  fan_chart: {},
};

export function IndividualChartEmbed({
  xref,
  chart,
  fullName,
}: {
  xref: string;
  chart: ChartViewStrategyName;
  fullName?: string | null;
}) {
  const config = EMBED_CONFIG[chart];
  const openHref = embedChartOpenHref({ rootXref: xref, chart, rootName: fullName });

  return (
    <div>
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
          initialRootId={xref}
          rootName={fullName}
          initialChartStrategy={chart}
          initialPersonCardVariant={config.cardVariant ?? null}
          initialCompactCardSize={config.cardSize ?? null}
          initialPersonCardLayout={config.cardLayout ?? null}
          initialPartnersUrl={config.partnersUrl ?? null}
          initialParentPairGap={config.parentPairGap ?? null}
          embedMode
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href={openHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle/80 bg-surface px-3 py-1.5 text-xs font-semibold text-link shadow-sm transition hover:border-link/30 hover:bg-link-soft-bg"
        >
          Open in Tree Viewer
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
