"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StoryBlockRenderer } from "@/components/stories/StoryBlockRenderer";
import { StoryCover } from "@/components/stories/StoryCover";
import { StoryViewerNav } from "@/components/stories/StoryViewerNav";
import { sectionToBlocks, type TimelineBlock } from "@/lib/stories/story-reader-utils";
import type { StoryFieldKey } from "@/lib/stories/tiptap/field-keys";

type SectionRow = { id: string; title: string; contentJson: unknown };

export function StoryViewerClient({
  slug,
  title,
  excerpt,
  coverSrc,
  profileSrc,
  authorLine,
  authorHref,
  sections,
  timelineBlocks,
  storyFieldHtml,
  canonicalUrl,
}: {
  slug: string;
  title: string;
  excerpt: string | null;
  coverSrc: string | null;
  profileSrc: string | null;
  authorLine: string | null;
  authorHref: string | null;
  sections: SectionRow[];
  timelineBlocks: TimelineBlock[];
  storyFieldHtml?: (field: StoryFieldKey) => string;
  canonicalUrl: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const mode = sp.get("mode") === "timeline" ? "timeline" : "pages";
  const sectionId = sp.get("section") ?? sections[0]?.id ?? "";
  const blockId = sp.get("block");

  const sectionIndex = useMemo(() => {
    const i = sections.findIndex((s) => s.id === sectionId);
    return i >= 0 ? i : 0;
  }, [sectionId, sections]);

  const current = sections[sectionIndex] ?? sections[0];
  const blocks = current ? sectionToBlocks(current) : [];

  const setQuery = useCallback(
    (next: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      router.replace(`/stories/${encodeURIComponent(slug)}/viewer?${p.toString()}`, { scroll: false });
    },
    [router, slug, sp],
  );

  const onPrev = useCallback(() => {
    if (mode === "timeline" && timelineBlocks.length > 0) {
      const idx = timelineBlocks.findIndex((b) => b.blockId === (blockId ?? ""));
      const nextIdx = idx <= 0 ? timelineBlocks.length - 1 : idx - 1;
      const tb = timelineBlocks[nextIdx]!;
      setQuery({ mode: "timeline", section: tb.sectionId, block: tb.blockId });
      return;
    }
    const ni = (sectionIndex - 1 + sections.length) % sections.length;
    const s = sections[ni]!;
    setQuery({ mode: "pages", section: s.id, block: undefined });
  }, [blockId, mode, sectionIndex, sections, setQuery, timelineBlocks]);

  const onNext = useCallback(() => {
    if (mode === "timeline" && timelineBlocks.length > 0) {
      const idx = timelineBlocks.findIndex((b) => b.blockId === (blockId ?? ""));
      const nextIdx = idx < 0 ? 0 : (idx + 1) % timelineBlocks.length;
      const tb = timelineBlocks[nextIdx]!;
      setQuery({ mode: "timeline", section: tb.sectionId, block: tb.blockId });
      return;
    }
    const ni = (sectionIndex + 1) % sections.length;
    const s = sections[ni]!;
    setQuery({ mode: "pages", section: s.id, block: undefined });
  }, [blockId, mode, sectionIndex, sections, setQuery, timelineBlocks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev]);

  const activeTimelineBlock = blockId ?? timelineBlocks[0]?.blockId ?? null;

  return (
    <div className="min-h-screen bg-bg pb-36 text-text">
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href={`/stories/${slug}?section=${current?.id ?? ""}`} className="text-sm font-medium text-link hover:text-link-hover">
          View as article
        </Link>
      </div>
      <StoryCover
        coverSrc={coverSrc}
        profileSrc={profileSrc}
        title={title}
        excerpt={excerpt}
        authorLine={authorLine}
        authorHref={authorHref}
        canonicalUrl={canonicalUrl}
      />
      <article className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="font-display text-2xl font-semibold text-text">{current?.title}</h2>
        <div className="mt-6 space-y-6">
          {blocks.map((b) => (
            <StoryBlockRenderer
              key={b.id}
              block={b}
              storyFieldHtml={storyFieldHtml}
              highlight={mode === "timeline" && b.id === activeTimelineBlock}
            />
          ))}
        </div>
      </article>
      <StoryViewerNav
        mode={mode}
        onModeChange={(m) => {
          if (m === "timeline" && timelineBlocks.length > 0) {
            const cur = timelineBlocks.find((t) => t.sectionId === sectionId) ?? timelineBlocks[0]!;
            setQuery({ mode: "timeline", section: cur.sectionId, block: cur.blockId });
          } else {
            const anchor = timelineBlocks.find((t) => t.blockId === blockId)?.sectionId ?? sectionId;
            setQuery({ mode: "pages", section: anchor, block: undefined });
          }
        }}
        timelineAvailable={timelineBlocks.length > 0}
        timelineBlocks={timelineBlocks}
        activeBlockId={mode === "timeline" ? activeTimelineBlock : null}
        onPickTimelineBlock={(id) => {
          const tb = timelineBlocks.find((t) => t.blockId === id);
          if (!tb) return;
          setQuery({ mode: "timeline", section: tb.sectionId, block: tb.blockId });
        }}
        sectionIndex={sectionIndex}
        sectionCount={sections.length}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
}
