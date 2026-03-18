"use client";

import { Baby } from "lucide-react";
import { Section } from "./Section";
import { iconColor, iconSize } from "./styles";
import type { BasicPersonDetails } from "./types";

interface BirthSectionProps {
  data: BasicPersonDetails["birth"];
  isMobile?: boolean;
}

export function BirthSection({ data, isMobile }: BirthSectionProps) {
  return (
    <Section
      icon={<Baby size={iconSize} color={iconColor} aria-hidden />}
      title="Birth"
      isMobile={isMobile}
    >
      <p style={{ margin: 0, fontSize: isMobile ? 13 : 14 }}>
        <strong>{data.date ?? "—"}</strong>
        {data.place != null && data.place !== "" ? ` · ${data.place}` : ""}
      </p>
    </Section>
  );
}
