"use client";

import { List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { TocEntry } from "@/lib/stories/story-reader-utils";
import { cn } from "@/lib/utils";

export function StoryTocNav({
  slug,
  entries,
  mobileFloating,
}: {
  slug: string;
  entries: TocEntry[];
  mobileFloating?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const active = sp.get("section");
  const [open, setOpen] = useState(false);

  const go = useCallback(
    (sectionId: string) => {
      const p = new URLSearchParams(sp.toString());
      p.set("section", sectionId);
      router.replace(`/stories/${encodeURIComponent(slug)}?${p.toString()}`, { scroll: false });
      requestAnimationFrame(() => {
        document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setOpen(false);
    },
    [router, slug, sp],
  );

  useEffect(() => {
    const id = sp.get("section");
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [sp]);

  const nav = (
    <nav aria-label="Table of contents" className="space-y-1 text-sm">
      {entries.map((e) => (
        <button
          key={e.sectionId}
          type="button"
          style={{ paddingLeft: e.depth * 12 }}
          className={cn(
            "flex w-full rounded-md px-2 py-1.5 text-left transition-colors",
            active === e.sectionId ? "bg-primary/15 font-semibold text-primary" : "text-text/75 hover:bg-surface-2",
          )}
          onClick={() => go(e.sectionId)}
        >
          {e.title}
        </button>
      ))}
    </nav>
  );

  if (mobileFloating) {
    if (entries.length === 0) return null;
    return (
      <>
        <button
          type="button"
          className="fixed bottom-6 right-4 z-30 flex size-12 items-center justify-center rounded-full border border-border bg-bg shadow-lg lg:hidden"
          aria-label="Open table of contents"
          onClick={() => setOpen(true)}
        >
          <List className="size-5" />
        </button>
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal>
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-bg p-4 shadow-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text/45">On this page</p>
              {nav}
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return nav;
}
