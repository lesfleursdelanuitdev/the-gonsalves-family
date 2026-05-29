"use client";

import { useEffect, useState } from "react";
import type { ReaderStoryBlock } from "@/lib/stories/story-reader-utils";

type MediaData = { url: string; form: string | null; mimeType: string | null; title: string | null };

function isImageMedia(media: MediaData): boolean {
  if (media.mimeType) return media.mimeType.startsWith("image/");
  // Fallback for gedcom_media whose form is a raw GEDCOM extension string.
  const f = (media.form ?? "").toLowerCase();
  if (!f) return true;
  return f === "jpg" || f === "jpeg" || f === "png" || f === "gif" || f === "webp" || f === "avif" || f === "bmp" || f === "tiff" || f === "svg";
}

/** Caption is stored as sanitised HTML (e.g. `<p>text</p>`). Render it so tags don't show literally. */
function CaptionHtml({ html }: { html: string }) {
  return (
    <figcaption
      className="mt-2 text-center text-xs text-text/55 [&_a]:text-primary [&_a]:underline [&_p]:m-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function MediaTitle({ label, placement }: { label: string; placement: "above" | "below" }) {
  return (
    <p className={`text-sm font-medium text-text/80 ${placement === "below" ? "mt-2" : "mb-2"}`}>
      {label}
    </p>
  );
}

export function PublicStoryMediaBlock({ block }: { block: ReaderStoryBlock }) {
  const mediaId = typeof block.mediaId === "string" ? block.mediaId.trim() : "";
  const rawLabel = typeof block.label === "string" ? block.label.trim() : "";
  const caption = typeof block.caption === "string" ? block.caption.trim() : "";
  const hideTitle = block.hideTitle === true;
  const hideCaption = block.hideCaption === true;
  const titlePlacement = block.titlePlacement === "below" ? "below" : "above";
  const captionPlacement = block.captionPlacement === "above" ? "above" : "below";

  // Show title only when not hidden AND label has actual content.
  const showTitle = !hideTitle && rawLabel.length > 0;
  // Caption is HTML — only show when not hidden and not empty.
  const captionHtml = !hideCaption && caption ? caption : null;

  const [media, setMedia] = useState<MediaData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mediaId) return;
    setMedia(null);
    setFailed(false);
    fetch(`/api/story-media/${encodeURIComponent(mediaId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: MediaData) => setMedia(data))
      .catch(() => setFailed(true));
  }, [mediaId]);

  if (!mediaId || failed) {
    return (
      <figure className="my-6">
        {showTitle && titlePlacement === "above" ? <MediaTitle label={rawLabel} placement="above" /> : null}
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-8 text-sm text-text/60">
          {rawLabel || "Image"}
        </div>
        {showTitle && titlePlacement === "below" ? <MediaTitle label={rawLabel} placement="below" /> : null}
        {captionHtml && captionPlacement === "below" ? <CaptionHtml html={captionHtml} /> : null}
      </figure>
    );
  }

  if (!media) {
    return (
      <figure className="my-6">
        {showTitle && titlePlacement === "above" ? <MediaTitle label={rawLabel} placement="above" /> : null}
        <div className="flex min-h-24 animate-pulse items-center justify-center rounded-xl bg-surface-2/50 px-4 py-8" />
        {showTitle && titlePlacement === "below" ? <MediaTitle label={rawLabel} placement="below" /> : null}
        {captionHtml && captionPlacement === "below" ? <CaptionHtml html={captionHtml} /> : null}
      </figure>
    );
  }

  if (!isImageMedia(media)) {
    return (
      <figure className="my-6">
        {showTitle && titlePlacement === "above" ? <MediaTitle label={rawLabel} placement="above" /> : null}
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-8 text-sm text-text/60">
          {rawLabel || media.title || "Media"}
        </div>
        {showTitle && titlePlacement === "below" ? <MediaTitle label={rawLabel} placement="below" /> : null}
        {captionHtml && captionPlacement === "below" ? <CaptionHtml html={captionHtml} /> : null}
      </figure>
    );
  }

  return (
    <figure className="my-6">
      {showTitle && titlePlacement === "above" ? <MediaTitle label={rawLabel} placement="above" /> : null}
      {captionHtml && captionPlacement === "above" ? <CaptionHtml html={captionHtml} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.url}
        alt={rawLabel || media.title || ""}
        className="mx-auto max-w-full rounded-xl object-contain"
        loading="lazy"
      />
      {showTitle && titlePlacement === "below" ? <MediaTitle label={rawLabel} placement="below" /> : null}
      {captionHtml && captionPlacement === "below" ? <CaptionHtml html={captionHtml} /> : null}
    </figure>
  );
}
