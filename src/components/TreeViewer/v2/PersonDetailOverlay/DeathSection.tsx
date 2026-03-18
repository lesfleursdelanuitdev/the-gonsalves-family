"use client";

import { Cross } from "lucide-react";
import { Section } from "./Section";
import { iconColor, iconSize } from "./styles";
import type { BasicPersonDetails } from "./types";

interface DeathSectionProps {
  data: BasicPersonDetails["death"];
  isMobile?: boolean;
}

export function DeathSection({ data, isMobile }: DeathSectionProps) {
  const hasContent = data.date ?? data.place ?? data.event;
  if (!hasContent) return null;

  return (
    <Section
      icon={<Cross size={iconSize} color={iconColor} aria-hidden />}
      title="Death"
      isMobile={isMobile}
    >
      <p style={{ margin: 0, fontSize: isMobile ? 13 : 14 }}>
        <strong>{data.date ?? "—"}</strong>
        {data.place != null && data.place !== "" ? ` · ${data.place}` : ""}
      </p>
    </Section>
  );
}
