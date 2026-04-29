"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { AlbumViewModel } from "@ligneous/album-view";
import { PublicAlbumLayout } from "@/components/album/PublicAlbumLayout";
import { readJsonResponse } from "@/lib/read-json-response";

export default function PublicCuratedAlbumPage() {
  const params = useParams();
  const albumId = typeof params.id === "string" ? params.id : "";

  const [model, setModel] = useState<AlbumViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId) {
      setLoading(false);
      setErr("Missing album id.");
      setModel(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/album-view?kind=curated&albumId=${encodeURIComponent(albumId)}`);
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
  }, [albumId]);

  if (!albumId) return <p className="px-4 py-8 text-sm text-destructive">Invalid album.</p>;
  if (loading) return <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>;
  if (err || !model) return <p className="px-4 py-8 text-sm text-destructive">{err ?? "Album not found."}</p>;

  return <PublicAlbumLayout model={model} />;
}
