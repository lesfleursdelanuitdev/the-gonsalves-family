"use client";

import type { TimelineBlock } from "@/lib/stories/story-reader-utils";
import { cn } from "@/lib/utils";

export function TimelineBar({
  blocks,
  activeBlockId,
  onPick,
}: {
  blocks: TimelineBlock[];
  activeBlockId: string | null;
  onPick: (blockId: string) => void;
}) {
  if (blocks.length === 0) return null;
  const first = blocks[0]!.date;
  const last = blocks[blocks.length - 1]!.date;
  const span = Math.max(1, new Date(last).getTime() - new Date(first).getTime());

  return (
    <div className="relative h-12 w-full rounded-full border border-border bg-surface-2/80 px-2">
      <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded bg-border" />
      {blocks.map((b) => {
        const t = new Date(b.date).getTime();
        const start = new Date(first).getTime();
        const pct = ((t - start) / span) * 100;
        const active = activeBlockId === b.blockId;
        const leftPct = 3 + pct * 0.94;
        return (
          <button
            key={b.blockId}
            type="button"
            title={b.dateDisplay}
            className={cn(
              "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg shadow transition-transform hover:scale-125",
              active ? "bg-primary ring-2 ring-primary/40" : "bg-text/40 hover:bg-text/70",
            )}
            style={{ left: `${leftPct}%` }}
            onClick={() => onPick(b.blockId)}
          />
        );
      })}
    </div>
  );
}
