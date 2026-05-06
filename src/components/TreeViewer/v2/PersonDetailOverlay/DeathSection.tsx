"use client";

import type { CSSProperties } from "react";
import { Cross } from "lucide-react";
import { Section } from "./Section";
import { iconColor, iconSize } from "./styles";
import type { BasicPersonDetails } from "./types";

interface DeathSectionProps {
  data: BasicPersonDetails["death"];
  isMobile?: boolean;
  sectionRootStyle?: CSSProperties;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function DeathSection({
  data,
  isMobile,
  sectionRootStyle,
  expanded,
  onExpandedChange,
}: DeathSectionProps) {
  const hasContent = data.date ?? data.place ?? data.event;
  if (!hasContent) return null;

  return (
    <Section
      icon={<Cross size={iconSize} color={iconColor} aria-hidden />}
      title="Death"
      collapsible
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      isMobile={isMobile}
      rootStyle={sectionRootStyle}
    >
      <p style={{ margin: 0, fontSize: isMobile ? 13 : 14 }}>
        <strong>{data.date ?? "—"}</strong>
        {data.place != null && data.place !== "" ? ` · ${data.place}` : ""}
      </p>
    </Section>
  );
}
