"use client";

import { getPeople } from "@/descendancy-chart";
import type { ViewState, TreeAction } from "@/descendancy-chart";
import { HistoryNav } from "./HistoryNav";
import { useCallback } from "react";

export interface ChartHeaderNavigationDeps {
  dispatch: (action: TreeAction) => void;
  onCloseDrawer: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  triggerBlinkBack: () => void;
}

interface ChartHeaderProps {
  rootId: string;
  rootDisplayName?: string | null;
  historyIndex: number;
  historyLength: number;
  navigationDeps: ChartHeaderNavigationDeps;
  blinkBack?: boolean;
  viewState: ViewState;
  showLegendPanel: boolean;
  onToggleLegendPanel: () => void;
}

export function ChartHeader({
  rootId,
  rootDisplayName,
  historyIndex,
  historyLength,
  navigationDeps,
  blinkBack,
  viewState,
  showLegendPanel,
  onToggleLegendPanel,
}: ChartHeaderProps) {
  const rootPerson = getPeople().get(rootId);
  const displayName = rootDisplayName ?? (rootPerson ? `${rootPerson.firstName} ${rootPerson.lastName}`.trim() : null);

  const onBack = useCallback(() => {
    navigationDeps.dispatch({ type: "BACK" });
    navigationDeps.onCloseDrawer();
    navigationDeps.setPan({ x: 0, y: 0 });
    navigationDeps.triggerBlinkBack();
  }, [navigationDeps]);

  const onForward = useCallback(() => {
    navigationDeps.dispatch({ type: "FORWARD" });
    navigationDeps.onCloseDrawer();
    navigationDeps.setPan({ x: 0, y: 0 });
    navigationDeps.triggerBlinkBack();
  }, [navigationDeps]);

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
      <div>
        <p className="section-subtitle mb-0.5" style={{ fontSize: "0.6rem" }}>
          Descendancy Chart
        </p>
        <h2 className="font-heading text-base font-semibold tracking-tight text-heading">
          {displayName ? (
            <>
              {displayName} — <span className="italic">Descendants</span>
            </>
          ) : (
            <span className="italic">Descendants</span>
          )}
        </h2>
      </div>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <HistoryNav
          historyIndex={historyIndex}
          historyLength={historyLength}
          onBack={onBack}
          onForward={onForward}
          blinkBack={blinkBack}
        />
        {viewState.siblingView && (
          <button
            type="button"
            onClick={onToggleLegendPanel}
            style={{
              background: showLegendPanel ? "var(--hover-overlay)" : "transparent",
              border: `1px solid ${showLegendPanel ? "var(--tree-root)" : "var(--tree-button-border)"}`,
              borderRadius: 6,
              color: showLegendPanel ? "var(--tree-root)" : "var(--tree-text-muted)",
              cursor: "pointer",
              fontSize: 11,
              padding: "5px 12px",
              fontFamily: "inherit",
              letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >
            Sibling Legend
          </button>
        )}
        <span style={{ color: "var(--tree-text-subtle)", fontSize: 11 }}>
          scroll to zoom · drag to pan
        </span>
      </div>
    </div>
  );
}
