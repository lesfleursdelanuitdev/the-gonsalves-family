"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Images } from "lucide-react";
import { INDIVIDUAL_MEDIA_PEEK_SAMPLE_LIMIT } from "./hooks/useIndividualMediaPeek";
import type { IndividualMediaPeek } from "./types";
import { Section } from "./Section";
import {
  sectionDescriptionStyle,
  sectionDescriptionStyleMobile,
  iconColor,
  iconSize,
  SECTION_BORDER_RADIUS,
} from "./styles";
import { resolveGedcomMediaFileRef } from "@/lib/images";

function isLikelyRasterImage(form: string | null | undefined): boolean {
  const f = (form ?? "").toLowerCase().trim();
  if (!f) return true;
  return ["jpeg", "jpg", "png", "gif", "webp", "bmp", "tif", "tiff"].includes(f);
}

function mediaThumbSrc(item: { fileRef: string | null; form: string | null }): string | null {
  const ref = (item.fileRef ?? "").trim();
  if (!ref || !isLikelyRasterImage(item.form)) return null;
  return resolveGedcomMediaFileRef(ref) || null;
}

/** Explains total linked OBJEs vs how many preview tiles the detail API returns (up to 3). */
function mediaSummaryLines(total: number, sampleCount: number): ReactNode {
  const itemWord = total === 1 ? "item" : "items";
  const thumbWord = sampleCount === 1 ? "thumbnail" : "thumbnails";
  if (sampleCount === 0) {
    return (
      <>
        There <strong>{total === 1 ? "is" : "are"}</strong> <strong>{total}</strong> linked {itemWord} in the tree.
        Open the album below to browse them.
      </>
    );
  }
  if (sampleCount >= total) {
    return (
      <>
        Showing all <strong>{total}</strong> linked {itemWord} below.
      </>
    );
  }
  return (
    <>
      This person has <strong>{total}</strong> linked {itemWord} in the tree. Below are{" "}
      <strong>{sampleCount}</strong> random {thumbWord} (not the full set). Open the album for everything.
    </>
  );
}

const albumButtonStyle: CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 8,
  backgroundColor: "rgba(46, 122, 82, 0.12)",
  border: "1px solid rgba(46, 122, 82, 0.35)",
  color: "#14532d",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};

interface MediaSectionProps {
  status: "loading" | "success" | "error";
  peek: IndividualMediaPeek | null;
  isMobile?: boolean;
  /** When total linked items exceed preview count, pick another random preview set. */
  onRandomizeSamples?: () => void;
  samplesRefetchBusy?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const mediaBodyTextStyle = (isMobile: boolean | undefined): CSSProperties => ({
  ...sectionDescriptionStyle,
  ...(isMobile ? sectionDescriptionStyleMobile : {}),
});

export function MediaSection({
  status,
  peek,
  isMobile,
  onRandomizeSamples,
  samplesRefetchBusy = false,
  expanded,
  onExpandedChange,
}: MediaSectionProps) {
  const loading = status === "loading";
  const failed = status === "error";
  const albumHref =
    peek != null
      ? `/media/album-view?kind=generated&type=individual&id=${encodeURIComponent(peek.individualId)}`
      : null;

  return (
    <Section
      icon={<Images size={iconSize} color={iconColor} aria-hidden />}
      title="Media"
      description="Photos and documents linked to this person in the tree. Open the album to browse everything."
      collapsible
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      isMobile={isMobile}
      contentStyle={{
        paddingTop: 12,
        paddingRight: 12,
        paddingBottom: 12,
        paddingLeft: 12,
        borderBottomLeftRadius: SECTION_BORDER_RADIUS,
        borderBottomRightRadius: SECTION_BORDER_RADIUS,
      }}
    >
      {loading && <p style={mediaBodyTextStyle(isMobile)}>Loading media…</p>}
      {failed && <p style={mediaBodyTextStyle(isMobile)}>Media could not be loaded.</p>}
      {!loading && !failed && peek != null && peek.totalCount === 0 && (
        <p style={mediaBodyTextStyle(isMobile)}>No media is linked to this person yet.</p>
      )}
      {!loading && !failed && peek != null && peek.totalCount > 0 && (
        <>
          <p style={mediaBodyTextStyle(isMobile)}>{mediaSummaryLines(peek.totalCount, peek.samples.length)}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {peek.samples.map((item) => {
              const src = mediaThumbSrc(item);
              const label = (item.title ?? "").trim() || item.id.slice(0, 8);
              return (
                <Link
                  key={item.id}
                  href={albumHref!}
                  style={{
                    display: "block",
                    aspectRatio: "1",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid rgba(46, 122, 82, 0.2)",
                    background: "rgba(46, 122, 82, 0.06)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                  aria-label={`Open album: ${label}`}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic OBJE URLs from admin origin
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        padding: 6,
                        textAlign: "center",
                        wordBreak: "break-word",
                        color: "#14532d",
                      }}
                    >
                      {label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          {albumHref != null && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <Link href={albumHref} style={{ ...albumButtonStyle, textDecoration: "none" }}>
                Open album
              </Link>
              {peek.totalCount > INDIVIDUAL_MEDIA_PEEK_SAMPLE_LIMIT && onRandomizeSamples != null && (
                <button
                  type="button"
                  onClick={() => {
                    if (!samplesRefetchBusy) onRandomizeSamples();
                  }}
                  disabled={samplesRefetchBusy}
                  aria-busy={samplesRefetchBusy}
                  style={{
                    ...albumButtonStyle,
                    opacity: samplesRefetchBusy ? 0.65 : 1,
                  }}
                >
                  {samplesRefetchBusy ? "Updating…" : "Randomize"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Section>
  );
}
