"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarHeart,
  ChevronDown,
  ChevronRight,
  Circle,
  Diamond,
  GitBranch,
  Heart,
  HeartCrack,
  Library,
  MoreHorizontal,
  RefreshCw,
  Share2,
  UsersRound,
} from "lucide-react";
import { MobileProfileNotes } from "@/components/notes/MobileProfileNotes";
import { MobileProfileTimeline } from "@/components/timeline/MobileProfileTimeline";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import { cn } from "@/lib/utils";
import { FAMILY_MEDIA_PEEK_SAMPLE_LIMIT, useFamilyMediaPeek } from "./hooks/useFamilyMediaPeek";
import { FamilyMemberCard } from "./FamilyMemberCard";
import { FamilyOverlappingAvatars } from "./FamilyPortrait";
import type { DivorcedStatus, PublicFamilyProfile } from "./types";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

function divorcedLabel(status: DivorcedStatus): string {
  if (status === "yes") return "Yes";
  if (status === "no") return "No";
  return "Unknown";
}

function marriageSubtitle(family: PublicFamilyProfile): string {
  if (family.marriageDateLabel) {
    return `Married ${family.marriageDateLabel}${family.marriagePlaceLabel ? ` · ${family.marriagePlaceLabel}` : ""}`;
  }
  return family.marriagePlaceLabel ?? "Marriage details not recorded";
}

function isLikelyRasterImage(form: string | null | undefined): boolean {
  const f = (form ?? "").toLowerCase().trim();
  if (!f) return true;
  return ["jpeg", "jpg", "png", "gif", "webp", "bmp", "tif", "tiff"].includes(f);
}

function mediaThumbSrc(item: { fileRef?: string | null; form?: string | null }): string | null {
  const ref = (item.fileRef ?? "").trim();
  if (!ref || !isLikelyRasterImage(item.form)) return null;
  return resolveGedcomMediaFileRef(ref) || null;
}

function familyInitials(title: string): string {
  return (
    title
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function FamilyBarAvatar({
  partners,
  title,
}: {
  partners: PublicFamilyProfile["partners"];
  title: string;
}) {
  const portrait = partners.find((p) => p.portraitSrc)?.portraitSrc ?? null;
  if (portrait) {
    return (
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface" aria-hidden>
        <Image src={portrait} alt="" width={32} height={32} className="h-full w-full object-cover sepia-[0.18]" sizes="32px" />
      </span>
    );
  }
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated font-heading text-[0.55rem] font-semibold text-link"
      aria-hidden
    >
      {familyInitials(title)}
    </span>
  );
}

function MobileFamilyBottomBar({
  family,
  treeViewHref,
  hasNotes,
  hasMedia,
}: {
  family: PublicFamilyProfile;
  treeViewHref: string | null;
  hasNotes: boolean;
  hasMedia: boolean;
}) {
  const [navOpen, setNavOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [active, setActive] = useState("Overview");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${family.title} | The Gonsalves Family`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareStatus("copied");
        window.setTimeout(() => setShareStatus("idle"), 1800);
      }
    } catch {
      // cancelled
    }
  };

  const moreLinks = useMemo(() => {
    const links: { label: string; href: string }[] = [{ label: "Members", href: "#members" }];
    if (hasMedia) links.push({ label: "Media", href: "#media" });
    if (hasNotes) links.push({ label: "Notes", href: "#notes" });
    return links;
  }, [hasMedia, hasNotes]);

  const navBtnClass = (isActive: boolean) =>
    cn(
      "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 pt-2",
      isActive ? "text-crimson" : "text-muted",
    );

  const inTreeHref = treeViewHref ?? "#members";

  return (
    <>
      {moreOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-black/25 md:hidden"
          role="presentation"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      <nav
        aria-label="Family profile navigation"
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-border-subtle bg-surface-elevated/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_rgba(60,45,25,0.12)] backdrop-blur-[10px] md:hidden"
        style={{ WebkitBackdropFilter: "blur(10px)" }}
      >
        {moreOpen ? (
          <div className="border-b border-border-subtle/80 px-4 py-3">
            <p className="font-heading text-sm font-semibold text-heading">More</p>
            <ul className="mt-2 divide-y divide-border-subtle/60">
              {moreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => {
                      setMoreOpen(false);
                      setActive("More");
                    }}
                    className="flex items-center justify-between py-2.5 text-sm font-medium text-link"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium text-link"
                >
                  {shareStatus === "copied" ? "Link copied" : "Share profile"}
                  <Share2 className="h-4 w-4 opacity-60" aria-hidden />
                </button>
              </li>
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
          className="flex w-full items-center gap-2 border-b border-border-subtle/70 px-3.5 py-2.5 text-left"
        >
          <FamilyBarAvatar partners={family.partners} title={family.title} />
          <span className="min-w-0 flex-1 truncate font-heading text-sm font-semibold text-heading">{family.title}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface">
            <ChevronDown
              className={cn("h-4 w-4 text-link transition-transform", navOpen ? "rotate-180" : "rotate-0")}
              strokeWidth={1.75}
              aria-hidden
            />
          </span>
        </button>

        <div
          className={cn(
            "grid grid-cols-4 overflow-hidden",
            reduceMotion ? "" : "transition-[max-height] duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)]",
            navOpen ? "max-h-16" : "max-h-0",
          )}
          aria-hidden={!navOpen}
        >
          <Link href="#overview" onClick={() => setActive("Overview")} className={navBtnClass(active === "Overview")}>
            {active === "Overview" ? (
              <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-crimson" aria-hidden />
            ) : null}
            <Circle className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="font-body text-[0.56rem] font-semibold uppercase tracking-[0.14em]">Overview</span>
          </Link>

          <Link href={inTreeHref} onClick={() => setActive("In Tree")} className={navBtnClass(active === "In Tree")}>
            {active === "In Tree" ? (
              <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-crimson" aria-hidden />
            ) : null}
            <GitBranch className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="font-body text-[0.56rem] font-semibold uppercase tracking-[0.14em]">In tree</span>
          </Link>

          <Link href="#events" onClick={() => setActive("Events")} className={navBtnClass(active === "Events")}>
            {active === "Events" ? (
              <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-crimson" aria-hidden />
            ) : null}
            <Diamond className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="font-body text-[0.56rem] font-semibold uppercase tracking-[0.14em]">Events</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setMoreOpen((v) => !v);
              setActive("More");
            }}
            className={navBtnClass(active === "More" || moreOpen)}
          >
            {active === "More" || moreOpen ? (
              <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-crimson" aria-hidden />
            ) : null}
            <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="font-body text-[0.56rem] font-semibold uppercase tracking-[0.14em]">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function MobileFamilyMedia({
  albumHref,
  mediaPeek,
}: {
  albumHref: string;
  mediaPeek: ReturnType<typeof useFamilyMediaPeek>;
}) {
  const peek = mediaPeek.data;
  const loading = mediaPeek.status === "loading";
  const failed = mediaPeek.status === "error";
  const hasMedia = peek != null && peek.totalCount > 0;
  const showRandomize =
    peek != null && peek.totalCount > FAMILY_MEDIA_PEEK_SAMPLE_LIMIT && peek.samples.length > 0;

  if (!loading && !failed && !hasMedia) return null;

  return (
    <section id="media" className="scroll-mt-[7.5rem] px-4 py-8">
      <div className="text-center">
        <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Media</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Family album</h2>
      </div>
      <p className="mt-3 text-center font-body text-xs text-muted">
        {peek?.totalCount
          ? `Showing ${peek.samples.length} of ${peek.totalCount} linked items.`
          : "Browse photos and documents linked to this family."}
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        {showRandomize ? (
          <button
            type="button"
            onClick={mediaPeek.randomizeSamples}
            disabled={mediaPeek.samplesRefetchBusy}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", mediaPeek.samplesRefetchBusy && "animate-spin")} aria-hidden />
            Randomize
          </button>
        ) : null}
        <Link
          href={albumHref}
          className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
        >
          <Library className="h-3.5 w-3.5" aria-hidden />
          Open album
        </Link>
      </div>
      {loading ? (
        <ul className="mt-5 grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="aspect-square animate-pulse rounded-sm bg-surface-inset" />
          ))}
        </ul>
      ) : failed ? (
        <p className="mt-5 rounded-xl border border-dashed border-border-subtle bg-surface/70 px-4 py-6 text-center font-body text-sm text-muted">
          Media could not be loaded.
        </p>
      ) : hasMedia ? (
        <ul className="mt-5 grid grid-cols-3 gap-1.5">
          {peek!.samples.map((item) => (
            <li key={item.id}>
              <Link
                href={albumHref}
                className="relative block aspect-square overflow-hidden rounded-sm bg-surface-inset"
              >
                {mediaThumbSrc(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaThumbSrc(item)!} alt="" className="h-full w-full object-cover sepia-[0.2]" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center font-body text-[0.55rem] text-muted">
                    Media
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function MobileFamilyProfile({
  family,
  treeViewHref,
}: {
  family: PublicFamilyProfile;
  treeViewHref: string | null;
}) {
  const partners = family.members.filter((m) => m.role === "Partner");
  const children = family.members.filter((m) => m.role === "Child");
  const timeline = family.timeline ?? [];
  const notes = family.notes ?? [];
  const hasNotes = notes.length > 0;
  const mediaPeek = useFamilyMediaPeek(family.id);
  const hasMedia = mediaPeek.data != null && mediaPeek.data.totalCount > 0;
  const heroPortrait = family.partners.find((p) => p.portraitSrc)?.portraitSrc ?? null;

  return (
    <div className="pb-28 text-text md:hidden">
      <section className="relative overflow-hidden pt-[66px]">
        <div className="absolute inset-0" aria-hidden>
          {heroPortrait ? (
            <Image
              src={heroPortrait}
              alt=""
              fill
              priority
              className="scale-110 object-cover blur-xl sepia-[0.28] saturate-[0.85]"
              sizes="100vw"
            />
          ) : (
            <Image
              src={PERSON_CARD_FALLBACK_BG}
              alt=""
              fill
              priority
              className="scale-110 object-cover blur-xl sepia-[0.28] saturate-[0.72]"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-surface/10 via-bg/55 to-bg" />
        </div>

        <div className="relative z-10 px-4">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex min-w-0 flex-wrap items-center gap-1.5 font-body text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            <Link href="/" className="transition hover:text-link">
              Home
            </Link>
            <span className="text-subtle">/</span>
            <Link href="/families" className="transition hover:text-link">
              Families
            </Link>
            <span className="text-subtle">/</span>
            <span className="truncate text-heading">{family.title}</span>
          </nav>

          <div id="overview" className="scroll-mt-[7.5rem]">
            <div className="flex items-start gap-3">
              <div className="shrink-0 pt-0.5">
                <FamilyOverlappingAvatars partners={family.partners} size="hero" />
              </div>
              <div className="min-w-0 flex-1 pl-1 pt-1">
                <h1 className="font-heading text-2xl font-semibold leading-[1.12] tracking-[-0.015em] text-heading">
                  {family.title}
                </h1>
                <p className="mt-1 font-body text-[0.94rem] leading-snug text-link">{marriageSubtitle(family)}</p>
              </div>
            </div>

            <div className="mb-7 mt-4 rounded-xl border border-border-subtle bg-surface/90 p-3 shadow-[0_10px_24px_rgba(60,45,25,0.12)]">
              <div className="grid grid-cols-4 gap-1 text-center">
                {(
                  [
                    { label: "Marriage", icon: CalendarHeart, sub: family.marriageDateLabel ?? "—" },
                    { label: "Divorced", icon: HeartCrack, sub: divorcedLabel(family.divorcedStatus) },
                    { label: "Children", icon: UsersRound, sub: String(family.childrenCount) },
                    { label: "Partners", icon: Heart, sub: String(family.partners.length) },
                  ] as const
                ).map((col) => {
                  const Icon = col.icon;
                  return (
                    <div key={col.label} className="flex min-w-0 flex-col items-center px-0.5">
                      <Icon className="h-4 w-4 shrink-0 text-link" strokeWidth={1.75} aria-hidden />
                      <p className="mt-1.5 font-body text-xs font-semibold uppercase leading-tight tracking-[0.12em] text-muted">
                        {col.label}
                      </p>
                      <p className="mt-1 w-full truncate font-body text-[0.68rem] leading-tight text-muted">{col.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {treeViewHref ? (
              <Link
                href={treeViewHref}
                className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
              >
                <GitBranch className="h-4 w-4" aria-hidden />
                View in tree
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section id="members" className="scroll-mt-[7.5rem] px-4 py-8">
        <div className="text-center">
          <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Members</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Family Members</h2>
          <p className="mt-1 font-body text-sm leading-relaxed text-muted">
            Partners and children linked to this family in the tree.
          </p>
        </div>
        {family.members.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-border-subtle bg-surface/70 px-4 py-6 text-center font-body text-sm leading-relaxed text-muted">
            No members are linked to this family yet.
          </p>
        ) : (
          <div className="mt-5 space-y-6">
            {partners.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-semibold text-heading">Partners</h3>
                <div className="space-y-3">
                  {partners.map((member) => (
                    <FamilyMemberCard
                      key={member.id}
                      member={member}
                      partners={family.partners}
                      showAncestorsAction
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {children.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-semibold text-heading">Children</h3>
                <div className="space-y-3">
                  {children.map((member) => (
                    <FamilyMemberCard
                      key={member.id}
                      member={member}
                      partners={family.partners}
                      showDescendancyChartAction
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <MobileFamilyMedia albumHref={family.albumHref} mediaPeek={mediaPeek} />

      {hasNotes ? <MobileProfileNotes notes={notes} subjectName={family.title} /> : null}

      <section
        id="events"
        className="scroll-mt-[7.5rem] border-y border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--link)_7%,var(--bg)),color-mix(in_srgb,var(--link)_3%,var(--bg)))] px-4 py-8"
      >
        <div className="text-center">
          <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Events</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Timeline</h2>
        </div>
        <div className="mt-6">
          <MobileProfileTimeline items={timeline} />
        </div>
      </section>

      <MobileFamilyBottomBar
        family={family}
        treeViewHref={treeViewHref}
        hasNotes={hasNotes}
        hasMedia={hasMedia}
      />
    </div>
  );
}
