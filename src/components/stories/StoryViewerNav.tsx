"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimelineBar } from "@/components/stories/TimelineBar";
import type { TimelineBlock } from "@/lib/stories/story-reader-utils";
import { cn } from "@/lib/utils";

export function StoryViewerNav({
  mode,
  onModeChange,
  timelineAvailable,
  timelineBlocks,
  activeBlockId,
  onPickTimelineBlock,
  sectionIndex,
  sectionCount,
  onPrev,
  onNext,
}: {
  mode: "pages" | "timeline";
  onModeChange: (m: "pages" | "timeline") => void;
  timelineAvailable: boolean;
  timelineBlocks: TimelineBlock[];
  activeBlockId: string | null;
  onPickTimelineBlock: (id: string) => void;
  sectionIndex: number;
  sectionCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {timelineAvailable ? (
            <div className="flex rounded-full border border-border bg-surface-2 p-0.5 text-xs font-semibold">
              <button
                type="button"
                className={cn("rounded-full px-3 py-1", mode === "pages" ? "bg-bg shadow-sm" : "text-text/60")}
                onClick={() => onModeChange("pages")}
              >
                Pages
              </button>
              <button
                type="button"
                className={cn("rounded-full px-3 py-1", mode === "timeline" ? "bg-bg shadow-sm" : "text-text/60")}
                onClick={() => onModeChange("timeline")}
              >
                Timeline
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wide text-text/50">Story viewer</span>
          )}
          <span className="text-xs text-text/60">
            Section {sectionIndex + 1} of {sectionCount}
          </span>
        </div>
        {mode === "timeline" && timelineBlocks.length > 0 ? (
          <TimelineBar blocks={timelineBlocks} activeBlockId={activeBlockId} onPick={onPickTimelineBlock} />
        ) : null}
        {mode === "pages" || timelineBlocks.length === 0 ? (
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
              onClick={onPrev}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
              onClick={onNext}
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
