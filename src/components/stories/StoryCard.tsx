"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BookOpen, FileText, Scroll, LayoutGrid, X } from "lucide-react";
import type { StoryListItem } from "@/lib/stories/story-queries";
import { StoryKind } from "@ligneous/prisma";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";

// ── Kind metadata ─────────────────────────────────────────────────────────────
function kindMeta(kind: StoryKind): { label: string; href: (slug: string) => string; Icon: typeof BookOpen } {
  if (kind === StoryKind.article || kind === StoryKind.post) {
    return { label: kind === StoryKind.post ? "Post" : "Article", href: (s) => `/culture/articles/${encodeURIComponent(s)}`, Icon: FileText };
  }
  if (kind === StoryKind.folklore) {
    return { label: "Folklore", href: (s) => `/stories/${encodeURIComponent(s)}`, Icon: Scroll };
  }
  return { label: "Story", href: (s) => `/stories/${encodeURIComponent(s)}`, Icon: BookOpen };
}

// ── Event label helpers (copied locally to keep component self-contained) ────
const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRT: "Birth", DEAT: "Death", MARR: "Marriage", DIV: "Divorce",
  BURI: "Burial", RESI: "Residence", IMMI: "Immigration", EMIG: "Emigration",
  NATU: "Naturalization", CENS: "Census", GRAD: "Graduation",
  OCCU: "Occupation", RELI: "Religion", WILL: "Will", PROB: "Probate",
  ADOP: "Adoption", BAPM: "Baptism", CHR: "Christening", CONF: "Confirmation",
  ORDN: "Ordination", NCHI: "Children", EVEN: "Event",
};
function eventLabel(eventType: string, customType: string | null): string {
  return EVENT_TYPE_LABELS[eventType] ?? customType ?? eventType;
}

type FamilyRow = StoryListItem["storyFamilies"][number]["family"];
function familyDisplayName(family: FamilyRow): string {
  const h = formatGedcomFullNameForDisplay(family.husband?.fullName ?? null) || null;
  const w = formatGedcomFullNameForDisplay(family.wife?.fullName ?? null) || null;
  if (h && w) return `Family of ${h} and ${w}`;
  if (h) return `Family of ${h}`;
  if (w) return `Family of ${w}`;
  return `Family ${family.xref.replace(/^@+|@+$/g, "").trim() || family.xref}`;
}

// ── Entity type config — only existing CSS token colors ──────────────────────
const ENTITY_CONFIG = {
  people:   { label: "People",   color: "var(--success)",  bg: "color-mix(in srgb, var(--success) 12%, var(--surface-elevated))" },
  families: { label: "Families", color: "var(--warning)",  bg: "color-mix(in srgb, var(--warning) 12%, var(--surface-elevated))" },
  events:   { label: "Events",   color: "var(--crimson)",  bg: "color-mix(in srgb, var(--crimson) 12%, var(--surface-elevated))" },
} as const;
type EntityKey = keyof typeof ENTITY_CONFIG;
const ENTITY_ORDER: EntityKey[] = ["people", "families", "events"];

// ── Tiny entity glyphs (mirrors EntityIcon paths at 12 px) ────────────────────
function EntityGlyph({ type }: { type: EntityKey }) {
  const base = { className: "shrink-0", width: 12, height: 12, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 };
  if (type === "people")
    return <svg {...base}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  if (type === "families")
    return <svg {...base}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  return <svg {...base}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}

// ── Author avatar (profile photo or monogram fallback) ───────────────────────
function AuthorAvatar({
  name,
  avatarUrl,
  size = 32,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const sharedStyle = {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    overflow: "hidden" as const,
  };

  if (avatarUrl) {
    return (
      <span aria-hidden="true" style={sharedStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </span>
    );
  }

  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{
        ...sharedStyle,
        background: "var(--link-soft-bg)",
        color: "var(--link)",
        fontSize: size * 0.34,
        fontWeight: 600,
        fontFamily: "var(--font-body-raw), system-ui, sans-serif",
        letterSpacing: "0.03em",
      }}
    >
      {initials}
    </span>
  );
}

// ── Linked-records modal — portaled to body to escape CSS transforms ───────────
function LinkedRecordsModal({
  title,
  entityLists,
  total,
  onClose,
}: {
  title: string;
  entityLists: { key: EntityKey; names: string[] }[];
  total: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (typeof document === "undefined") return null;

  const dialog = (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lr-title"
        style={{
          position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(44,42,38,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 id="lr-title" className="font-heading" style={{ fontSize: 15, fontWeight: 600, color: "var(--heading)", margin: 0, lineHeight: 1.3 }}>
              Linked Records
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
              {title} · {total} record{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", marginTop: -4, marginRight: -8 }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {entityLists.map(({ key, names }) => {
              const cfg = ENTITY_CONFIG[key];
              return (
                <div key={key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, color: cfg.color }}>
                    <EntityGlyph type={key} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                      {cfg.label} · {names.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {names.map((name, i) => (
                      <span key={i} style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 500, background: cfg.bg, color: cfg.color }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 24px", borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--primary)", color: "var(--primary-foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

// ── StoryCard ─────────────────────────────────────────────────────────────────
export function StoryCard({ story }: { story: StoryListItem }) {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal  = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const slug = story.slug ?? story.id;
  const { label, href, Icon } = kindMeta(story.kind);

  const tags: string[] = (story.tags as string[] | null) ?? [];
  const dateStr = new Date(story.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const publisherName = story.author?.name?.trim() || story.author?.username?.trim() || null;

  // Entity lists
  const peopleNames = story.storyIndividuals.map(({ individual }) =>
    formatGedcomFullNameForDisplay(individual.fullName) || individual.xref || "Unknown"
  );
  const familyNames = story.storyFamilies.map(({ family }) => familyDisplayName(family));
  const eventNames  = story.storyEvents.map(({ event }) => eventLabel(event.eventType, event.customType));

  const entityLists = (
    [
      { key: "people"   as EntityKey, names: peopleNames },
      { key: "families" as EntityKey, names: familyNames },
      { key: "events"   as EntityKey, names: eventNames  },
    ] satisfies { key: EntityKey; names: string[] }[]
  ).filter((e) => e.names.length > 0);

  const total = entityLists.reduce((sum, e) => sum + e.names.length, 0);

  return (
    <>
      <article
        className="group overflow-hidden"
        style={{
          borderRadius: 16,
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 24px rgba(60,45,25,0.08)",
          transition: "box-shadow 300ms, transform 300ms",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 32px rgba(60,45,25,0.14)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(60,45,25,0.08)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* ── Cover banner ── */}
        <div
          style={{
            position: "relative",
            height: 220,
            backgroundImage: story.coverUrl ? `url(${story.coverUrl})` : undefined,
            backgroundColor: story.coverUrl ? undefined : "var(--surface-inset)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
          }}
        >
          {/* No cover: subtle gradient placeholder */}
          {!story.coverUrl && (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--surface-inset) 0%, var(--surface-2) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={40} style={{ color: "var(--border-subtle)", opacity: 0.6 }} strokeWidth={1} />
            </div>
          )}

          {/* Kind pill — glass overlay */}
          <div style={{
            position: "absolute", top: 14, left: 14,
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 13px", borderRadius: 9999,
            background: story.coverUrl ? "rgba(0,0,0,0.42)" : "rgba(44,42,38,0.12)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            color: story.coverUrl ? "#ffffff" : "var(--text-muted)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            <LayoutGrid size={11} strokeWidth={2.2} />
            {label}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "22px 24px 18px", flex: 1 }}>

          {/* Title + excerpt */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 className="font-heading" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25, color: "var(--heading)", margin: 0 }}>
              {story.title}
            </h3>
            {story.excerpt ? (
              <p className="line-clamp-3" style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--text-muted)", margin: 0 }}>
                {story.excerpt}
              </p>
            ) : null}
          </div>

          {/* Authors */}
          {story.parsedAuthors.length > 0 && (
            <>
              <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {story.parsedAuthors.map((credit, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <AuthorAvatar name={credit.name} avatarUrl={credit.avatarUrl} size={30} />
                  <div>
                    {credit.role ? (
                      <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-subtle)", margin: 0 }}>
                        {credit.role}
                      </p>
                    ) : null}
                    {credit.personId ? (
                      <Link
                        href={`/individuals/${encodeURIComponent(credit.personId)}`}
                        style={{ fontSize: 13, fontWeight: 600, color: "var(--heading)", textDecoration: "none" }}
                      >
                        {credit.name}
                      </Link>
                    ) : (
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--heading)", margin: 0 }}>
                        {credit.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: 0 }} />

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {tags.slice(0, 6).map((tag) => (
                <span key={tag} style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 11.5, border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  {tag}
                </span>
              ))}
              {tags.length > 6 && (
                <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 11.5, border: "1px solid var(--border-subtle)", color: "var(--text-subtle)" }}>
                  +{tags.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Linked records */}
          {entityLists.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-subtle)" }}>
                  Linked Records · {total}
                </span>
                <button
                  onClick={openModal}
                  style={{ fontSize: 12, fontWeight: 500, color: "var(--link)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  View all →
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {entityLists.map(({ key, names }) => {
                  const cfg = ENTITY_CONFIG[key];
                  return (
                    <button
                      key={key}
                      onClick={openModal}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", borderRadius: 9999,
                        fontSize: 11.5, fontWeight: 500,
                        background: cfg.bg, color: cfg.color,
                        border: "none", cursor: "pointer",
                        transition: "opacity 150ms ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                      <EntityGlyph type={key} />
                      <span>{names.length}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Publisher */}
          {publisherName && (
            <>
              <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <AuthorAvatar name={publisherName} size={26} />
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Published by{" "}
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{publisherName}</span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 24px",
          borderTop: "1px solid var(--border-subtle)",
        }}>
          <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
            {dateStr}
          </span>
          <Link
            href={href(slug)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8,
              background: "var(--primary)", color: "var(--primary-foreground)",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            Read {label} <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>→</span>
          </Link>
        </div>
      </article>

      {modalOpen && (
        <LinkedRecordsModal
          title={story.title}
          entityLists={entityLists}
          total={total}
          onClose={closeModal}
        />
      )}
    </>
  );
}
