"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Images,
  Layers,
  Lock,
  Share2,
} from "lucide-react";
import { Footer } from "@/components/homepage";
import { PageContainer, Section } from "@/components/wireframe";
import { cn } from "@/lib/utils";
import { AlbumGeneratorPreviewCard } from "./AlbumGeneratorPreviewCard";
import type { AlbumGeneratorPreview } from "./AlbumGeneratorPreviewCard";
import { PlaceSourceSearch, type ScrapbookPlaceOption } from "./PlaceSourceSearch";
import { TagSourceSearch, type ScrapbookTagOption } from "./TagSourceSearch";
import { ALBUM_GENERATOR_SOURCES, type AlbumGeneratorSourceId } from "./album-generator-types";

const HERO_MOBILE = "/images/albumsCoverImageMobile.png";
const HERO_DESKTOP = "/images/albumsCoverImage.png";

const MOCK_EVENTS = [
  "Golden wedding anniversary (1950)",
  "Emigration to Georgetown (1888)",
  "Family reunion (2019)",
];

function titleCaseSource(id: AlbumGeneratorSourceId): string {
  switch (id) {
    case "tag":
      return "Tag / theme";
    case "date":
      return "Date range";
    default:
      return ALBUM_GENERATOR_SOURCES.find((s) => s.id === id)?.title ?? id;
  }
}

function buildMockPreview(
  sourceId: AlbumGeneratorSourceId,
  searchText: string,
  selectValue: string,
  dateFrom: string,
  dateTo: string,
): AlbumGeneratorPreview {
  const textSelection =
    sourceId === "individual" || sourceId === "family" ? searchText : selectValue;
  const label =
    sourceId === "date"
      ? [dateFrom, dateTo].filter(Boolean).join(" — ") || "A chapter in time"
      : textSelection.trim() || "Your selection";

  const baseTitles: Record<AlbumGeneratorSourceId, string> = {
    individual: `${label}: portraits & milestones`,
    family: `${label}: together through the years`,
    event: `${label}: moments we preserved`,
    place: `${label}: faces and places`,
    date: `Memories from ${label}`,
    tag: `${label}: a gentle scrapbook`,
  };

  const hash = [...label].reduce((a, c) => a + c.charCodeAt(0), 0);
  const photoCount = 14 + (hash % 24);

  return {
    title: baseTitles[sourceId],
    photoCount,
    coverSrc: HERO_DESKTOP,
    tags: ["Auto-generated scrapbook", titleCaseSource(sourceId), "From the family tree"],
  };
}

type SourceCardProps = {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  icon: (typeof ALBUM_GENERATOR_SOURCES)[number]["icon"];
};

function SourceTypeCard({ selected, onSelect, title, description, icon: Icon }: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative min-h-[140px] w-full rounded-2xl border p-4 text-left transition duration-300 sm:min-h-[152px] sm:p-5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        selected
          ? "border-link/70 bg-[linear-gradient(165deg,rgba(31,90,56,0.12),rgba(129,89,58,0.06))] shadow-[0_10px_28px_rgba(31,90,56,0.12)]"
          : "border-border/80 bg-surface/90 shadow-[0_6px_20px_rgba(60,45,25,0.05)] hover:-translate-y-0.5 hover:border-border hover:shadow-[0_12px_28px_rgba(60,45,25,0.1)]",
      )}
    >
      {selected ? (
        <span
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-link text-primary-foreground shadow-sm"
          aria-hidden
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </span>
      ) : null}
      <span className="relative mb-3 inline-flex h-11 w-11 overflow-hidden rounded-xl border border-white/45 shadow-[0_2px_8px_rgba(25,18,12,0.08)]">
        <span
          className="pointer-events-none absolute inset-0 rounded-xl bg-[rgba(255,252,245,0.55)] [-webkit-backdrop-filter:blur(10px)] [backdrop-filter:blur(10px)]"
          aria-hidden
        />
        <span className="relative z-10 flex h-full w-full items-center justify-center text-link transition group-hover:text-link-hover">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </span>
      <span className="block font-heading text-lg font-semibold leading-snug text-heading">{title}</span>
      <span className="mt-1.5 block text-sm leading-relaxed text-muted">{description}</span>
    </button>
  );
}

export function AlbumGeneratorPage() {
  const baseId = useId();
  const [sourceType, setSourceType] = useState<AlbumGeneratorSourceId | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<ScrapbookPlaceOption | null>(null);
  const [selectedTag, setSelectedTag] = useState<ScrapbookTagOption | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const selectionReady = useMemo(() => {
    if (!sourceType) return false;
    if (sourceType === "individual" || sourceType === "family") {
      return searchText.trim().length >= 2;
    }
    if (sourceType === "event") {
      return Boolean(selectValue);
    }
    if (sourceType === "place") {
      return Boolean(selectedPlace);
    }
    if (sourceType === "tag") {
      return Boolean(selectedTag);
    }
    if (sourceType === "date") {
      return dateFrom.trim().length >= 4 && dateTo.trim().length >= 4;
    }
    return false;
  }, [sourceType, searchText, selectValue, selectedPlace, selectedTag, dateFrom, dateTo]);

  const pickerLabel =
    sourceType === "tag"
      ? (selectedTag?.name ?? "")
      : sourceType === "place"
        ? (selectedPlace?.name ?? "")
        : selectValue;

  const preview = useMemo((): AlbumGeneratorPreview | null => {
    if (!sourceType || !selectionReady) return null;
    return buildMockPreview(sourceType, searchText, pickerLabel, dateFrom, dateTo);
  }, [sourceType, selectionReady, searchText, pickerLabel, dateFrom, dateTo]);

  const generatedPreviewHref = "/media/album/generated-preview";
  const fullPreviewHref = origin ? `${origin}${generatedPreviewHref}` : generatedPreviewHref;

  const handleGenerate = useCallback(() => {
    if (!selectionReady || !sourceType) return;
    setGenerated(true);
    setCopyHint(null);
  }, [selectionReady, sourceType]);

  const handleCopyLink = useCallback(async () => {
    const text = fullPreviewHref;
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint("Link copied to clipboard.");
      window.setTimeout(() => setCopyHint(null), 2500);
    } catch {
      setCopyHint("Could not copy — select the URL and copy manually.");
    }
  }, [fullPreviewHref]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: preview?.title ?? "Family scrapbook",
          text: "A scrapbook from our family tree.",
          url: fullPreviewHref,
        });
      } else {
        await handleCopyLink();
      }
    } catch {
      /* user cancelled share */
    }
  }, [fullPreviewHref, preview?.title, handleCopyLink]);

  const selectorBlock = sourceType ? (
    <div className="mt-8 rounded-2xl border border-border-subtle/90 bg-[linear-gradient(180deg,rgba(129,89,58,0.08),rgba(129,89,58,0.02))] p-4 sm:p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {sourceType === "individual" && "Find a person"}
        {sourceType === "family" && "Find a family"}
        {sourceType === "event" && "Choose an event"}
        {sourceType === "place" && "Choose a place"}
        {sourceType === "date" && "Choose a date range"}
        {sourceType === "tag" && "Choose a tag or theme"}
      </p>
      <div className="mt-3 min-w-0">
        {(sourceType === "individual" || sourceType === "family") && (
          <label className="block min-w-0">
            <span className="sr-only">Search</span>
            <input
              id={`${baseId}-search`}
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={
                sourceType === "individual"
                  ? "Type a given name, surname, or nickname…"
                  : "Type parents' names or a family label…"
              }
              className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-heading shadow-inner outline-none transition placeholder:text-muted/70 focus:border-link/50 focus:ring-2 focus:ring-link/15"
            />
          </label>
        )}
        {sourceType === "event" && (
          <select
            id={`${baseId}-event`}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-heading outline-none focus:border-link/50 focus:ring-2 focus:ring-link/15"
          >
            <option value="">Select an event…</option>
            {MOCK_EVENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        )}
        {sourceType === "place" && (
          <PlaceSourceSearch inputId={`${baseId}-place`} selected={selectedPlace} onSelect={setSelectedPlace} />
        )}
        {sourceType === "tag" && (
          <TagSourceSearch inputId={`${baseId}-tag`} selected={selectedTag} onSelect={setSelectedTag} />
        )}
        {sourceType === "date" && (
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">From (year or full date)</span>
              <input
                type="text"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="e.g. 1920"
                className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-heading outline-none focus:border-link/50 focus:ring-2 focus:ring-link/15"
              />
            </label>
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">To</span>
              <input
                type="text"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="e.g. 1945"
                className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm text-heading outline-none focus:border-link/50 focus:ring-2 focus:ring-link/15"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section className="relative min-w-0 overflow-x-hidden pb-20 pt-14 md:pb-24 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src={HERO_MOBILE}
              alt=""
              fill
              priority
              className="object-cover md:hidden"
              sizes="100vw"
            />
            <Image
              src={HERO_DESKTOP}
              alt=""
              fill
              priority
              className="hidden object-cover md:block"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-bg/94 via-bg/72 to-bg/50 md:from-bg/88 md:to-bg/62"
              aria-hidden
            />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="grid min-w-0 max-w-full gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.75fr)] lg:items-end lg:gap-14">
                <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:space-y-6 sm:p-6">
                  <nav
                    aria-label="Breadcrumb"
                    className="flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted"
                  >
                    <Link href="/" className="min-w-0 shrink transition hover:text-link">
                      Home
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <Link href="/archive" className="min-w-0 shrink transition hover:text-link">
                      Archive
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <Link href="/media" className="min-w-0 shrink transition hover:text-link">
                      Media
                    </Link>
                    <span className="shrink-0 text-subtle">/</span>
                    <span className="min-w-0 text-heading">Scrapbook Generator</span>
                  </nav>
                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                    Scrapbook Generator
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    Automatically create scrapbooks from people, families, events, places, dates, and tags in our
                    family tree.
                  </p>
                  <p className="max-w-xl text-sm leading-relaxed text-muted/95 sm:text-base">
                    We&apos;ll gather the most relevant media—photos, documents, and more—and organize them into a
                    beautiful shareable scrapbook for you.
                  </p>
                </div>
                <div
                  className="relative hidden min-h-[220px] overflow-hidden rounded-2xl border border-white/15 bg-black/10 shadow-[0_20px_50px_rgba(25,18,12,0.35)] lg:block"
                  aria-hidden
                >
                  <Image src={HERO_DESKTOP} alt="" fill className="object-cover opacity-90" sizes="(max-width:1024px) 0vw, 34vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/50 to-transparent" />
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        <div className="relative z-20 -mt-14 min-w-0 px-0 sm:-mt-16">
          <PageContainer narrow>
            <section
              id="scrapbook-generator"
              className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border-subtle/70 bg-surface/95 p-5 shadow-[0_18px_40px_rgba(60,45,25,0.12)] backdrop-blur-sm sm:p-6 md:p-8"
            >
              <div className="mb-6 min-w-0 pb-1">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Step 1 — Source
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold leading-tight text-heading sm:text-3xl">
                  Choose what to build from
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                  Pick one path. When you&apos;re ready, we&apos;ll pull linked media from the tree—no layouts
                  to tweak, no titles to type.
                </p>
              </div>

              <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {ALBUM_GENERATOR_SOURCES.map((s) => (
                  <SourceTypeCard
                    key={s.id}
                    title={s.title}
                    description={s.description}
                    icon={s.icon}
                    selected={sourceType === s.id}
                    onSelect={() => {
                      setSourceType(s.id);
                      setSearchText("");
                      setSelectValue("");
                      setSelectedPlace(null);
                      setSelectedTag(null);
                      setDateFrom("");
                      setDateTo("");
                      setGenerated(false);
                    }}
                  />
                ))}
              </div>

              {selectorBlock}

              <div className="mt-8 flex min-w-0 flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border-subtle/80 bg-surface/80 px-3 py-3 sm:max-w-lg sm:px-4">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    Scrapbooks can be private, shared with family members, or publicly viewable. Visibility is set
                    when the scrapbook is published to the site.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!selectionReady}
                  onClick={handleGenerate}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-link px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                >
                  Generate a scrapbook <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </section>
          </PageContainer>
        </div>

        <Section className="min-w-0 overflow-x-hidden py-12 md:py-16">
          <PageContainer narrow>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-semibold text-heading sm:text-3xl">How it works</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                A quiet, automatic path from the tree to something you can share.
              </p>
            </div>
            <div className="mt-10 grid min-w-0 gap-6 md:grid-cols-3 md:gap-8">
              {[
                {
                  icon: Images,
                  title: "We find related media",
                  body: "We look through people, families, events, and tags to gather photos, scans, and other items that belong together.",
                },
                {
                  icon: Layers,
                  title: "We organize them for you",
                  body: "Order, pacing, and grouping are handled for you—like leafing through a family scrapbook.",
                },
                {
                  icon: Share2,
                  title: "You receive a shareable scrapbook",
                  body: "Open your new scrapbook, copy a link, or share it directly with relatives when you are ready.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="min-w-0 rounded-2xl border border-border/70 bg-surface-elevated/90 p-5 text-center shadow-[0_6px_20px_rgba(60,45,25,0.05)] sm:p-6"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-surface text-link">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-heading">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </Section>

        {generated && preview ? (
          <Section className="min-w-0 overflow-x-hidden pb-14 pt-2 md:pb-20">
            <PageContainer narrow>
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.08)] sm:p-6 md:p-8">
                <h2 className="font-heading text-2xl font-semibold text-heading sm:text-3xl">Your scrapbook is ready</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
                  Here&apos;s a gentle summary—open it in the archive, copy the link for relatives, or use your
                  device&apos;s share sheet.
                </p>
                <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
                  <AlbumGeneratorPreviewCard preview={preview} variant="compact" />
                  <div className="min-w-0 space-y-5">
                    <div>
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
                        Scrapbook link
                      </p>
                      <p className="mt-2 break-all rounded-xl border border-border-subtle bg-surface px-3 py-2.5 font-mono text-xs text-heading sm:text-sm">
                        {fullPreviewHref}
                      </p>
                      {copyHint ? <p className="mt-2 text-xs text-link">{copyHint}</p> : null}
                    </div>
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link
                        href={generatedPreviewHref}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-link px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover"
                      >
                        Open scrapbook <ExternalLink className="h-4 w-4" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-5 py-3 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-5 py-3 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
                      >
                        <Share2 className="h-4 w-4" aria-hidden />
                        Share scrapbook
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      This preview uses sample routing. When generation is live, this panel will reflect your
                      real scrapbook and permissions.
                    </p>
                  </div>
                </div>
              </div>
            </PageContainer>
          </Section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
