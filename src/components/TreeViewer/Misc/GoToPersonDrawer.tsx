"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

const MOBILE_BREAKPOINT = 640;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mql.matches);
    const listener = () => setIsMobile(mql.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);
  return isMobile;
}

export interface GoToPersonItem {
  id: string;
  firstName: string;
  lastName: string;
  /** Layout position so we can center on this specific instance (same person may appear multiple times). */
  x?: number;
  y?: number;
}

interface GoToPersonDrawerProps {
  open: boolean;
  people: GoToPersonItem[];
  rootId: string;
  onClose: () => void;
  /** Called with personId and optional layout (x,y). When x,y provided, center on that position. */
  onSelectPerson: (personId: string, layoutX?: number, layoutY?: number) => void;
}

export function GoToPersonDrawer({
  open,
  people,
  rootId,
  onClose,
  onSelectPerson,
}: GoToPersonDrawerProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? [...people]
      : people.filter(
          (p) =>
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
        );
    return list.sort((a, b) => {
      const cmp = (a.lastName ?? "").localeCompare(b.lastName ?? "", undefined, { sensitivity: "base" });
      return cmp !== 0 ? cmp : (a.firstName ?? "").localeCompare(b.firstName ?? "", undefined, { sensitivity: "base" });
    });
  }, [people, search]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="go-to-person-title"
      style={{ position: "fixed", inset: 0, zIndex: 100 }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--tree-panel-bg)",
          borderTop: "1px solid var(--tree-border)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "200px",
          width: "100%",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          outline: "none",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: isMobile ? "8px 12px" : "8px 12px 6px",
            borderBottom: "1px solid var(--tree-panel-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isMobile ? 0 : 6,
            }}
          >
            <h2
              id="go-to-person-title"
              style={{
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                color: "var(--tree-text)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Go to person
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--tree-text-subtle)",
                fontSize: 14,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
          {!isMobile && (
            <input
              type="search"
              placeholder="Search names…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => {
                e.preventDefault();
                const el = e.currentTarget;
                setTimeout(() => {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
              }}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "4px 8px",
                fontSize: 11,
                minHeight: 28,
                fontFamily: "Inter, sans-serif",
                border: "1px solid var(--tree-panel-border)",
                borderRadius: 6,
                background: "var(--surface-inset)",
                color: "var(--tree-text)",
                outline: "none",
              }}
            />
          )}
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "4px 0",
            overscrollBehavior: "contain",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontSize: 11,
                color: "var(--tree-text-muted)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {search.trim() ? "No names match your search." : "No people on this tree."}
            </div>
          ) : (
            filtered.map((p) => {
              const name = `${p.firstName} ${p.lastName}`.trim() || "Unknown";
              const isRoot = p.id === rootId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectPerson(p.id, p.x, p.y);
                    onClose();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "4px 12px",
                    border: "none",
                    background: isRoot ? "var(--hover-overlay)" : "transparent",
                    color: isRoot ? "var(--tree-root)" : "var(--tree-text)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    textAlign: "left",
                    cursor: "pointer",
                    fontWeight: isRoot ? 600 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
