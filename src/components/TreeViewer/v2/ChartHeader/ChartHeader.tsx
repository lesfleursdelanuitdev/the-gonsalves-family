"use client";

import { getPeople } from "@/descendancy-chart";
import type { ViewState } from "@/descendancy-chart";
import { ChartHeaderTitle } from "./ChartHeaderTitle";
import { ChartHeaderSiblingLegendButton } from "./ChartHeaderSiblingLegendButton";
import { ChartHeaderInfo } from "./ChartHeaderInfo";

interface ChartHeaderProps {
  rootId: string;
  rootDisplayName?: string | null;
  viewState: ViewState;
  showLegendPanel: boolean;
  onToggleLegendPanel: () => void;
}

export function ChartHeader({
  rootId,
  rootDisplayName,
  viewState,
  showLegendPanel,
  onToggleLegendPanel,
}: ChartHeaderProps) {
  const rootPerson = getPeople().get(rootId);
  const displayName =
    rootDisplayName ?? (rootPerson ? `${rootPerson.firstName} ${rootPerson.lastName}`.trim() : null);

  return (
    <div
      style={{
        padding: "16px 28px",
        borderBottom: "1px solid var(--tree-border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#f4efe2",
      }}
    >
      <div
        style={{
          width: 3,
          height: 24,
          background: "var(--tree-root)",
          borderRadius: 2,
        }}
      />
      <ChartHeaderTitle displayName={displayName} />
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {viewState.siblingView && (
          <ChartHeaderSiblingLegendButton
            showLegendPanel={showLegendPanel}
            onToggleLegendPanel={onToggleLegendPanel}
          />
        )}
        <ChartHeaderInfo />
      </div>
    </div>
  );
}
