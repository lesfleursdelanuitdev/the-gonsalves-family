"use client";

import { BookOpen } from "lucide-react";
import { Section } from "./Section";
import { listUlStyle, iconColor, iconSize } from "./styles";
import type { SourcesResponse } from "./types";

type SourceItem = SourcesResponse["sources"][number];

interface SourcesSectionProps {
  sources: SourceItem[];
  isMobile?: boolean;
}

export function SourcesSection({ sources, isMobile }: SourcesSectionProps) {
  if (sources.length === 0) return null;

  return (
    <Section
      icon={<BookOpen size={iconSize} color={iconColor} aria-hidden />}
      title="Sources"
      description="Where this information comes from—citations and references."
      isMobile={isMobile}
    >
      <ul style={listUlStyle}>
        {sources.map((s) => (
          <li key={s.source.id} style={{ marginBottom: 8 }}>
            {s.source.title ?? "Unknown"}
            {s.source.author && ` · ${s.source.author}`}
            {s.citationText && ` — ${s.citationText}`}
          </li>
        ))}
      </ul>
    </Section>
  );
}
