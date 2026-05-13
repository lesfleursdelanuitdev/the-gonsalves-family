"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type MediaHubCollectionId,
  MEDIA_HUB_COLLECTION_NAV,
  mediaHubCollectionHref,
} from "@/lib/media/media-hub-collection";

type MediaHubPillAnchorProps = {
  href: string;
  isActive: boolean;
  shortLabel: string;
  longLabel: string;
};

/**
 * Hero pill control (collection tab or secondary link). Inactive styling matches
 * the frosted “browse by type” tabs on `/media`.
 */
export function MediaHubPillAnchor({ href, isActive, shortLabel, longLabel }: MediaHubPillAnchorProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] transition-[transform,box-shadow,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-4 sm:text-sm sm:tracking-[0.06em]",
        isActive
          ? [
              "border-[rgba(31,90,56,0.65)]",
              "text-white shadow-[0_5px_22px_rgba(31,90,56,0.38),0_2px_10px_rgba(0,0,0,0.12)]",
              "hover:-translate-y-0.5 hover:shadow-[0_7px_28px_rgba(31,90,56,0.45),0_2px_12px_rgba(0,0,0,0.14)]",
              "dark:border-[rgba(214,178,90,0.55)] dark:text-heading",
              "dark:shadow-[0_5px_24px_rgba(0,0,0,0.4)]",
              "dark:hover:shadow-[0_7px_28px_rgba(0,0,0,0.48)]",
            ].join(" ")
          : [
              "border-white/55 text-heading",
              "shadow-[0_4px_18px_rgba(25,20,12,0.14),inset_0_1px_0_rgba(255,255,255,0.28)]",
              "hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/80",
              "hover:shadow-[0_8px_28px_rgba(25,20,12,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]",
              "active:translate-y-0 active:scale-[1]",
              "dark:border-white/25 dark:text-text",
              "dark:shadow-[0_4px_20px_rgba(0,0,0,0.38)]",
              "dark:hover:border-white/40 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.48)]",
            ].join(" "),
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 z-0 rounded-full backdrop-saturate-150 transition-colors duration-200 [-webkit-backdrop-filter:blur(20px)_saturate(1.15)] [backdrop-filter:blur(20px)_saturate(1.15)]",
          isActive
            ? "bg-[rgba(31,90,56,0.45)] group-hover:bg-[rgba(31,90,56,0.58)] dark:bg-[rgba(214,178,90,0.38)] dark:group-hover:bg-[rgba(214,178,90,0.5)]"
            : "bg-[rgba(255,252,245,0.42)] group-hover:bg-[rgba(255,252,245,0.58)] dark:bg-[rgba(32,30,28,0.48)] dark:group-hover:bg-[rgba(32,30,28,0.62)]",
        )}
        aria-hidden
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-0">
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{longLabel}</span>
      </span>
    </Link>
  );
}

/** Quick link to `/scrapbook-generator`, visually matched to browse-by-type pills. */
export function MediaHubGenerateAlbumPill() {
  return (
    <MediaHubPillAnchor
      href="/scrapbook-generator"
      isActive={false}
      shortLabel="Generate a scrapbook"
      longLabel="Generate a scrapbook"
    />
  );
}

type MediaHubCollectionTabsProps = {
  active: MediaHubCollectionId;
};

/**
 * Same-route navigation for future filtered hubs.
 *
 * `backdrop-filter` is unreliable when ancestors use `overflow: hidden` or when the
 * blurred element itself uses `overflow: hidden`; the hero Section avoids vertical
 * overflow clipping, and tabs use wrapping instead of a horizontal scroll container
 * so the frosted pill layer can sample the hero imagery behind it.
 */
export function MediaHubCollectionTabs({ active }: MediaHubCollectionTabsProps) {
  return (
    <nav aria-label="Browse by media type" className="min-w-0 max-w-full">
      <ul className="flex min-w-0 max-w-full flex-wrap gap-2 py-1 sm:gap-2 sm:py-0">
        {MEDIA_HUB_COLLECTION_NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} className="min-w-0 shrink-0">
              <MediaHubPillAnchor
                href={mediaHubCollectionHref(item.id)}
                isActive={isActive}
                shortLabel={item.shortLabel}
                longLabel={item.label}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
