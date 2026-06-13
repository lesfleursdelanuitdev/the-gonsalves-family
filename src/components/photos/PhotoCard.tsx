import Image from "next/image";
import Link from "next/link";
import { BookMarked, CalendarCheck, MapPin, User, Users } from "lucide-react";
import type { PhotoLinkKind, PhotoListItem } from "./types";

const LINK_ICON: Record<PhotoLinkKind, typeof User> = {
  person: User,
  family: Users,
  event: CalendarCheck,
  place: MapPin,
  source: BookMarked,
};

const MAX_CHIPS = 4;

export function PhotoCard({ photo, onOpen }: { photo: PhotoListItem; onOpen?: () => void }) {
  const shownLinks = photo.linkedTo.slice(0, MAX_CHIPS);
  const remaining = photo.linkedTo.length - shownLinks.length;
  const showTitle =
    photo.title != null && photo.title.toLowerCase() !== photo.filename.toLowerCase();

  return (
    <article className="group flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${photo.title || photo.filename}`}
        className="relative block aspect-[4/3] w-full max-w-full cursor-zoom-in overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <Image
          src={photo.src}
          alt={photo.title || photo.filename}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-black/4 to-transparent" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="break-words font-heading text-base font-semibold leading-tight text-heading" title={photo.filename}>
            {photo.filename}
          </h3>
          {showTitle ? <p className="break-words text-sm text-muted">{photo.title}</p> : null}
        </div>

        {photo.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{photo.description}</p>
        ) : null}

        <div className="mt-auto min-w-0">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">Linked to</p>
          {photo.linkedTo.length === 0 ? (
            <p className="mt-1 text-xs text-muted/70">Not linked to anything yet</p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {shownLinks.map((link, i) => {
                const Icon = LINK_ICON[link.kind];
                return (
                  <Link
                    key={`${link.kind}-${i}`}
                    href={link.href}
                    title={`${link.kind}: ${link.label}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[11px] font-medium text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
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
