"use client";

import { useCallback, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Timeline,
  sortEventsChronologically,
  timelineUrlDefaults,
} from "@ligneous/timeline-view";
import type {
  IndividualDetailEvent,
  TimelineChromeOnly,
  TimelineSubject,
} from "@ligneous/timeline-view";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { PersonPicker } from "@/components/search/PersonPicker";
import type { PersonOption } from "@/components/search/PersonPicker";

function resolveImageSrc(fileRef: string): string | null {
  const url = resolveGedcomMediaFileRef(fileRef)?.trim();
  return url ? url : null;
}

const d = timelineUrlDefaults;

export function TimelinesPage() {
  const [person, setPerson] = useState<PersonOption | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["timelines-page-events", person?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/tree/individuals/${encodeURIComponent(person!.id)}/detail/events`,
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof errBody === "object" && errBody && "error" in errBody
            ? String((errBody as { error?: string }).error)
            : res.statusText;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      return res.json() as Promise<{
        events: IndividualDetailEvent[];
        timelineSubject?: TimelineSubject;
      }>;
    },
    enabled: !!person?.id,
  });

  const events = sortEventsChronologically(data?.events ?? []);
  const timelineSubject: TimelineSubject = data?.timelineSubject ?? { kind: "none" };
  const hasAnyPreviewMedia = events.some((e) => Boolean(e.previewMediaFileRef?.trim()));

  const [showSettings, setShowSettings] = useState(false);
  const [chrome, setChrome] = useState<TimelineChromeOnly>(() => ({
    ...d,
    viewMode: "single",
    orient: "vertical",
    activeView: "vertical",
    pag: false,
    page: 0,
    showImages: true,
    cardWidthPx: 260,
    previewWidthUnit: "pct",
    widthPct: 100,
  }));

  const onChromeChange = useCallback((patch: Partial<TimelineChromeOnly>) => {
    setChrome((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="space-y-6 py-6">
      {/* Person picker */}
      <div className="max-w-md">
        <label className="mb-2 block font-body text-sm font-medium text-muted">
          Select a family member
        </label>
        <PersonPicker
          value={person}
          onChange={setPerson}
          placeholder="Search by name…"
        />
      </div>

      {/* Empty state */}
      {!person && (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-2/60 px-4 py-12 text-center">
          <p className="font-body text-sm text-muted">
            Choose a family member above to view their timeline.
          </p>
        </div>
      )}

      {/* Timeline */}
      {person && (
        <div className="tl-gonsalves overflow-hidden rounded-xl border border-border-subtle">
          {/* Top bar */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-2)" }}
          >
            <span className="font-body text-sm font-medium text-[color:var(--text)]">
              {person.displayName}
            </span>
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-body text-xs transition"
              style={{
                color: showSettings ? "var(--link)" : "var(--text-muted)",
                backgroundColor: showSettings ? "var(--link-soft-bg)" : "transparent",
              }}
              aria-pressed={showSettings}
            >
              <SlidersHorizontal size={13} aria-hidden />
              Settings
            </button>
          </div>

          {isLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="font-body text-sm text-muted">Loading timeline…</p>
            </div>
          )}

          {error && (
            <div className="flex min-h-[300px] items-center justify-center px-4 text-center">
              <p className="font-body text-sm text-danger">
                {error instanceof Error ? error.message : "Could not load timeline."}
              </p>
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="font-body text-sm text-muted">
                No events found for this person.
              </p>
            </div>
          )}

          {!isLoading && !error && events.length > 0 && (
            <Timeline
              events={events}
              chrome={chrome}
              onChromeChange={onChromeChange}
              timelineSubject={timelineSubject}
              hasAnyPreviewMedia={hasAnyPreviewMedia}
              resolveImageSrc={resolveImageSrc}
              showBuiltInPagination={false}
              showBuiltInOrientToggle={false}
              showBuiltInSettings={showSettings}
              disableVpFrame
            />
          )}
        </div>
      )}
    </div>
  );
}
