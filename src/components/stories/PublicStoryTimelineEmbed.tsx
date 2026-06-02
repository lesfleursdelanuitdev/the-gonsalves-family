"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sortEventsChronologically } from "@ligneous/timeline-view";
import type { IndividualDetailEvent, TimelineSubject } from "@ligneous/timeline-view";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";
import { RuledSpineTimeline } from "./RuledSpineTimeline";

type Block = ReaderStoryBlock & Record<string, unknown>;

function publicResolveImageSrc(fileRef: string): string | null {
  const url = resolveGedcomMediaFileRef(fileRef)?.trim();
  return url ? url : null;
}

type TimelineRule = { kind: string; [key: string]: unknown };
type EmbedData = { rules?: TimelineRule[]; sourceType?: string; timelineMode?: string; filters?: { includeUndated?: boolean } };

export function PublicStoryTimelineEmbed({ block }: { block: ReaderStoryBlock }) {
  const b = block as Block;

  // New EventsListPicker format: rules stored in b.data
  const embedData = (b.data as EmbedData | null | undefined) ?? null;
  const isRuleBased =
    embedData != null &&
    Array.isArray(embedData.rules) &&
    embedData.rules.length > 0 &&
    (embedData.timelineMode === "custom" || embedData.sourceType === "custom");

  // Legacy format: scope + entityId at block top level
  const scope = (b.scope as string | null | undefined) ?? null;
  const entityId = (b.entityId as string | null | undefined) ?? null;

  // Rule-based query (new EventsListPicker format)
  const { data: ruleData, isLoading: ruleLoading, error: ruleError } = useQuery({
    queryKey: ["story-public-timeline-rules", JSON.stringify(embedData?.rules), embedData?.filters],
    queryFn: async () => {
      const res = await fetch("/api/story-timeline-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: embedData!.rules, filters: embedData!.filters }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = typeof errBody === "object" && errBody && "error" in errBody ? String((errBody as { error?: string }).error) : res.statusText;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      return (await res.json()) as { events: IndividualDetailEvent[] };
    },
    enabled: isRuleBased,
  });

  // Legacy individual-scope query
  const { data: legacyData, isLoading: legacyLoading, error: legacyError } = useQuery({
    queryKey: ["story-public-timeline-events", entityId],
    queryFn: async () => {
      const res = await fetch(`/api/tree/individuals/${encodeURIComponent(entityId!)}/detail/events`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = typeof errBody === "object" && errBody && "error" in errBody ? String((errBody as { error?: string }).error) : res.statusText;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      return (await res.json()) as { events: IndividualDetailEvent[]; timelineSubject?: TimelineSubject };
    },
    enabled: !isRuleBased && scope === "individual" && !!entityId,
  });

  const data = isRuleBased ? ruleData : legacyData;
  const isLoading = isRuleBased ? ruleLoading : legacyLoading;
  const error = isRuleBased ? ruleError : legacyError;

  const events = useMemo(() => {
    const raw = data?.events ?? [];
    return sortEventsChronologically(raw);
  }, [data?.events]);

  const timelineSubject: TimelineSubject = (data as { timelineSubject?: TimelineSubject } | undefined)?.timelineSubject ?? { kind: "none" };

  // Pagination state (driven by the block; reset when pag/perPage change).
  const paginationActive = Boolean(b.pag);
  const perPage = typeof b.perPage === "number" ? b.perPage : undefined;
  const pageResetKey = `${paginationActive}:${String(b.perPage ?? "")}`;
  const [pageState, setPageState] = useState<{ resetKey: string; page: number }>(() => ({ resetKey: pageResetKey, page: 0 }));
  const currentPage = pageState.resetKey === pageResetKey ? pageState.page : 0;
  const setCurrentPage = useCallback(
    (next: number) => setPageState({ resetKey: pageResetKey, page: next }),
    [pageResetKey],
  );

  // Layout: width + alignment of the embed within the prose column.
  const embedWidthPct = typeof b.embedWidthPct === "number" ? b.embedWidthPct : 100;
  const embedAlign = (b.embedAlign as "left" | "center" | "right" | undefined) ?? "center";
  const containerStyle: React.CSSProperties = {
    width: `${embedWidthPct}%`,
    marginLeft: embedAlign === "left" ? 0 : "auto",
    marginRight: embedAlign === "right" ? 0 : "auto",
  };

  const label = typeof b.label === "string" && b.hideTitle !== true ? b.label.trim() : "";
  const caption = typeof b.caption === "string" && b.hideCaption !== true ? b.caption.trim() : "";

  const isUnsupported = !isRuleBased && (scope !== "individual" || !entityId);
  if (isUnsupported) {
    return (
      <div className="my-6 rounded-xl border border-dashed border-border bg-surface-2/60 px-4 py-8 text-center text-sm text-text/75">
        This timeline is configured for a subject that is not yet supported on the public reader. Individual timelines
        load here automatically; open the editor to preview family or note timelines.
      </div>
    );
  }

  return (
    <div className="my-6 w-full">
      <div style={containerStyle}>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-text/60">Loading timeline…</div>
        ) : null}
        {error ? (
          <div className="py-8 px-4 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load timeline."}
          </div>
        ) : null}
        {!isLoading && !error && events.length === 0 ? (
          <div className="py-8 text-center text-sm text-text/60">No events for this person.</div>
        ) : null}
        {!isLoading && !error && events.length > 0 ? (
          <RuledSpineTimeline
            events={events}
            timelineSubject={timelineSubject}
            resolveImageSrc={publicResolveImageSrc}
            title={label || undefined}
            pag={paginationActive}
            perPage={perPage}
            page={currentPage}
            onPageChange={setCurrentPage}
          />
        ) : null}

        {caption ? (
          <div
            className="mt-2 text-xs text-text/65 [&_a]:text-primary [&_a]:underline [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: caption }}
          />
        ) : null}
      </div>
    </div>
  );
}
