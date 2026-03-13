"use client";

import { PanelCloseButton } from "./PanelCloseButton";

interface InfoPanelProps {
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
    <div
      style={
        isMobile
          ? {
              background: "var(--tree-panel-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--tree-border)",
              borderRadius: 10,
              padding: "16px 20px",
              minWidth: 200,
              maxHeight: "100%",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              fontFamily: "system-ui, sans-serif",
            }
          : {
              position: "fixed",
              top: 108,
              right: 16,
              background: "var(--tree-panel-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--tree-border)",
              borderRadius: 10,
              padding: "16px 20px",
              zIndex: 300,
              minWidth: 200,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              fontFamily: "system-ui, sans-serif",
            }
      }
    >
      <div
        style={{
          color: "var(--tree-text-muted)",
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Dataset Info
      </div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>Current root</span>
        <div style={{ color: "var(--tree-text)", fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {stats.rootDisplayName ?? "—"}
        </div>
      </div>
      {[
        { label: "Total individuals", value: stats.totalPeople },
        { label: "Total unions", value: stats.totalUnions },
        { label: "Visible nodes", value: stats.visibleCount },
        { label: "Current depth", value: stats.currentDepth },
      ].map(({ label, value }) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "var(--tree-text-muted)", fontSize: 12 }}>{label}</span>
          <span style={{ color: "var(--tree-text)", fontSize: 13, fontWeight: 600 }}>{value}</span>
        </div>
      ))}
      <PanelCloseButton onClick={onClose} style={{ marginTop: 14 }} />
    </div>
  );
}
