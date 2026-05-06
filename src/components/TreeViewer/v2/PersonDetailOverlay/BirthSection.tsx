"use client";

import type { CSSProperties } from "react";
import { Baby } from "lucide-react";
import { Section } from "./Section";
import { iconColor, iconSize } from "./styles";
import type { BasicPersonDetails } from "./types";

interface BirthSectionProps {
  data: BasicPersonDetails["birth"];
  isMobile?: boolean;
  sectionRootStyle?: CSSProperties;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function BirthSection({
  data,
  isMobile,
  sectionRootStyle,
  expanded,
  onExpandedChange,
}: BirthSectionProps) {
  return (
    <Section
      icon={<Baby size={iconSize} color={iconColor} aria-hidden />}
      title="Birth"
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
