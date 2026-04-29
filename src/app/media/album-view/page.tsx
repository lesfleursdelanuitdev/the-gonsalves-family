"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AlbumViewModel } from "@ligneous/album-view";
import { PublicAlbumLayout } from "@/components/album/PublicAlbumLayout";
import { readJsonResponse } from "@/lib/read-json-response";

function Inner() {
  const sp = useSearchParams();
  const type = (sp.get("type") ?? "").trim().toLowerCase();
  const id = (sp.get("id") ?? "").trim();

  const [model, setModel] = useState<AlbumViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) {
      setLoading(false);
      setErr(null);
      setModel(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/album-view?kind=generated&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`);
        const body = await readJsonResponse<{ model?: AlbumViewModel; error?: string; detail?: string }>(res);
        if (!res.ok) {
          const hint = body.detail ? ` ${body.detail}` : "";
          throw new Error((body.error ?? "Could not load album") + hint);
        }
        if (!cancelled) setModel(body.model ?? null);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not load album");
          setModel(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  if (!type || !id) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground">
        Add <span className="font-mono">?type=individual&amp;id=…</span> (family, event, place, note, date, tag).
      </p>
    );
  }
  if (loading) return <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>;
  if (err || !model) return <p className="px-4 py-8 text-sm text-destructive">{err ?? "Not found."}</p>;

  return <PublicAlbumLayout model={model} />;
}

export default function PublicMediaAlbumViewPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>}>
      <Inner />
    </Suspense>
  );
}
