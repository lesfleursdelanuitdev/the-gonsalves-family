"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FileText } from "lucide-react";
import type { CSSProperties } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  listUlStyle,
  iconColor,
  iconSize,
  iconWrapStyle,
  sectionBoxStyle,
  sectionTitleStyle,
  sectionContentStyle,
  sectionContentStyleMobile,
  sectionIconWrapStyle,
  sectionTitleStyleMobile,
  SECTION_BORDER_RADIUS,
  eventsPaginationBarStyle,
  eventsPaginationButtonStyle,
} from "./styles";
import type { NotesResponse } from "./types";

type NoteItem = NotesResponse["notes"][number];

const NOTES_PAGE_SIZE = 3;

interface NotesSectionProps {
  notes: NoteItem[];
  isMobile?: boolean;
  /** Controlled open state; use with `onOpenChange` from the person overlay. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const noteMarkdownArticleStyle: CSSProperties = {
  wordBreak: "break-word",
  fontSize: "inherit",
  lineHeight: 1.55,
};

const noteMarkdownComponents: Components = {
  p: ({ children }) => <p style={{ margin: "0 0 0.65em 0" }}>{children}</p>,
  ul: ({ children }) => (
    <ul style={{ ...listUlStyle, margin: "0 0 0.65em 0", paddingLeft: "1.25rem" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: "0 0 0.65em 0", paddingLeft: "1.25rem", listStyleType: "decimal" }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: "0.25em" }}>{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: iconColor, textDecoration: "underline", textUnderlineOffset: 2 }}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  code: ({ className, children }) => {
    const isBlock = typeof className === "string" && /\blanguage-/.test(className);
    if (isBlock) {
      return (
        <code
          className={className}
          style={{
            display: "block",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.95em",
            background: "none",
            padding: 0,
          }}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.9em",
          backgroundColor: "rgba(20, 83, 45, 0.08)",
          padding: "0.12em 0.35em",
          borderRadius: 4,
        }}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      style={{
        margin: "0 0 0.65em 0",
        padding: "0.65em 0.75em",
        overflow: "auto",
        fontSize: "0.88em",
        lineHeight: 1.45,
        backgroundColor: "rgba(20, 83, 45, 0.06)",
        borderRadius: 6,
        border: "1px solid rgba(20, 83, 45, 0.12)",
      }}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "0 0 0.65em 0",
        paddingLeft: "0.85em",
        borderLeft: "3px solid rgba(20, 83, 45, 0.25)",
        color: "rgba(20, 40, 25, 0.85)",
      }}
    >
      {children}
    </blockquote>
  ),
  h1: ({ children }) => <h3 style={{ margin: "0.75em 0 0.4em", fontSize: "1.05em", fontWeight: 700 }}>{children}</h3>,
  h2: ({ children }) => <h3 style={{ margin: "0.75em 0 0.4em", fontSize: "1.05em", fontWeight: 700 }}>{children}</h3>,
  h3: ({ children }) => <h3 style={{ margin: "0.75em 0 0.4em", fontSize: "1em", fontWeight: 700 }}>{children}</h3>,
  hr: () => <hr style={{ margin: "0.65em 0", border: "none", borderTop: "1px solid rgba(0,0,0,0.1)" }} />,
};

function NoteMarkdown({ content }: { content: string }) {
  return (
    <article style={noteMarkdownArticleStyle}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        skipHtml
        components={noteMarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

export function NotesSection({ notes, isMobile, open, onOpenChange }: NotesSectionProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const openResolved = open !== undefined ? open : internalOpen;
  const toggleOpen = () => {
    const next = !openResolved;
    onOpenChange?.(next);
    if (open === undefined) setInternalOpen(next);
  };
  const [notesPage, setNotesPage] = useState(0);

  const notesKey = useMemo(() => notes.map((n) => n.id).join(","), [notes]);

  useEffect(() => {
    setNotesPage(0);
  }, [notesKey]);

  if (notes.length === 0) return null;

  const countLabel = notes.length === 1 ? "1 note" : `${notes.length} notes`;
  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PAGE_SIZE));
  const pageIndex = Math.min(notesPage, totalPages - 1);
  const pageNotes = notes.slice(pageIndex * NOTES_PAGE_SIZE, (pageIndex + 1) * NOTES_PAGE_SIZE);
  const displayPage = pageIndex + 1;
  const rangeStart = pageIndex * NOTES_PAGE_SIZE + 1;
  const rangeEnd = Math.min((pageIndex + 1) * NOTES_PAGE_SIZE, notes.length);

  return (
    <section style={sectionBoxStyle}>
      <h3 style={{ margin: 0, padding: 0, border: "none", font: "inherit" }}>
        <button
          type="button"
          id="notes-section-toggle"
          aria-expanded={openResolved}
          aria-controls="notes-section-content"
          aria-label={openResolved ? "Collapse notes" : `Expand notes (${countLabel})`}
          onClick={toggleOpen}
          style={{
            ...sectionTitleStyle,
            ...(isMobile ? sectionTitleStyleMobile : {}),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            ...(openResolved
              ? {}
              : {
                  borderBottomLeftRadius: SECTION_BORDER_RADIUS,
                  borderBottomRightRadius: SECTION_BORDER_RADIUS,
                }),
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={sectionIconWrapStyle}>
              <FileText size={iconSize} color={iconColor} aria-hidden />
            </span>
            <span>
              Notes
              <span
                style={{
                  fontWeight: 500,
                  textTransform: "none",
                  letterSpacing: "normal",
                  color: "rgba(20, 83, 45, 0.72)",
                  marginLeft: 8,
                }}
              >
                ({countLabel})
              </span>
            </span>
          </span>
          {openResolved ? (
            <ChevronUp size={18} style={{ flexShrink: 0, color: iconColor }} aria-hidden />
          ) : (
            <ChevronDown size={18} style={{ flexShrink: 0, color: iconColor }} aria-hidden />
          )}
        </button>
      </h3>
      {openResolved ? (
        <div
          id="notes-section-content"
          role="region"
          aria-labelledby="notes-section-toggle"
          style={{
            ...sectionContentStyle,
            ...(isMobile ? sectionContentStyleMobile : {}),
          }}
        >
          <ul style={{ ...listUlStyle, listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {pageNotes.map((n, idx) => {
              const nLabel = pageIndex * NOTES_PAGE_SIZE + idx + 1;
              return (
                <li
                  key={n.id}
                  aria-posinset={nLabel}
                  aria-setsize={notes.length}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 0,
                    marginBottom: 14,
                  }}
                >
                  <span style={iconWrapStyle} aria-hidden>
                    <span
                      style={{
                        fontSize: nLabel >= 10 ? 11 : 13,
                        fontWeight: 700,
                        color: iconColor,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1,
                        minWidth: "1em",
                        textAlign: "center",
                      }}
                    >
                      {nLabel}
                    </span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <NoteMarkdown content={n.content} />
                  </div>
                </li>
              );
            })}
          </ul>
          {notes.length > NOTES_PAGE_SIZE ? (
            <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>
              <div style={eventsPaginationBarStyle} role="navigation" aria-label="Notes pagination">
                <span style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#14532d" }}>
                  Notes {rangeStart}–{rangeEnd} of {notes.length}
                </span>
                <span style={{ color: "rgba(20, 83, 45, 0.5)" }}> · </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#14532d" }}>
                  Page {displayPage} of {totalPages}
                </span>
                <button
                  type="button"
                  style={eventsPaginationButtonStyle}
                  onClick={() => setNotesPage((p) => Math.max(0, p - 1))}
                  disabled={pageIndex <= 0}
                  aria-label="Previous notes page"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  style={eventsPaginationButtonStyle}
                  onClick={() => setNotesPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIndex >= totalPages - 1}
                  aria-label="Next notes page"
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
