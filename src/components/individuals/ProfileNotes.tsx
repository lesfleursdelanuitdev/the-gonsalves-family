"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { LivingGatedNotePrompt } from "@/components/notes/LivingGatedNotePrompt";
import type { PublicProfileNote } from "@/lib/notes/public-profile-note";

const NOTES_PER_PAGE = 3;

export function ProfileNotes({
  notes,
  description = "Source notes and transcribed remarks connected directly to this person.",
}: {
  notes: PublicProfileNote[];
  description?: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
  const pageIndex = Math.min(page, totalPages);
  const visibleNotes = useMemo(() => {
    const start = (pageIndex - 1) * NOTES_PER_PAGE;
    return notes.slice(start, start + NOTES_PER_PAGE);
  }, [notes, pageIndex]);

  return (
    <section id="notes" className="scroll-mt-28 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]">
      <div className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Notes</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Notes</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="grid gap-4">
        {notes.length > 0 ? (
          visibleNotes.map((note) => (
            <article key={note.id} className="rounded-xl border border-border-subtle/80 bg-surface-elevated/80 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-link">
                  {note.xref ?? "Note"}
                </span>
              </div>
              {note.privacyRestricted && note.loginHref ? (
                <LivingGatedNotePrompt loginHref={note.loginHref} />
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-text">{note.content}</p>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center text-sm text-muted">
            No notes are linked to this profile yet.
          </p>
        )}
      </div>

      {notes.length > NOTES_PER_PAGE ? (
        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-border-subtle pt-4 sm:flex-row">
          <p className="text-sm text-muted">
            Showing {(pageIndex - 1) * NOTES_PER_PAGE + 1}-{Math.min(pageIndex * NOTES_PER_PAGE, notes.length)} of {notes.length} notes
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pageIndex === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </button>
            <span className="rounded-lg border border-border-subtle bg-bg/70 px-3 py-2 text-xs font-semibold text-muted">
              {pageIndex} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={pageIndex === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
