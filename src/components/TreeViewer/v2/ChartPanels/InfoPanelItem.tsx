"use client";

import type { ReactNode } from "react";

export interface InfoPanelItemProps {
  label: string;
  value: ReactNode;
}

export function InfoPanelItem({ label, value }: InfoPanelItemProps) {
  return (
    <div
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
  );
}
