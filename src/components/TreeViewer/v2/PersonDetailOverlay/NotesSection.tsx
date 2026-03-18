"use client";

import { FileText } from "lucide-react";
import { Section } from "./Section";
import { listUlStyle, iconColor, iconSize } from "./styles";
import type { NotesResponse } from "./types";

type NoteItem = NotesResponse["notes"][number];

interface NotesSectionProps {
  notes: NoteItem[];
  isMobile?: boolean;
}

export function NotesSection({ notes, isMobile }: NotesSectionProps) {
  if (notes.length === 0) return null;

  return (
    <Section
      icon={<FileText size={iconSize} color={iconColor} aria-hidden />}
      title="Notes"
      isMobile={isMobile}
    >
      <ul style={listUlStyle}>
        {notes.map((n) => (
          <li key={n.id} style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {n.content}
          </li>
        ))}
      </ul>
    </Section>
  );
}
