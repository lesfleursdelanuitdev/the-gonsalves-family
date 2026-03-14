"use client";

import type { ReactNode } from "react";

const sectionTitleStyle: React.CSSProperties = {
  color: "var(--tree-text-subtle)",
  fontSize: 9,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={sectionTitleStyle}>{title}</div>
      {children}
    </div>
  );
}
