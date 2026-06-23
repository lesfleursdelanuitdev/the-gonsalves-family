import Image from "next/image";
import Link from "next/link";
import {
  BookMarked,
  CalendarCheck,
  ExternalLink,
  FileText,
  Film,
  MapPin,
  Music,
  Play,
  User,
  Users,
} from "lucide-react";
import type { MediaBucket, MediaLinkKind, MediaListItem } from "./types";
import { LIVING_MEDIA_PLACEHOLDER_COVER } from "@/lib/auth/living-media-constants";

const RESTRICTED_THUMB = LIVING_MEDIA_PLACEHOLDER_COVER;

const LINK_ICON: Record<MediaLinkKind, typeof User> = {
  person: User,
  family: Users,
  event: CalendarCheck,
  place: MapPin,
  source: BookMarked,
};

const BUCKET_ICON: Record<Exclude<MediaBucket, "image">, typeof FileText> = {
  document: FileText,
  audio: Music,
  video: Film,
};

const MAX_CHIPS = 4;

function MediaThumb({ item }: { item: MediaListItem }) {
  if (item.privacyRestricted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={RESTRICTED_THUMB}
          alt=""
          fill
          className="object-cover object-center sepia-[0.28] saturate-[0.72]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,241,228,0.06),rgba(64,41,24,0.18))]" />
        <p className="relative z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
          Sign in to view
        </p>
      </div>
    );
  }
  if (item.bucket === "image") {
    return (
      <>
        <Image
          src={item.fileUrl}
          alt={item.title || item.filename}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-black/4 to-transparent" />
      </>
    );
  }
  const Icon = BUCKET_ICON[item.bucket];
  const ActionIcon = item.bucket === "document" ? ExternalLink : Play;
  return (
    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1ead9,#e6dcc6)]">
      <Icon className="h-14 w-14 text-link/70" strokeWidth={1.4} aria-hidden />
      <span className="absolute bottom-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition group-hover:bg-black/70">
        <ActionIcon className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );
}

export function MediaCard({ item, onOpen }: { item: MediaListItem; onOpen?: () => void }) {
  const shownLinks = item.linkedTo.slice(0, MAX_CHIPS);
  const remaining = item.linkedTo.length - shownLinks.length;
  const showTitle = item.title != null && item.title.toLowerCase() !== item.filename.toLowerCase();
  const openVerb =
    item.bucket === "document" ? "Open" : item.bucket === "image" ? "View" : "Play";

  return (
    <article className="group flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${openVerb} ${item.title || item.filename}`}
        className="relative block aspect-[4/3] w-full max-w-full cursor-pointer overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <MediaThumb item={item} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="break-words font-heading text-base font-semibold leading-tight text-heading" title={item.filename}>
            {item.filename}
          </h3>
          {showTitle ? <p className="break-words text-sm text-muted">{item.title}</p> : null}
        </div>

        {item.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{item.description}</p>
        ) : null}

        <div className="mt-auto min-w-0">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Linked to</p>
          {item.linkedTo.length === 0 ? (
            <p className="mt-1 text-xs text-muted/70">Not linked to anything yet</p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {shownLinks.map((link, i) => {
                const Icon = LINK_ICON[link.kind];
                const chipClass =
                  "inline-flex max-w-full items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg";
                if (link.isLivingSummary || !link.href) {
                  return (
                    <span
                      key={`${link.kind}-${i}`}
                      title={link.label}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-muted"
                    >
                      <Icon className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">{link.label}</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={`${link.kind}-${i}`}
                    href={link.href}
                    title={`${link.kind}: ${link.label}`}
                    className={chipClass}
                  >
                    <Icon className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{link.label}</span>
                  </Link>
                );
              })}
              {remaining > 0 ? (
                <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                  +{remaining} more
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
