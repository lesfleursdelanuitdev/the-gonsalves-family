import Link from "next/link";
import { NOTE_LINKED_LIST_VISIBLE_MAX } from "@ligneous/gedcom-events";
import type { PublicNote, PublicNoteLink, PublicNoteLinkKind } from "@/lib/notes/public-note-types";
import "./note-card.css";

function ChipIcon({ kind }: { kind: PublicNoteLinkKind }) {
  if (kind === "individual") {
    return (
      <svg className="note-card__chip-icon" viewBox="0 0 10 10" aria-hidden>
        <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M5 1 A4 4 0 0 1 5 9 Z" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "family") {
    return (
      <svg className="note-card__chip-icon" viewBox="0 0 10 10" aria-hidden>
        <path
          d="M5 1.5 L8.5 4.25 V8.5 H6.25 V6 H3.75 V8.5 H1.5 V4.25 Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
      </svg>
    );
  }
  if (kind === "event") {
    return (
      <svg className="note-card__chip-icon" viewBox="0 0 10 10" aria-hidden>
        <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="note-card__chip-icon" viewBox="0 0 10 10" aria-hidden>
      <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

function LinkedChip({ target }: { target: PublicNoteLink }) {
  const chipClass = `note-card__chip note-card__chip--${target.kind}`;
  const inner = (
    <>
      <ChipIcon kind={target.kind} />
      <span className="note-card__chip-label">{target.label}</span>
    </>
  );

  if (target.href) {
    return (
      <Link href={target.href} className={chipClass}>
        {inner}
      </Link>
    );
  }

  return <span className={chipClass}>{inner}</span>;
}

/** Archive note card — layout and styles from notesCards.zip (note-card-v1). */
export function NoteCard({ note }: { note: PublicNote }) {
  const linked = note.linkedTargets;
  const visible = linked.slice(0, NOTE_LINKED_LIST_VISIBLE_MAX);
  const overflow = Math.max(0, linked.length - visible.length);
  const hasPreview = note.contentPreview.trim().length > 0;

  return (
    <article className="note-card">
      <span className="note-card__quote" aria-hidden>
        &ldquo;
      </span>

      <header className="note-card__header">
        <h2 className="note-card__title">
          Note <span className="note-card__title-num">{note.displayNumber}</span>
        </h2>
      </header>

      <p className={`note-card__body${hasPreview ? "" : " note-card__body--empty"}`}>
        {hasPreview ? note.contentPreview : "No content recorded for this note."}
      </p>

      <hr className="note-card__divider" />

      <footer className="note-card__footer">
        <p className="note-card__linked-label">Linked to · {linked.length}</p>
        {linked.length === 0 ? (
          <p className="note-card__linked-empty">No linked entities</p>
        ) : (
          <div className="note-card__chips">
            {visible.map((target, i) => (
              <LinkedChip key={`${target.kind}-${target.label}-${i}`} target={target} />
            ))}
            {overflow > 0 ? (
              <span className="note-card__chip note-card__chip--overflow">+{overflow}</span>
            ) : null}
          </div>
        )}
      </footer>
    </article>
  );
}
