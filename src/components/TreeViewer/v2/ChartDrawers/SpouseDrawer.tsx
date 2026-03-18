"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { getPeople, getSpousesOf } from "@/genealogy-visualization-engine";
import type { ViewState } from "@/genealogy-visualization-engine";
import { IconPerson, IconPersonMale, IconPersonFemale } from "@/components/TreeViewer/Misc/SvgIcons";
import { ChartDrawer } from "./ChartDrawer";
import type { ChartDrawerAnchor } from "./ChartDrawer";

function useSpouseDrawerAnchor(): ChartDrawerAnchor {
  const [anchor, setAnchor] = useState<ChartDrawerAnchor>("bottom");
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const handler = () => setAnchor(m.matches ? "left" : "bottom");
    handler();
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);
  return anchor;
}

export interface SpouseDrawerProps {
  personId: string | null;
  viewState: ViewState;
  onSelect: (personId: string, spouseId: string) => void;
  /** Close one revealed spouse (click on selected card again). */
  onCloseSpouse?: (spouseId: string) => void;
  /** Open all unrevealed spouses at once; spouseIdToPanTo is used as pan target (e.g. first of the batch). */
  onSelectAll?: (personId: string, spouseIdToPanTo: string) => void;
  /** Close all revealed spouses for this person. */
  onCloseAll?: (personId: string) => void;
  onClose: () => void;
}

export function SpouseDrawer({ personId, viewState, onSelect, onCloseSpouse, onSelectAll, onCloseAll, onClose }: SpouseDrawerProps) {
  const anchor = useSpouseDrawerAnchor();
  const open = Boolean(personId);

  const people = getPeople();
  const person = personId ? people.get(personId) : null;

  if (!personId || !person) return null;

  const revealedForPerson = viewState.revealedUnions?.get(personId) ?? [];
  const rawSpouseEntries = getSpousesOf(personId);
  // Deduplicate by union (same husb-wife can appear twice from API); keeps keys unique and avoids duplicate cards
  const seenUnionKeys = new Set<string>();
  const allSpouseEntries = rawSpouseEntries.filter(({ union }) => {
    const k = `${union.husb}-${union.wife}`;
    if (seenUnionKeys.has(k)) return false;
    seenUnionKeys.add(k);
    return true;
  });
  const unrevealedEntries = allSpouseEntries.filter(
    ({ spouseId }) => !revealedForPerson.includes(spouseId)
  );
  const allRevealed = unrevealedEntries.length === 0 && allSpouseEntries.length > 0;

  const isMobile = anchor === "left";
  const padding = isMobile ? 16 : "20px 28px 28px";

  const cardStyle: CSSProperties = {
    background: "var(--surface-2)",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 10,
    transition: "background 0.15s, border-color 0.15s",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    width: isMobile ? "100%" : undefined,
    boxSizing: isMobile ? "border-box" : undefined,
  };

  return (
    <ChartDrawer
      open={open}
      anchor={anchor}
      onClose={onClose}
      showBackdrop={isMobile}
      zIndex={99}
      style={{
        padding,
        borderTop: anchor === "bottom" ? "1px solid var(--tree-border)" : undefined,
        borderRight: anchor === "left" ? "1px solid var(--tree-border)" : undefined,
        boxShadow: anchor === "bottom" ? "0 -8px 32px rgba(0,0,0,0.12)" : "8px 0 32px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div
            className="section-subtitle"
            style={{ fontSize: isMobile ? 11 : "0.65rem", marginBottom: 4 }}
          >
            Spouses of
          </div>
          <div
            style={{
              color: "var(--tree-text)",
              fontSize: isMobile ? 12 : 14,
              fontWeight: 600,
              fontFamily: "var(--font-heading-raw), Georgia, serif",
            }}
          >
            {person.firstName} {person.lastName}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--tree-text-subtle)",
            fontSize: isMobile ? 16 : 18,
            lineHeight: 1,
            padding: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tree-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tree-text-subtle)")}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: isMobile ? "nowrap" : "wrap",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {allSpouseEntries.map(({ spouseId, union }) => {
          const spouse = people.get(spouseId);
          if (!spouse) return null;
          const isUnknown = spouse.firstName === "Unknown";
          const isRevealed = revealedForPerson.includes(spouseId);
          const borderColor = isRevealed
            ? "var(--crimson)"
            : isUnknown
              ? "var(--tree-border)"
              : "var(--tree-linked)";
          const borderWidth = isRevealed ? 3 : 1;
          const handleClick = () => {
            if (isRevealed && onCloseSpouse) onCloseSpouse(spouseId);
            else onSelect(personId, spouseId);
          };
          return (
            <button
              key={`${union.husb}-${union.wife}`}
              type="button"
              onClick={handleClick}
              style={{
                ...cardStyle,
                border: `${borderWidth}px solid ${borderColor}`,
                opacity: isUnknown ? 0.85 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--hover-overlay)";
                if (!isRevealed) e.currentTarget.style.borderColor = "var(--tree-linked)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.border = `${borderWidth}px solid ${borderColor}`;
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--surface-inset)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width={28} height={28} viewBox="0 0 28 28" style={{ display: "block" }}>
                  {(() => {
                    const PersonIcon =
                      spouse.gender === "Male"
                        ? IconPersonMale
                        : spouse.gender === "Female"
                          ? IconPersonFemale
                          : IconPerson;
                    return (
                      <PersonIcon
                        x={14}
                        y={14}
                        size={20}
                        fill="none"
                        stroke="var(--tree-text-subtle)"
                        strokeWidth={1.5}
                      />
                    );
                  })()}
                </svg>
              </div>
              <div>
                <div
                  style={{
                    color: isUnknown ? "var(--tree-text-muted)" : "var(--tree-text)",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-heading-raw), Georgia, serif",
                    fontStyle: isUnknown ? "italic" : "normal",
                  }}
                >
                  {isUnknown ? "Unknown parent" : `${spouse.firstName} ${spouse.lastName}`}
                </div>
                {!isUnknown && (
                  <div
                    className="section-subtitle"
                    style={{ fontSize: "0.65rem", fontWeight: 400, letterSpacing: "0.08em", marginTop: 2, textTransform: "none" }}
                  >
                    {spouse.birthYear ?? "?"} — {spouse.deathYear ?? "present"}
                  </div>
                )}
                <div
                  className="section-subtitle"
                  style={{ fontSize: "0.65rem", fontWeight: 400, letterSpacing: "0.08em", marginTop: 2, textTransform: "none", color: "var(--tree-root)" }}
                >
                  {union.children.length} {union.children.length === 1 ? "child" : "children"}
                </div>
              </div>
            </button>
          );
        })}

        {allSpouseEntries.length > 0 && (
          allRevealed && onCloseAll ? (
            <button
              type="button"
              onClick={() => onCloseAll(personId)}
              style={{
                ...cardStyle,
                border: "1px solid var(--tree-border)",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 72,
                color: "var(--tree-text)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Close all
            </button>
          ) : unrevealedEntries.length > 0 && onSelectAll ? (
            <button
              type="button"
              onClick={() => onSelectAll(personId, unrevealedEntries[0].spouseId)}
              style={{
                ...cardStyle,
                border: "1px solid var(--tree-root)",
                background: "var(--tree-root)",
                color: "var(--surface-elevated)",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 72,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Open all ({unrevealedEntries.length})
            </button>
          ) : null
        )}
      </div>
    </ChartDrawer>
  );
}
