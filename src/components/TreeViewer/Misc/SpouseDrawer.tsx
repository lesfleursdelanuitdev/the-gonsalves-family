"use client";

import { getPeople, getSpousesOf } from "@/descendancy-chart";
import type { ViewState } from "@/descendancy-chart";

interface SpouseDrawerProps {
  personId: string | null;
  viewState: ViewState;
  onSelect: (personId: string, spouseId: string) => void;
  onClose: () => void;
}

export function SpouseDrawer({ personId, viewState, onSelect, onClose }: SpouseDrawerProps) {
  if (!personId) return null;
  const people = getPeople();
  const person = people.get(personId);
  if (!person) return null;

  const revealedForPerson = viewState.revealedUnions?.get(personId) ?? [];
  const spouseEntries = getSpousesOf(personId).filter(
    ({ spouseId }) => !revealedForPerson.includes(spouseId)
  );

  return (
    <>
      <style>{`
        @keyframes spouseDrawerSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes spouseDrawerSlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .spouse-drawer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--tree-panel-bg);
          border-top: 1px solid var(--tree-border);
          padding: 20px 28px 28px;
          z-index: 100;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.12);
          animation: spouseDrawerSlideUp 0.2s ease-out;
        }
        .spouse-drawer-spouses {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .spouse-drawer {
            top: 0;
            bottom: 0;
            left: 0;
            right: auto;
            width: min(320px, 85dvw);
            max-height: 100dvh;
            border-top: none;
            border-right: 1px solid var(--tree-border);
            box-shadow: 8px 0 32px rgba(0,0,0,0.12);
            animation: spouseDrawerSlideIn 0.25s ease-out;
            padding: 16px;
            overflow-y: auto;
          }
          .spouse-drawer-spouses {
            flex-direction: column;
            flex-wrap: nowrap;
          }
          .spouse-drawer-spouses > button {
            width: 100%;
            box-sizing: border-box;
          }
          .spouse-drawer-header-subtitle { font-size: 11px !important; }
          .spouse-drawer-header-name { font-size: 12px !important; }
          .spouse-drawer-card-name { font-size: 11px !important; }
          .spouse-drawer-card-meta { font-size: 10px !important; }
          .spouse-drawer-close { font-size: 16px !important; }
        }
        .spouse-drawer-backdrop {
          display: none;
        }
        @media (max-width: 640px) {
          .spouse-drawer-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            z-index: 99;
            animation: spouseDrawerBackdrop 0.2s ease-out;
          }
          @keyframes spouseDrawerBackdrop {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
      <div
        className="spouse-drawer-backdrop"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="spouse-drawer"
        role="dialog"
        aria-label="Choose spouse"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div
              className="section-subtitle spouse-drawer-header-subtitle"
              style={{ fontSize: "0.65rem", marginBottom: 4 }}
            >
              Spouses of
            </div>
            <div
              className="spouse-drawer-header-name"
              style={{
                color: "var(--tree-text)",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-heading-raw), Georgia, serif",
              }}
            >
              {person.firstName} {person.lastName}
            </div>
          </div>
          <button
            className="spouse-drawer-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tree-text-subtle)",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tree-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tree-text-subtle)")}
          >
            ✕
          </button>
        </div>

        <div className="spouse-drawer-spouses">
        {spouseEntries.map(({ spouseId, union }) => {
          const spouse = people.get(spouseId);
          if (!spouse) return null;
          const isUnknown = spouse.firstName === "Unknown";
          return (
            <button
              key={`${union.husb}-${union.wife}`}
              type="button"
              onClick={() => onSelect(personId, spouseId)}
              style={{
                background: "var(--surface-2)",
                border: `1px solid ${isUnknown ? "var(--tree-border)" : "var(--tree-linked)"}`,
                borderRadius: 8,
                padding: "10px 16px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "background 0.15s, border-color 0.15s",
                opacity: isUnknown ? 0.85 : 1,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--hover-overlay)";
                e.currentTarget.style.borderColor = "var(--tree-linked)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.borderColor = isUnknown ? "var(--tree-border)" : "var(--tree-linked)";
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
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                👤
              </div>
              <div>
                <div
                  className="spouse-drawer-card-name"
                  style={{
                    color: isUnknown ? "var(--tree-text-muted)" : "var(--tree-text)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-heading-raw), Georgia, serif",
                    fontStyle: isUnknown ? "italic" : "normal",
                  }}
                >
                  {isUnknown ? "Unknown parent" : `${spouse.firstName} ${spouse.lastName}`}
                </div>
                {!isUnknown && (
                  <div
                    className="section-subtitle spouse-drawer-card-meta"
                    style={{ fontSize: "0.65rem", fontWeight: 400, letterSpacing: "0.08em", marginTop: 2, textTransform: "none" }}
                  >
                    {spouse.birthYear ?? "?"} — {spouse.deathYear ?? "present"}
                  </div>
                )}
                <div
                  className="section-subtitle spouse-drawer-card-meta"
                  style={{ fontSize: "0.65rem", fontWeight: 400, letterSpacing: "0.08em", marginTop: 2, textTransform: "none", color: "var(--tree-root)" }}
                >
                  {union.children.length}{" "}
                  {union.children.length === 1 ? "child" : "children"}
                </div>
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </>
  );
}
