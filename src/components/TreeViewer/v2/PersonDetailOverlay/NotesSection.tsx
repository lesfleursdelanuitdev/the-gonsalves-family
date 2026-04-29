"use client";

import { FileText } from "lucide-react";
import type { CSSProperties } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Section } from "./Section";
import { listUlStyle, iconColor, iconSize } from "./styles";
import type { NotesResponse } from "./types";

type NoteItem = NotesResponse["notes"][number];

interface NotesSectionProps {
  notes: NoteItem[];
  isMobile?: boolean;
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

export function NotesSection({ notes, isMobile }: NotesSectionProps) {
  if (notes.length === 0) return null;

  return (
    <Section
      icon={<FileText size={iconSize} color={iconColor} aria-hidden />}
      title="Notes"
      isMobile={isMobile}
    >
      <ul style={{ ...listUlStyle, listStyle: "none", paddingLeft: 0 }}>
        {notes.map((n) => (
          <li key={n.id} style={{ marginBottom: 14 }}>
            <NoteMarkdown content={n.content} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
