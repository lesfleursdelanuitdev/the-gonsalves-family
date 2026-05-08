"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getPeople } from "@/genealogy-visualization-engine";
import type { HistoryEntry } from "@/genealogy-visualization-engine";
import { ChartPanel } from "./ChartPanel";
import { ChartDrawer } from "../ChartDrawers/ChartDrawer";
import { HistoryPanelItem } from "./HistoryPanelItem";
import { CHART_VIEWPORT_CHROME_Z_INDEX } from "../ChartViewport/ChartViewportOverlayContext";

function getInitials(rootId: string, people: Map<string, { firstName: string; lastName: string }>): string {
  const person = people.get(rootId);
  if (person) {
    const f = (person.firstName?.trim() || "")[0] ?? "";
    const l = (person.lastName?.trim() || "")[0] ?? "";
    const inits = (f + l).toUpperCase();
    if (inits) return inits;
  }
  if (/^@I[^@]*@$/.test(rootId)) return "?"; // xref: avoid showing "@I"
  return rootId.slice(0, 2).toUpperCase() || "?";
}

function getDisplayName(personId: string, people: Map<string, { firstName: string; lastName: string }>): string {
  const person = people.get(personId);
  if (!person) return personId;
  const first = (person.firstName ?? "").trim();
  const last = (person.lastName ?? "").trim();
  return [first, last].filter(Boolean).join(" ") || personId;
}

/** Prefer stored fullName/initials, then resolve from people map, else keep xref. */
function personDisplay(
  entry: HistoryEntry,
  people: Map<string, { firstName: string; lastName: string }>,
  kind: "trigger" | "root"
): string {
  if (kind === "trigger" && entry.triggerPersonId) {
    const stored = entry.triggerPersonFullName ?? entry.triggerPersonInitials;
    if (stored) return stored;
    return getDisplayName(entry.triggerPersonId, people);
  }
  if (kind === "root") {
    const stored = entry.rootPersonFullName ?? entry.rootPersonInitials;
    if (stored) return stored;
    return getDisplayName(entry.rootId, people);
  }
  return "?";
}

/** Replace rootId and triggerPersonId in text with stored or resolved names, then any remaining xrefs. */
function replaceXrefsWithNames(
  text: string,
  entry: HistoryEntry,
  people: Map<string, { firstName: string; lastName: string }>
): string {
  let out = text;
  if (entry.rootId && (entry.rootPersonFullName ?? entry.rootPersonInitials)) {
    out = out.split(entry.rootId).join(personDisplay(entry, people, "root"));
  }
  if (entry.triggerPersonId && entry.triggerPersonId !== entry.rootId && (entry.triggerPersonFullName ?? entry.triggerPersonInitials)) {
    out = out.split(entry.triggerPersonId).join(personDisplay(entry, people, "trigger"));
  }
  const xrefRe = /@I[^@]+@/g;
  return out.replace(xrefRe, (xref) => {
    const name = getDisplayName(xref, people);
    return name !== xref ? name : xref;
  });
}

function getHistoryEntryLabel(entry: HistoryEntry, people: Map<string, { firstName: string; lastName: string }>): string {
  const initials =
    entry.triggerPersonInitials ?? entry.rootPersonInitials ?? getInitials(entry.triggerPersonId ?? entry.rootId, people);
  let action = entry.actionLabel ?? "View";
  if (action === "Pan to person" && entry.triggerPersonId) {
    action = `Pan to person ${personDisplay(entry, people, "trigger")}`;
  }
  action = replaceXrefsWithNames(action, entry, people);
  return `${initials} – ${action}`;
}

export interface HistoryPanelProps {
  history: HistoryEntry[];
  historyIndex: number;
  onNavigate: (index: number) => void;
  onClearHistory: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

const navButtonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "8px 6px",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  color: "var(--tree-text)",
  background: "var(--tree-surface-2, #F4EFE2)",
  border: "1px solid var(--tree-border, #D9CCB3)",
  borderRadius: 6,
  cursor: "pointer",
  textAlign: "center",
};
const navButtonDisabledStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const panelTitleStyle: React.CSSProperties = {
  color: "var(--tree-text-muted)",
  fontSize: 10,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  flexShrink: 0,
};

function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Portaled sheet: z-index above viewport right toolbar (see CHART_VIEWPORT_CHROME_Z_INDEX); matches GoToPersonDrawer. */
const MOBILE_HISTORY_DRAWER_Z = CHART_VIEWPORT_CHROME_Z_INDEX + 89;

export function HistoryPanel({ history, historyIndex, onNavigate, onClearHistory, onClose, isMobile }: HistoryPanelProps) {
  const people = getPeople();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canClear = history.length > 1;

  const footer = (
    <div style={{ display: "flex", flexDirection: "row", gap: 6 }}>
      <button
        type="button"
        style={{ ...navButtonStyle, ...(canRedo ? {} : navButtonDisabledStyle) }}
        disabled={!canRedo}
        onClick={() => canRedo && onNavigate(historyIndex + 1)}
      >
        Redo
      </button>
      <button
        type="button"
        style={{ ...navButtonStyle, ...(canUndo ? {} : navButtonDisabledStyle) }}
        disabled={!canUndo}
        onClick={() => canUndo && onNavigate(historyIndex - 1)}
      >
        Undo
      </button>
      <button
        type="button"
        style={{ ...navButtonStyle, ...(canClear ? {} : navButtonDisabledStyle) }}
        disabled={!canClear}
        onClick={() => canClear && onClearHistory()}
      >
        Clear
      </button>
    </div>
  );

  const historyList = history.map((entry, i) => {
    const isCurrent = i === historyIndex;
    const label = getHistoryEntryLabel(entry, people);
    return (
      <HistoryPanelItem
        key={i}
        index={i}
        isCurrent={isCurrent}
        label={label}
        onSelect={() => onNavigate(i)}
      />
    );
  });

  const isMounted = useIsMounted();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const id = requestAnimationFrame(() => setDrawerOpen(true));
    return () => cancelAnimationFrame(id);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, drawerOpen, onClose]);

  if (isMobile) {
    if (!isMounted) return null;
    return createPortal(
      <ChartDrawer
        open={drawerOpen}
        anchor="bottom"
        onClose={onClose}
        showBackdrop
        zIndex={MOBILE_HISTORY_DRAWER_Z}
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "85dvh",
          padding: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "12px 14px 10px",
            borderBottom: "1px solid var(--tree-panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={panelTitleStyle}>Navigation History</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tree-text-subtle)",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "8px 12px 10px",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {historyList}
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: "10px 12px 14px",
            borderTop: "1px solid var(--tree-panel-border)",
          }}
        >
          {footer}
        </div>
      </ChartDrawer>,
      document.body
    );
  }

  return (
    <ChartPanel
      title="Navigation History"
      onClose={onClose}
      placement={{ top: 108, left: 16 }}
      isMobile={false}
      minWidth={220}
      maxHeight={360}
      containerStyle={{ padding: "12px 14px 12px 10px" }}
      closeButtonStyle={{ marginTop: 4 }}
      footer={footer}
    >
      {historyList}
    </ChartPanel>
  );
}
