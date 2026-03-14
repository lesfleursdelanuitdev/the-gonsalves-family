"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChartDrawer } from "./ChartDrawer";

const MOBILE_BREAKPOINT = 640;

const LETTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  ...Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return { value: letter, label: letter };
  }),
];

/** First character of string as A–Z, or "" if empty/non-letter. Used for client-side letter filtering. */
function getFirstLetter(s: string): string {
  const c = (s ?? "").trim().charAt(0).toUpperCase();
  return c >= "A" && c <= "Z" ? c : "";
}

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

/** True after first client mount. Use so we only portal after hydration and avoid server/client mismatch. */
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export interface GoToPersonItem {
  id: string;
  firstName: string;
  lastName: string;
  /** Layout position so we can center on this specific instance (same person may appear multiple times). */
  x?: number;
  y?: number;
}

export interface GoToPersonDrawerProps {
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
  const [firstLetterGivenName, setFirstLetterGivenName] = useState("");
  const [firstLetterLastName, setFirstLetterLastName] = useState("");

  const filtered = useMemo(() => {
    let list: GoToPersonItem[];
    if (isMobile) {
      list = people.filter((p) => {
        const matchFirst =
          !firstLetterGivenName || getFirstLetter(p.firstName) === firstLetterGivenName;
        const matchLast =
          !firstLetterLastName || getFirstLetter(p.lastName) === firstLetterLastName;
        return matchFirst && matchLast;
      });
    } else {
      const q = search.trim().toLowerCase();
      list = !q
        ? [...people]
        : people.filter(
            (p) =>
              p.firstName.toLowerCase().includes(q) ||
              p.lastName.toLowerCase().includes(q) ||
              `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
          );
    }
    return list.sort((a, b) => {
      const cmp = (a.lastName ?? "").localeCompare(b.lastName ?? "", undefined, { sensitivity: "base" });
      return cmp !== 0 ? cmp : (a.firstName ?? "").localeCompare(b.firstName ?? "", undefined, { sensitivity: "base" });
    });
  }, [people, search, isMobile, firstLetterGivenName, firstLetterLastName]);

  useEffect(() => {
    if (!open) {
      setFirstLetterGivenName("");
      setFirstLetterLastName("");
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const isMounted = useIsMounted();
  if (!isMounted) return null;

  const content = (
    <ChartDrawer
      open={open}
      anchor="bottom"
      onClose={onClose}
      showBackdrop
      zIndex={99}
      style={{
        display: "flex",
        flexDirection: "column",
        maxHeight: isMobile ? 320 : 200,
        padding: 0,
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
              fontSize: isMobile ? 10 : 14,
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
              fontSize: isMobile ? 14 : 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        {isMobile && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
            }}
          >
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--tree-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                First name (letter)
              </span>
              <select
                value={firstLetterGivenName}
                onChange={(e) => setFirstLetterGivenName(e.target.value)}
                aria-label="Filter by first letter of first name"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                  border: "1px solid var(--tree-panel-border)",
                  borderRadius: 6,
                  background: "var(--tree-surface-dim)",
                  color: "var(--tree-text)",
                  cursor: "pointer",
                }}
              >
                {LETTER_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--tree-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Last name (letter)
              </span>
              <select
                value={firstLetterLastName}
                onChange={(e) => setFirstLetterLastName(e.target.value)}
                aria-label="Filter by first letter of last name"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                  border: "1px solid var(--tree-panel-border)",
                  borderRadius: 6,
                  background: "var(--tree-surface-dim)",
                  color: "var(--tree-text)",
                  cursor: "pointer",
                }}
              >
                {LETTER_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
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
              padding: "8px 12px",
              fontSize: 15,
              minHeight: 38,
              fontFamily: "Inter, sans-serif",
              border: "1px solid #e5dcc8",
              borderRadius: 6,
              background: "rgba(229, 220, 200, 0.55)",
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
              padding: isMobile ? "8px 12px" : "12px 16px",
              textAlign: "center",
              fontSize: isMobile ? 11 : 15,
              color: "var(--tree-text-muted)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isMobile && (firstLetterGivenName || firstLetterLastName)
              ? "No people match the selected letters."
              : search.trim()
                ? "No names match your search."
                : "No people on this tree."}
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
                  padding: isMobile ? "4px 12px" : "8px 16px",
                  border: "none",
                  background: isRoot ? "var(--hover-overlay)" : "transparent",
                  color: isRoot ? "var(--tree-root)" : "var(--tree-text)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: isMobile ? 11 : 15,
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
    </ChartDrawer>
  );

  return createPortal(content, document.body);
}
