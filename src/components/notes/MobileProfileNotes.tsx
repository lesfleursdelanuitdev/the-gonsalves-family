"use client";

import { useEffect, useMemo, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicProfileNote } from "@/lib/notes/public-profile-note";

const MOBILE_NOTES_PAGE_SIZE = 3;

const noteMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-link/10 px-1 py-0.5 font-mono text-[0.88em] text-heading">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-md border border-border-subtle bg-link/5 p-2 text-[0.9em] last:mb-0">
      {children}
    </pre>
  ),
};

export function MobileProfileNotes({
  notes,
  subjectName,
}: {
  notes: PublicProfileNote[];
  subjectName: string;
}) {
  const [notesPage, setNotesPage] = useState(1);
  const notesTotalPages = Math.max(1, Math.ceil(notes.length / MOBILE_NOTES_PAGE_SIZE));
  const safeNotesPage = Math.min(notesPage, notesTotalPages);
  const visibleNotes = useMemo(() => {
    const start = (safeNotesPage - 1) * MOBILE_NOTES_PAGE_SIZE;
    return notes.slice(start, start + MOBILE_NOTES_PAGE_SIZE);
  }, [notes, safeNotesPage]);

  useEffect(() => {
    setNotesPage((page) => Math.min(Math.max(1, page), notesTotalPages));
  }, [notesTotalPages]);

  if (notes.length === 0) return null;

  return (
    <section id="notes" className="scroll-mt-[7.5rem] px-4 py-8 md:hidden">
      <div className="text-center">
        <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Notes</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Notes</h2>
        <p className="mt-1 font-body text-sm leading-relaxed text-muted">Notes about {subjectName} from the archive.</p>
      </div>
      <div className="mt-5 space-y-3">
        {visibleNotes.map((note) => (
          <article
            key={note.id}
            className="rounded-xl border border-border-subtle bg-surface-elevated p-4 shadow-[0_6px_18px_rgba(60,45,25,0.06)] [border-left-width:3px] border-l-crimson"
          >
            <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">From the record</p>
            <div className="mt-2 whitespace-pre-wrap font-body text-[0.94rem] leading-relaxed text-heading">
              <ReactMarkdown remarkPlugins={[remarkBreaks]} skipHtml components={noteMarkdownComponents}>
                {note.content}
              </ReactMarkdown>
            </div>
          </article>
        ))}
      </div>
      {notesTotalPages > 1 ? (
        <nav aria-label="Notes pagination" className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setNotesPage((page) => Math.max(1, page - 1))}
            disabled={safeNotesPage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <span className="font-body text-xs font-semibold tabular-nums text-muted">
            {safeNotesPage} / {notesTotalPages}
          </span>
          <button
            type="button"
            onClick={() => setNotesPage((page) => Math.min(notesTotalPages, page + 1))}
            disabled={safeNotesPage === notesTotalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
