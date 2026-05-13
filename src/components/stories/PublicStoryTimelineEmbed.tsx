"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timeline, sortEventsChronologically, timelineUrlDefaults } from "@ligneous/timeline-view";
import type { IndividualDetailEvent, TimelineChromeOnly, TimelineSubject } from "@ligneous/timeline-view";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";

type Block = ReaderStoryBlock & Record<string, unknown>;

function publicResolveImageSrc(fileRef: string): string | null {
  const url = resolveGedcomMediaFileRef(fileRef)?.trim();
  return url ? url : null;
}

export function PublicStoryTimelineEmbed({ block }: { block: ReaderStoryBlock }) {
  const b = block as Block;
  const scope = (b.scope as string | null | undefined) ?? null;
  const entityId = (b.entityId as string | null | undefined) ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["story-public-timeline-events", entityId],
    queryFn: async () => {
      const res = await fetch(`/api/tree/individuals/${encodeURIComponent(entityId!)}/detail/events`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = typeof errBody === "object" && errBody && "error" in errBody ? String((errBody as { error?: string }).error) : res.statusText;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { events: IndividualDetailEvent[]; timelineSubject?: TimelineSubject };
      return body;
    },
    enabled: scope === "individual" && !!entityId,
  });

  const events = useMemo(() => {
    const raw = data?.events ?? [];
    return sortEventsChronologically(raw);
  }, [data?.events]);

  const timelineSubject: TimelineSubject = data?.timelineSubject ?? { kind: "none" };
  const hasAnyPreviewMedia = events.some((e) => Boolean(e.previewMediaFileRef?.trim()));

  const viewMode = (b.viewMode as TimelineChromeOnly["viewMode"]) ?? "single";
  const orient = (b.orient as TimelineChromeOnly["orient"]) ?? "vertical";
  const paginationActive = Boolean(b.pag);
  const heightPx = typeof b.heightPx === "number" ? b.heightPx : 520;

  const isVerticalSingle = viewMode === "single" && orient === "vertical";
  const embedWidthPct = isVerticalSingle ? (typeof b.embedWidthPct === "number" ? b.embedWidthPct : 100) : 100;
  const embedAlign = (b.embedAlign as "left" | "center" | "right" | undefined) ?? "center";

  const [currentPage, setCurrentPage] = useState(0);
  const [activeView, setActiveView] = useState<"vertical" | "horizontal">(
    (b.activeView as "vertical" | "horizontal" | undefined) ?? "vertical",
  );
  const [cardWidthPx, setCardWidthPx] = useState<200 | 260 | 320>(
    (b.cardWidthPx as 200 | 260 | 320 | undefined) ?? 260,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [paginationActive, b.perPage]);

  useEffect(() => {
    setCardWidthPx((b.cardWidthPx as 200 | 260 | 320 | undefined) ?? 260);
  }, [b.cardWidthPx]);

  const showPlaybackOnEmbed = Boolean(b.timelineShowPlaybackControls) && !paginationActive;
  const playbackChromePad = showPlaybackOnEmbed ? 72 : 0;
  const timelineViewportHeight = Math.max(240, heightPx - playbackChromePad);

  const d = timelineUrlDefaults;
  const previewWU = (b.timelinePreviewWidthUnit as TimelineChromeOnly["previewWidthUnit"] | undefined) ?? d.previewWidthUnit;

  const chrome: TimelineChromeOnly = useMemo(
    () => ({
      ...d,
      viewMode,
      orient,
      activeView,
      anim: (b.anim as TimelineChromeOnly["anim"]) ?? d.anim,
      vStyle: (b.vStyle as TimelineChromeOnly["vStyle"]) ?? d.vStyle,
      hStyle: (b.hStyle as TimelineChromeOnly["hStyle"]) ?? d.hStyle,
      heightPx: timelineViewportHeight,
      previewWidthUnit: previewWU,
      widthPx: typeof b.timelineWidthPx === "number" ? b.timelineWidthPx : d.widthPx,
      widthPct: typeof b.timelineWidthPct === "number" ? b.timelineWidthPct : d.widthPct,
      pag: paginationActive,
      perPage: (b.perPage as TimelineChromeOnly["perPage"]) ?? d.perPage,
      page: currentPage,
      autoplayPxPerSec: typeof b.autoplayPxPerSec === "number" ? b.autoplayPxPerSec : d.autoplayPxPerSec,
      autoplayLoop: typeof b.autoplayLoop === "boolean" ? b.autoplayLoop : d.autoplayLoop,
      showImages: Boolean(b.showImages),
      animRevealMinRatio: typeof b.animRevealMinRatio === "number" ? b.animRevealMinRatio : d.animRevealMinRatio,
      renderer: (b.renderer as TimelineChromeOnly["renderer"]) ?? d.renderer,
      perCol: (b.perCol as TimelineChromeOnly["perCol"]) ?? d.perCol,
      numColumns: (b.numColumns as TimelineChromeOnly["numColumns"]) ?? d.numColumns,
      columnChunkMode: (b.columnChunkMode as TimelineChromeOnly["columnChunkMode"]) ?? d.columnChunkMode,
      cardWidthPx,
      gapPx: typeof b.gapPx === "number" ? b.gapPx : d.gapPx,
      showArrows: typeof b.showArrows === "boolean" ? b.showArrows : d.showArrows,
    }),
    [
      viewMode,
      orient,
      activeView,
      b.anim,
      b.vStyle,
      b.hStyle,
      timelineViewportHeight,
      previewWU,
      b.timelineWidthPx,
      b.timelineWidthPct,
      paginationActive,
      b.perPage,
      currentPage,
      b.autoplayPxPerSec,
      b.autoplayLoop,
      b.showImages,
      b.animRevealMinRatio,
      b.renderer,
      b.perCol,
      b.numColumns,
      b.columnChunkMode,
      cardWidthPx,
      b.gapPx,
      b.showArrows,
      showPlaybackOnEmbed,
    ],
  );

  const onChromeChange = useCallback((patch: Partial<TimelineChromeOnly>) => {
    if (patch.page !== undefined) setCurrentPage(patch.page);
    if (patch.activeView !== undefined) setActiveView(patch.activeView);
    if (patch.cardWidthPx !== undefined) setCardWidthPx(patch.cardWidthPx);
  }, []);

  const containerStyle: React.CSSProperties = {
    width: `${embedWidthPct}%`,
    marginLeft: embedAlign === "left" ? 0 : "auto",
    marginRight: embedAlign === "right" ? 0 : "auto",
  };

  const label = typeof b.label === "string" ? b.label.trim() : "";
  const titlePlacement = (b.titlePlacement as string | undefined) ?? "above";
  const caption = typeof b.caption === "string" ? b.caption.trim() : "";

  if (scope !== "individual" || !entityId) {
    return (
      <div className="my-6 rounded-xl border border-dashed border-border bg-surface-2/60 px-4 py-8 text-center text-sm text-text/75">
        This timeline is configured for a subject that is not yet supported on the public reader. Individual timelines
        load here automatically; open the editor to preview family or note timelines.
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && titlePlacement !== "below" ? <p className="mb-1 text-sm font-semibold text-text">{label}</p> : null}

      <div style={containerStyle}>
        <div className="relative w-full overflow-hidden rounded-xl border border-border bg-surface-2/40">
          <div className="w-full overflow-auto" style={{ height: heightPx }}>
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-text/60">Loading timeline…</div>
            ) : null}
            {error ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-destructive">
                {error instanceof Error ? error.message : "Could not load timeline."}
              </div>
            ) : null}
            {!isLoading && !error && events.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-text/60">No events for this person.</div>
            ) : null}
            {!isLoading && !error && events.length > 0 ? (
              <Timeline
                events={events}
                chrome={chrome}
                onChromeChange={onChromeChange}
                timelineSubject={timelineSubject}
                hasAnyPreviewMedia={hasAnyPreviewMedia}
                resolveImageSrc={publicResolveImageSrc}
                showBuiltInPagination={paginationActive}
                showBuiltInOrientToggle={orient === "toggle"}
                showBuiltInSettings={false}
                showAutoplayTransport={showPlaybackOnEmbed}
                disableVpFrame
              />
            ) : null}
          </div>
        </div>
      </div>

      {caption ? <p className="mt-1 text-xs text-text/65">{caption}</p> : null}
      {label && titlePlacement === "below" ? <p className="mt-1 text-sm font-semibold text-text">{label}</p> : null}
    </div>
  );
}
