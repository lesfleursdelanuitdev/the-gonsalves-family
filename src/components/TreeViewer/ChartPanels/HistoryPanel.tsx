"use client";

import { getPeople } from "@/descendancy-chart";
import type { HistoryEntry } from "@/descendancy-chart";
import { PanelCloseButton } from "./PanelCloseButton";

function getInitials(rootId: string, people: Map<string, { firstName: string; lastName: string }>): string {
  const person = people.get(rootId);
  if (!person) return rootId.slice(0, 2).toUpperCase() || "?";
  const f = (person.firstName?.trim() || "")[0] ?? "";
  const l = (person.lastName?.trim() || "")[0] ?? "";
  return (f + l).toUpperCase() || rootId.slice(0, 2).toUpperCase() || "?";
}

function getHistoryEntryLabel(entry: HistoryEntry, people: Map<string, { firstName: string; lastName: string }>): string {
  const personIdForInitials = entry.triggerPersonId ?? entry.rootId;
  const initials = getInitials(personIdForInitials, people);
  const action = entry.actionLabel ?? "View";
  return `${initials} – ${action}`;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  historyIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export function HistoryPanel({ history, historyIndex, onNavigate, onClose, isMobile }: HistoryPanelProps) {
  const people = getPeople();

  return (
    <div
      style={
        isMobile
          ? {
              background: "var(--tree-panel-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--tree-border)",
              borderRadius: 10,
              padding: "12px 0",
              minWidth: 220,
              maxHeight: "100%",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }
          : {
              position: "fixed",
              top: 108,
              left: 16,
              background: "var(--tree-panel-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--tree-border)",
              borderRadius: 10,
              padding: "12px 0",
              zIndex: 300,
              minWidth: 220,
              maxHeight: 360,
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }
      }
    >
      <div
        style={{
          color: "var(--tree-text-muted)",
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "0 14px 8px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Navigation History
      </div>
      {history.map((entry, i) => {
        const isCurrent = i === historyIndex;
        const label = getHistoryEntryLabel(entry, people);
        return (
          <div
            key={i}
            onClick={() => onNavigate(i)}
            style={{
              padding: "7px 14px",
              cursor: "pointer",
              background: isCurrent ? "var(--hover-overlay)" : "transparent",
              borderLeft: `3px solid ${isCurrent ? "var(--tree-root)" : "transparent"}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) e.currentTarget.style.background = "var(--hover-overlay)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ color: "var(--tree-button-border)", fontSize: 10, width: 16, textAlign: "right", flexShrink: 0 }}>
              {i + 1}
            </span>
            <span
              style={{
                color: isCurrent ? "var(--tree-text)" : "var(--tree-text-muted)",
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {label}
            </span>
            {isCurrent && <span style={{ marginLeft: "auto", color: "var(--tree-root)", fontSize: 10 }}>●</span>}
          </div>
        );
      })}
      <div style={{ padding: "0 14px 4px" }}>
        <PanelCloseButton onClick={onClose} />
      </div>
    </div>
  );
}
