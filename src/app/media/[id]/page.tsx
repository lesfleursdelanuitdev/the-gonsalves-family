"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Globe,
  Leaf,
  MapPin,
  RotateCcw,
  Share2,
  Tag,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { gedcomNameToDisplayName } from "@ligneous/album-view";
import { gedcomEventTypeDisplayLabel } from "@/lib/gedcom-event-display";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { readJsonResponse } from "@/lib/read-json-response";
import { buildPublicMediaPath, parseSourceFromSearchParams, sourceToAlbumPath } from "@/lib/album/public-album-links";
import { formatGedcomDateDisplayLabel } from "@ligneous/gedcom-dates";

type MediaViewPayload = {
  source: {
    kind: "curated" | "generated";
    title: string;
    description: string | null;
    totalCount: number;
    coverMedia: { id: string; title: string | null; fileRef: string | null; form: string | null } | null;
  };
  media: {
    id: string;
    title: string | null;
    fileRef: string | null;
    form: string | null;
    description: string | null;
    linkedIndividuals: Array<{ id: string; displayName: string }>;
    places: Array<{ id: string; original: string; name: string | null; county: string | null; state: string | null; country: string | null }>;
    dates: Array<{ id: string; original: string | null; dateType: string; year: number | null; month: number | null; day: number | null; endYear: number | null; endMonth: number | null; endDay: number | null }>;
    events: Array<{
      id: string;
      eventType: string;
      customType: string | null;
      individualEvents: Array<{ individual: { id: string; fullName: string | null; xref: string } | null }>;
      familyEvents: Array<{ family: { husband: { id: string; fullName: string | null; xref: string } | null; wife: { id: string; fullName: string | null; xref: string } | null } | null }>;
    }>;
    families: Array<{
      id: string;
      husband: { fullName: string | null; xref: string } | null;
      wife: { fullName: string | null; xref: string } | null;
    }>;
    tags: Array<{ id: string; name: string }>;
    albums: Array<{ id: string; name: string }>;
  };
};

function inferFilename(fileRef: string | null | undefined): string {
  const raw = (fileRef ?? "").trim();
  if (!raw) return "Media";
  const noQuery = raw.split("?")[0] ?? raw;
  const seg = noQuery.split("/").filter(Boolean).pop() ?? noQuery;
  try {
    const decoded = decodeURIComponent(seg);
    return decoded || seg;
  } catch {
    return seg;
  }
}

function formatPlace(p: { original: string; name: string | null; county: string | null; state: string | null; country: string | null }): string {
  const structured = [p.name, p.county, p.state, p.country].map((x) => (x ?? "").trim()).filter(Boolean).join(", ");
  const orig = (p.original ?? "").trim();
  if (structured && orig && orig !== structured) return `${structured} - ${orig}`;
  return structured || orig || "Unknown place";
}

function formatEventLabel(e: MediaViewPayload["media"]["events"][number]): string {
  const base =
    e.eventType?.toUpperCase() === "EVEN" && (e.customType ?? "").trim()
      ? (e.customType ?? "").trim()
      : gedcomEventTypeDisplayLabel(e.eventType);

  const individual = e.individualEvents?.[0]?.individual;
  if (individual) {
    const n = gedcomNameToDisplayName(individual.fullName, individual.xref);
    return `${base} of ${n}`;
  }

  const fam = e.familyEvents?.[0]?.family;
  const husband = fam?.husband ? gedcomNameToDisplayName(fam.husband.fullName, fam.husband.xref) : "";
  const wife = fam?.wife ? gedcomNameToDisplayName(fam.wife.fullName, fam.wife.xref) : "";
  const pair = [husband, wife].filter(Boolean).join(" and ");
  if (pair) return `${base} of ${pair}`;
  return base;
}

function formatFamilyLabel(f: MediaViewPayload["media"]["families"][number]): string {
  const husband = f.husband ? gedcomNameToDisplayName(f.husband.fullName, f.husband.xref) : "";
  const wife = f.wife ? gedcomNameToDisplayName(f.wife.fullName, f.wife.xref) : "";
  const pair = [husband, wife].filter(Boolean).join(" and ");
  return pair || "Family";
}

function renderMediaStyledTitle(title: string): React.ReactNode {
  const m = /^media\b/i.exec(title.trim());
  if (!m) return title;
  const full = title.trim();
  const rest = full.slice(m[0].length);
  return (
    <>
      <span
        className="italic underline underline-offset-4"
        style={{
          textDecorationColor: "#8b2e2e",
          textDecorationThickness: "3px",
        }}
      >
        Media
      </span>
      {rest}
    </>
  );
}

const LB_ZOOM_MIN = 1;
const LB_ZOOM_MAX = 5;

function touchPairDistance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(ax - bx, ay - by);
}

function MediaDetailLightbox({
  src,
  fileTitle,
  onClose,
}: {
  src: string;
  fileTitle: string;
  onClose: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  scaleRef.current = scale;

  const pinchRef = useRef<{ initialDist: number; baseScale: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  const zoomIn = useCallback(() => setScale((s) => Math.min(LB_ZOOM_MAX, s * 1.25)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(LB_ZOOM_MIN, s / 1.25)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    pinchRef.current = null;
    lastPointerRef.current = null;
    lastTouchRef.current = null;
  }, []);

  useEffect(() => {
    if (scale <= 1) {
      setPan({ x: 0, y: 0 });
      lastTouchRef.current = null;
    }
  }, [scale]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 1 / 1.1;
      setScale((s) => Math.min(LB_ZOOM_MAX, Math.max(LB_ZOOM_MIN, s * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale((s) => Math.min(LB_ZOOM_MAX, s * 1.15));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setScale((s) => Math.max(LB_ZOOM_MIN, s / 1.15));
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetView]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (scaleRef.current <= LB_ZOOM_MIN) return;
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (!lastPointerRef.current) return;
    const last = lastPointerRef.current;
    setPan((p) => ({
      x: p.x + (e.clientX - last.x),
      y: p.y + (e.clientY - last.y),
    }));
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    lastPointerRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchRef.current = {
        initialDist: Math.max(touchPairDistance(a.clientX, a.clientY, b.clientX, b.clientY), 1),
        baseScale: scaleRef.current,
      };
      lastTouchRef.current = null;
      lastPointerRef.current = null;
    } else if (e.touches.length === 1 && scaleRef.current > LB_ZOOM_MIN) {
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      pinchRef.current = null;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = touchPairDistance(a.clientX, a.clientY, b.clientX, b.clientY);
      const { initialDist, baseScale } = pinchRef.current;
      if (initialDist > 0) {
        setScale(Math.min(LB_ZOOM_MAX, Math.max(LB_ZOOM_MIN, baseScale * (dist / initialDist))));
      }
      return;
    }
    if (e.touches.length === 1 && lastTouchRef.current && scaleRef.current > LB_ZOOM_MIN) {
      const t = e.touches[0];
      const last = lastTouchRef.current;
      setPan((p) => ({
        x: p.x + (t.clientX - last.x),
        y: p.y + (t.clientY - last.y),
      }));
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      pinchRef.current = null;
      lastTouchRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      pinchRef.current = null;
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
    }
  }, []);

  const atRest = scale <= LB_ZOOM_MIN && Math.abs(pan.x) < 0.5 && Math.abs(pan.y) < 0.5;

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
        aria-label="Close media lightbox"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged media"
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-[min(100vw,1200px)] flex-col overflow-hidden rounded-t-2xl border border-border bg-surface-elevated text-text shadow-[0_8px_40px_rgba(60,45,25,0.1)] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-2 pt-2 sm:px-4 sm:pb-3">
          <p className="min-w-0 truncate text-sm text-muted">{fileTitle}</p>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text hover:bg-surface-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} className="shrink-0" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-3 sm:px-4 sm:pb-4">
          <div
            ref={viewportRef}
            className={`relative flex h-[min(66dvh,640px)] min-h-[18rem] w-full overflow-hidden rounded-xl bg-surface-inset/50 select-none ${scale > LB_ZOOM_MIN ? "cursor-grab touch-none active:cursor-grabbing" : "touch-pan-y"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex h-full w-full items-center justify-center will-change-transform"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={fileTitle} className="max-h-full max-w-full object-contain" draggable={false} />
            </div>
          </div>
          <div
            className="mt-2.5 rounded-lg border border-border/50 bg-surface/60 px-3 py-2.5 sm:mt-3 sm:px-4 sm:py-3"
            role="note"
          >
            <p className="text-center font-body text-[0.8125rem] leading-relaxed text-muted sm:text-left sm:text-sm">
              <span className="sm:hidden">
                Use two fingers to pinch in or out to zoom the photo. When you are zoomed in, drag with one finger to
                move around. The zoom buttons underneath work too.
              </span>
              <span className="hidden sm:inline">
                Point at the photo and scroll the mouse wheel to zoom in or out. When you are zoomed in, click and drag
                on the photo to look around. You can also use the buttons below, the plus and minus keys on your
                keyboard, or press 0 to return to the full view.
              </span>
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-border/40 pt-3 sm:justify-start">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
              onClick={zoomOut}
              disabled={scale <= LB_ZOOM_MIN}
              aria-label="Zoom out"
            >
              <ZoomOut size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
              onClick={zoomIn}
              disabled={scale >= LB_ZOOM_MAX}
              aria-label="Zoom in"
            >
              <ZoomIn size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
              onClick={resetView}
              disabled={atRest}
              aria-label="Reset zoom and pan"
            >
              <RotateCcw size={16} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inner() {
  const params = useParams();
  const sp = useSearchParams();
  const mediaId = typeof params.id === "string" ? params.id.trim() : "";
  const source = useMemo(() => parseSourceFromSearchParams(sp), [sp]);
  const isMainPhotos = (sp.get("kind") ?? "").trim().toLowerCase() === "mainphotos";

  const [data, setData] = useState<MediaViewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!mediaId) {
      setLoading(false);
      setErr("Missing media id.");
      setData(null);
      return;
    }
    if (!source && !isMainPhotos) {
      setLoading(false);
      setErr("Missing or invalid source for shared media link.");
      setData(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const qs = sp.toString();
        const res = await fetch(`/api/media-view/${encodeURIComponent(mediaId)}?${qs}`);
        const body = await readJsonResponse<MediaViewPayload & { error?: string; detail?: string }>(res);
        if (!res.ok) {
          const hint = body.detail ? ` ${body.detail}` : "";
          throw new Error((body.error ?? "Could not load media") + hint);
        }
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not load media");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mediaId, source, isMainPhotos, sp]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  if (!mediaId) return <p className="px-4 py-8 text-sm text-destructive">Invalid media id.</p>;
  if (!source && !isMainPhotos) return <p className="px-4 py-8 text-sm text-muted-foreground">Open a shared media link from an album lightbox to view this page.</p>;
  if (loading) return <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>;
  if (err || !data) return <p className="px-4 py-8 text-sm text-destructive">{err ?? "Not found."}</p>;

  const sourceMeta = data.source;
  const media = data.media;
  const sourcePath = source ? sourceToAlbumPath(source) : "/archive/photos";
  const fileTitle = (media.title ?? "").trim() || inferFilename(media.fileRef);
  const src = media.fileRef ? resolveGedcomMediaFileRef(media.fileRef) : null;
  const coverSrc = sourceMeta.coverMedia?.fileRef ? resolveGedcomMediaFileRef(sourceMeta.coverMedia.fileRef) : null;
  const description = (media.description ?? "").trim();
  const sourceDescription = (sourceMeta.description ?? "").trim();
  const isCurated = sourceMeta.kind === "curated";

  const shareCurrent = async () => {
    if (typeof window === "undefined") return;
    const path = source
      ? buildPublicMediaPath(source, media.id)
      : `/media/${encodeURIComponent(media.id)}?kind=mainPhotos`;
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: fileTitle, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-full bg-bg font-body text-text">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.045] mix-blend-multiply dark:opacity-[0.03] dark:mix-blend-soft-light" aria-hidden style={{ backgroundImage: "url(/images/agedpaperbg.png)", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="relative z-10 min-h-screen w-full max-w-full">
        <section className="relative isolate min-h-[min(46vw,220px)] w-full overflow-hidden bg-bg md:min-h-[230px]">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-center" aria-hidden />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface to-bg" aria-hidden />
          )}
          <div className="absolute inset-0 bg-bg/42 backdrop-blur-md md:backdrop-blur-sm" aria-hidden />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
            aria-hidden
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklab, var(--bg) 98%, transparent) 0%, color-mix(in oklab, var(--bg) 84%, transparent) 40%, color-mix(in oklab, var(--bg) 56%, transparent) 68%, transparent 100%)",
            }}
          />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-2 pt-5 md:gap-5 md:px-8 md:pb-3 md:pt-8">
            <Link href={sourcePath} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border/70 bg-surface-elevated/80 px-2.5 py-2 text-sm font-semibold text-heading shadow-sm backdrop-blur-sm hover:bg-surface-elevated">
              <ArrowLeft size={18} className="shrink-0 text-muted" aria-hidden />
              Back to album
            </Link>

            <div className="grid items-end gap-6 pt-1 lg:pt-0">
              <div className="min-w-0 space-y-4 pb-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  {isCurated ? (
                    <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#9C5A4A]">
                      <Globe size={14} className="shrink-0 opacity-90" aria-hidden />
                      Public album
                    </span>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe size={14} className="shrink-0" aria-hidden />
                        From your tree
                      </span>
                      <span aria-hidden>•</span>
                      <span>Media Detail</span>
                    </div>
                  )}
                </div>
                <h1 className="font-heading text-balance text-[1.95rem] font-semibold leading-[1.05] tracking-tight text-heading sm:text-[2.1rem] md:text-[2.35rem] lg:text-[2.65rem]">
                  {renderMediaStyledTitle(sourceMeta.title)}
                </h1>
                {sourceDescription ? <p className="max-w-2xl text-base leading-relaxed text-text md:text-lg">{sourceDescription}</p> : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-10 md:px-8 md:pt-3 md:pb-12">
          <section className="rounded-2xl border border-border bg-surface-elevated p-3 sm:p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 font-heading text-xl font-semibold tracking-tight text-heading md:text-2xl">
              <Leaf size={20} className="shrink-0 text-primary/75" aria-hidden />
              {fileTitle}
            </h2>
            <div className="flex min-h-[18rem] items-center justify-center overflow-hidden rounded-xl bg-surface-inset/40 p-2 sm:min-h-[24rem]">
              {src ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="group block cursor-zoom-in rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  aria-label="Open full-size viewer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={fileTitle}
                    className="max-h-[70vh] max-w-full object-contain transition-opacity group-hover:opacity-95"
                  />
                </button>
              ) : (
                <p className="text-sm text-muted">No preview available.</p>
              )}
            </div>
            {src ? (
              <p className="mt-2 px-1 text-center font-body text-xs leading-snug text-muted sm:text-sm">
                Click or tap the preview for a full-size view.
              </p>
            ) : null}

            <div className="mt-3 flex w-full items-center justify-end gap-2">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2" onClick={() => void shareCurrent()}>
                <Share2 size={14} className="shrink-0" aria-hidden />
                Share image
              </button>
              <Link href={sourcePath} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
                <ExternalLink size={14} className="shrink-0" aria-hidden />
                View album
              </Link>
            </div>

            {media.linkedIndividuals.length ? (
              <div className="mt-3 border-t border-border/40 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b2e2e]">
                  People Featured ({media.linkedIndividuals.length})
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text">
                  {media.linkedIndividuals.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/media/album-view?kind=generated&type=individual&id=${encodeURIComponent(p.id)}`} className="font-medium text-link hover:text-link-hover hover:underline">
                        {p.displayName}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
            ) : null}
          </section>

          {description ? (
            <section className="mt-4 rounded-xl border border-border bg-surface-elevated p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Description</p>
              <p className="whitespace-pre-wrap text-sm text-text">{description}</p>
            </section>
          ) : null}

          {(
            media.places.length > 0 ||
            media.dates.length > 0 ||
            media.events.length > 0 ||
            media.families.length > 0 ||
            media.tags.length > 0 ||
            media.albums.length > 0
          ) ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {media.places.length > 0 ? (
                <section className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    <MapPin size={14} className="shrink-0" aria-hidden />
                    Places linked ({media.places.length})
                  </p>
                  <ul className="space-y-1 text-sm">{media.places.map((p) => <li key={p.id}><Link href={`/media/album-view?kind=generated&type=place&id=${encodeURIComponent(p.id)}`} className="text-link hover:text-link-hover hover:underline">{formatPlace(p)}</Link></li>)}</ul>
                </section>
              ) : null}
              {media.dates.length > 0 ? (
                <section className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    <Calendar size={14} className="shrink-0" aria-hidden />
                    Dates linked ({media.dates.length})
                  </p>
                  <ul className="space-y-1 text-sm">{media.dates.map((d) => <li key={d.id}><Link href={`/media/album-view?kind=generated&type=date&id=${encodeURIComponent(d.id)}`} className="text-link hover:text-link-hover hover:underline">{formatGedcomDateDisplayLabel(d)}</Link></li>)}</ul>
                </section>
              ) : null}
              {media.events.length > 0 ? (
                <section className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"><Calendar size={14} className="shrink-0" aria-hidden />Events</p>
                  <ul className="space-y-1 text-sm">{media.events.map((e) => <li key={e.id}><Link href={`/media/album-view?kind=generated&type=event&id=${encodeURIComponent(e.id)}`} className="text-link hover:text-link-hover hover:underline">{formatEventLabel(e)}</Link></li>)}</ul>
                </section>
              ) : null}
              {media.families.length > 0 ? (
                <section className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"><Users size={14} className="shrink-0" aria-hidden />Families</p>
                  <ul className="space-y-1 text-sm">{media.families.map((f) => <li key={f.id}><Link href={`/media/album-view?kind=generated&type=family&id=${encodeURIComponent(f.id)}`} className="text-link hover:text-link-hover hover:underline">{formatFamilyLabel(f)}</Link></li>)}</ul>
                </section>
              ) : null}
              {media.tags.length > 0 ? (
                <section className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"><Tag size={14} className="shrink-0" aria-hidden />Tags</p>
                  <ul className="space-y-1 text-sm">{media.tags.map((t) => <li key={t.id}><Link href={`/media/album-view?kind=generated&type=tag&id=${encodeURIComponent(t.id)}`} className="text-link hover:text-link-hover hover:underline">{t.name}</Link></li>)}</ul>
                </section>
              ) : null}
              {media.albums.length > 0 ? (
                <section className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"><Users size={14} className="shrink-0" aria-hidden />Albums</p>
                  <ul className="space-y-1 text-sm">{media.albums.map((a) => <li key={a.id}><Link href={`/media/album/${encodeURIComponent(a.id)}`} className="text-link hover:text-link-hover hover:underline">{a.name}</Link></li>)}</ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {lightboxOpen && src ? (
        <MediaDetailLightbox src={src} fileTitle={fileTitle} onClose={() => setLightboxOpen(false)} />
      ) : null}
    </div>
  );
}

export default function PublicMediaPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>}>
      <Inner />
    </Suspense>
  );
}
