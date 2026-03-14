"use client";

import { ChartPanel } from "./ChartPanel";
import { InfoPanelItem } from "./InfoPanelItem";

export interface InfoPanelProps {
  stats: {
    totalPeople: number;
    totalUnions: number;
    visibleCount: number;
    currentDepth: number;
    rootDisplayName?: string | null;
  };
  onClose: () => void;
  isMobile?: boolean;
}

export function InfoPanel({ stats, onClose, isMobile }: InfoPanelProps) {
  return (
    <ChartPanel
      title="Dataset Info"
      onClose={onClose}
      placement={{ top: 108, right: 16 }}
      isMobile={isMobile}
      minWidth={200}
      closeButtonStyle={{ marginTop: 4 }}
    >
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>Current root</span>
        <div style={{ color: "var(--tree-text)", fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {stats.rootDisplayName ?? "—"}
        </div>
      </div>
      {[
        { label: "Total individuals", key: "totalPeople" as const },
        { label: "Total unions", key: "totalUnions" as const },
        { label: "Visible nodes", key: "visibleCount" as const },
        { label: "Current depth", key: "currentDepth" as const },
      ].map(({ label, key }) => (
        <InfoPanelItem key={key} label={label} value={stats[key]} />
      ))}
    </ChartPanel>
  );
}
