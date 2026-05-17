"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import type { IndividualMediaPeekItem } from "@/components/TreeViewer/v2/PersonDetailOverlay/types";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { FAMILY_MEDIA_PEEK_SAMPLE_LIMIT, useFamilyMediaPeek } from "./hooks/useFamilyMediaPeek";

function isLikelyRasterImage(form: string | null | undefined): boolean {
  const f = (form ?? "").toLowerCase().trim();
  if (!f) return true;
  return ["jpeg", "jpg", "png", "gif", "webp", "bmp", "tif", "tiff"].includes(f);
}

function mediaThumbSrc(item: IndividualMediaPeekItem): string | null {
  const ref = (item.fileRef ?? "").trim();
  if (!ref || !isLikelyRasterImage(item.form)) return null;
  return resolveGedcomMediaFileRef(ref) || null;
}

function mediaLabel(item: IndividualMediaPeekItem): string {
  return (item.title ?? "").trim() || item.id.slice(0, 8);
}

function MediaTile({ item, albumHref }: { item: IndividualMediaPeekItem; albumHref: string }) {
  const src = mediaThumbSrc(item);
  const label = mediaLabel(item);

  return (
    <Link
      href={albumHref}
      className="group block min-w-0 overflow-hidden rounded-xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
      aria-label={`Open generated album: ${label}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[linear-gradient(180deg,rgba(129,89,58,0.12),rgba(129,89,58,0.05))] sm:aspect-[16/11]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover sepia-[0.18] transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center font-heading text-[0.62rem] font-semibold leading-tight text-link/80 sm:text-sm">
            {label}
          </div>
        )}
      </div>
    </Link>
  );
}

export function FamilyProfileMediaSection({ familyId, albumHref }: { familyId: string; albumHref: string }) {
  const mediaPeek = useFamilyMediaPeek(familyId);
  const peek = mediaPeek.data;
  const loading = mediaPeek.status === "loading";
  const failed = mediaPeek.status === "error";
  const showRandomize =
    peek != null && peek.totalCount > FAMILY_MEDIA_PEEK_SAMPLE_LIMIT && peek.samples.length > 0;

  return (
    <section className="min-w-0" id="media">
      <div className="mb-6 flex flex-col gap-3 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Media</p>
          <h2 className="mt-1 font-heading text-3xl font-semibold text-heading">Family Media</h2>
          {peek?.totalCount ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Showing {peek.samples.length} of {peek.totalCount} linked media items. Randomize the preview or open the
              generated album to browse everything.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {showRandomize ? (
            <button
              type="button"
              onClick={mediaPeek.randomizeSamples}
              disabled={mediaPeek.samplesRefetchBusy}
              aria-busy={mediaPeek.samplesRefetchBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${mediaPeek.samplesRefetchBusy ? "animate-spin" : ""}`} aria-hidden />
              {mediaPeek.samplesRefetchBusy ? "Updating..." : "Randomize"}
            </button>
          ) : null}
          <Link
            href={albumHref}
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg sm:w-auto"
          >
            Open Generated Album <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-xl border border-border/70 bg-surface-elevated/80 sm:aspect-[16/11]"
            />
          ))}
        </div>
      ) : failed ? (
        <p className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center text-sm text-muted">
          Media could not be loaded.
        </p>
      ) : peek != null && peek.totalCount > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {peek.samples.map((item) => (
            <MediaTile key={item.id} item={item} albumHref={albumHref} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center text-sm text-muted">
          No linked media is available yet.
        </p>
      )}
    </section>
  );
}
