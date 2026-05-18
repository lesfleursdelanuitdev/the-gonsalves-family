"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Diamond,
  GitBranch,
  Heart,
  Home,
  Library,
  MapPin,
  MessageSquarePlus,
  MoreHorizontal,
  RefreshCw,
  Share2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNameBackgroundColor } from "@/lib/person-name-accent";
import { MobileProfileNotes } from "@/components/notes/MobileProfileNotes";
import { MobileProfileTimeline } from "@/components/timeline/MobileProfileTimeline";
import { ProfileCharts } from "./ProfileCharts";
import { PersonCardTreeModalTrigger } from "./PersonCardTreeModal";
import type {
  PublicIndividualAssociate,
  PublicIndividualProfile,
  PublicIndividualRelation,
} from "./types";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

type FamilyTab = "child" | "partner";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function lifeRange(birthYear: number | null, deathYear: number | null): string {
  const born = birthYear ? String(birthYear) : "Unknown";
  const died = deathYear ? String(deathYear) : "Present";
  return `${born} – ${died}`;
}

function relationSetLabel(items: PublicIndividualRelation[], fallback: string): string {
  const names = items
    .map((item) => firstName(item.fullName))
    .filter(Boolean)
    .slice(0, 2);
  if (names.length === 0) return fallback;
  return names.join(" & ");
}

function possessivePronoun(gender: string | null): string {
  const g = (gender ?? "").toLowerCase();
  if (g.startsWith("f")) return "her";
  if (g.startsWith("m")) return "his";
  return "their";
}

function FamilyTabIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-link/10 text-link"
      aria-hidden
    >
      <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
    </span>
  );
}

/** Portrait ring colors — same palette as tree / person name accents. */
function portraitBorderColor(gender: string | null, sex: string | null): string {
  const sexTrimmed = sex?.trim();
  if (sexTrimmed) {
    const fromSex = getNameBackgroundColor(sexTrimmed);
    const compact = sexTrimmed.toUpperCase().replace(/\s+/g, "");
    if (compact === "M" || compact === "F" || compact === "MALE" || compact === "FEMALE") {
      return fromSex;
    }
  }
  return getNameBackgroundColor(gender?.trim() || null);
}

function mobileLifeLine(person: PublicIndividualProfile): string {
  const born = person.birthYear ? String(person.birthYear) : "Unknown";
  const died = person.deathYear ? String(person.deathYear) : "present";
  return `${born} – ${died}`;
}

function RelationAvatar({
  relation,
  size = 42,
  className,
}: {
  relation: Pick<PublicIndividualRelation, "fullName" | "portraitSrc">;
  size?: number;
  className?: string;
}) {
  const dim = `${size}px`;
  if (relation.portraitSrc) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface",
          className,
        )}
        style={{ width: dim, height: dim }}
        aria-hidden
      >
        <Image
          src={relation.portraitSrc}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover sepia-[0.18]"
          sizes={`${size}px`}
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated font-heading font-semibold text-link",
        className,
      )}
      style={{ width: dim, height: dim, fontSize: size < 36 ? "0.55rem" : "0.7rem" }}
      aria-hidden
    >
      {initials(relation.fullName)}
    </span>
  );
}

function RelationsGroup({
  label,
  items,
  relationSuffix,
}: {
  label: string;
  items: PublicIndividualRelation[] | PublicIndividualAssociate[];
  relationSuffix?: (item: PublicIndividualRelation | PublicIndividualAssociate) => string | null;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="shrink-0 font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted">
          {label}
        </span>
        <span className="h-px min-w-0 flex-1 bg-border-subtle" aria-hidden />
        <span className="shrink-0 font-body text-[0.58rem] font-semibold tabular-nums text-muted">{items.length}</span>
      </div>
      <ul className="divide-y divide-dotted divide-border-subtle">
        {items.map((item) => {
          const suffix = relationSuffix?.(item);
          return (
            <li key={`${label}-${item.id}`}>
              <Link
                href={`/individuals/${encodeURIComponent(item.id)}`}
                className="group flex items-center gap-3 py-3"
              >
                <RelationAvatar relation={item} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-[0.94rem] font-semibold leading-snug text-heading group-hover:text-link">
                    {item.fullName}
                  </span>
                  <span className="mt-0.5 block truncate font-body text-[0.8rem] leading-snug text-muted">
                    {lifeRange(item.birthYear, item.deathYear)}
                    {suffix ? (
                      <>
                        {" "}
                        <span className="font-body text-[0.58rem] font-semibold not-italic uppercase tracking-[0.14em] text-link">
                          {suffix}
                        </span>
                      </>
                    ) : null}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted/60 transition group-hover:translate-x-0.5 group-hover:text-link"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MobileBottomBar({
  person,
  contributionHref,
  avatarSrc,
  hasAssociates,
  hasNotes,
  hasMedia,
  hasResearch,
}: {
  person: PublicIndividualProfile;
  contributionHref: string;
  avatarSrc: string | null;
  hasAssociates: boolean;
  hasNotes: boolean;
  hasMedia: boolean;
  hasResearch: boolean;
}) {
  const [navOpen, setNavOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [active, setActive] = useState("Overview");
  const [treeModalOpen, setTreeModalOpen] = useState(false);
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
    const title = `${person.fullName} | The Gonsalves Family`;
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
    const links: { label: string; href: string }[] = [];
    if (hasAssociates) links.push({ label: "Associates", href: "#associates" });
    if (hasMedia) links.push({ label: "Media", href: "#media" });
    links.push({ label: "Charts", href: "#charts" });
    if (hasNotes) links.push({ label: "Notes", href: "#notes" });
    if (hasResearch) links.push({ label: "Research", href: "#open-questions" });
    links.push({ label: "Contribute", href: contributionHref });
    return links;
  }, [contributionHref, hasAssociates, hasMedia, hasNotes, hasResearch]);

  const navBtnClass = (isActive: boolean) =>
    cn(
      "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 pt-2",
      isActive ? "text-crimson" : "text-muted",
    );

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
      aria-label="Profile navigation"
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
        {avatarSrc ? (
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-surface" aria-hidden>
            <Image src={avatarSrc} alt="" width={32} height={32} className="h-full w-full object-cover sepia-[0.18]" sizes="32px" />
          </span>
        ) : (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated font-heading text-[0.55rem] font-semibold text-link"
            aria-hidden
          >
            {initials(person.fullName)}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate font-heading text-sm font-semibold text-heading">{person.fullName}</span>
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
        <Link
          href="#overview"
          onClick={() => setActive("Overview")}
          className={navBtnClass(active === "Overview")}
        >
          {active === "Overview" ? (
            <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-crimson" aria-hidden />
          ) : null}
          <Circle className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          <span className="font-body text-[0.56rem] font-semibold uppercase tracking-[0.14em]">Overview</span>
        </Link>

        <PersonCardTreeModalTrigger
          personId={person.id}
          xref={person.xref}
          fullName={person.fullName}
          triggerAriaLabel="In tree"
          active={active === "In Tree" || treeModalOpen}
          onOpenChange={(open) => {
            setTreeModalOpen(open);
            if (open) setActive("In Tree");
          }}
          triggerClassName={navBtnClass(active === "In Tree" || treeModalOpen)}
          triggerChildren={
            <>
              {active === "In Tree" || treeModalOpen ? (
                <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-crimson" aria-hidden />
              ) : null}
              <GitBranch className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              <span className="font-body text-[0.56rem] font-semibold uppercase tracking-[0.14em]">In tree</span>
            </>
          }
        />

        <Link
          href="#events"
          onClick={() => setActive("Events")}
          className={navBtnClass(active === "Events")}
        >
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

export function MobileIndividualProfile({
  person,
  contributionHref,
}: {
  person: PublicIndividualProfile;
  contributionHref: string;
}) {
  const parents = person.parents ?? [];
  const siblings = person.siblings ?? [];
  const partners =
    person.partners ?? person.spouses ?? (person.partner ? [person.partner] : person.spouse ? [person.spouse] : []);
  const children = person.children ?? [];
  const familiesAsChild = person.familiesAsChild ?? [];
  const familiesAsPartner = person.familiesAsPartner ?? [];
  const timeline = person.timeline ?? [];
  const notes = person.notes ?? [];
  const associates = person.associates ?? [];
  const linkedAccounts = person.linkedAccounts ?? [];
  const openQuestions = person.openQuestions ?? [];
  const hasMedia = person.photos.length > 0;
  const hasNotes = notes.length > 0;
  const hasAssociates = associates.length > 0;
  const hasResearch = openQuestions.length > 0;
  const avatarSrc = person.portraitSrc ?? person.photos[0]?.src ?? null;
  const [familyTab, setFamilyTab] = useState<FamilyTab>("child");
  const [childFamilyIdx, setChildFamilyIdx] = useState(0);
  const [partnerFamilyIdx, setPartnerFamilyIdx] = useState(0);
  const [mediaShuffleKey, setMediaShuffleKey] = useState(0);
  const pronoun = possessivePronoun(person.gender);
  const childFamilyGroups = useMemo(() => {
    if (familiesAsChild.length > 0) {
      return familiesAsChild.map((family, idx) => {
        const siblingsInGroup = (family.children ?? []).filter(
          (item) => item.id !== person.id && item.relationship !== "Profile person",
        );
        return {
          id: family.id || `child-family-${idx}`,
          tabLabel: relationSetLabel(family.parents ?? [], `Family ${idx + 1}`),
          parents: family.parents ?? [],
          siblings: siblingsInGroup,
        };
      });
    }
    return [
      {
        id: "child-fallback",
        tabLabel: "Family",
        parents,
        siblings,
      },
    ];
  }, [familiesAsChild, parents, person.id, siblings]);

  const partnerFamilyGroups = useMemo(() => {
    if (familiesAsPartner.length > 0) {
      return familiesAsPartner.map((family, idx) => ({
        id: family.id || `partner-family-${idx}`,
        tabLabel: relationSetLabel(family.partners ?? [], `Family ${idx + 1}`),
        partners: family.partners ?? [],
        children: family.children ?? [],
      }));
    }
    return [
      {
        id: "partner-fallback",
        tabLabel: "Family",
        partners,
        children,
      },
    ];
  }, [familiesAsPartner, partners, children]);

  useEffect(() => {
    setChildFamilyIdx((idx) => Math.min(Math.max(0, idx), Math.max(0, childFamilyGroups.length - 1)));
  }, [childFamilyGroups.length]);

  useEffect(() => {
    setPartnerFamilyIdx((idx) => Math.min(Math.max(0, idx), Math.max(0, partnerFamilyGroups.length - 1)));
  }, [partnerFamilyGroups.length]);

  const activeChildFamily = childFamilyGroups[Math.min(childFamilyIdx, Math.max(0, childFamilyGroups.length - 1))];
  const activePartnerFamily = partnerFamilyGroups[Math.min(partnerFamilyIdx, Math.max(0, partnerFamilyGroups.length - 1))];

  const activeChildEmpty = (activeChildFamily?.parents.length ?? 0) === 0 && (activeChildFamily?.siblings.length ?? 0) === 0;
  const activePartnerEmpty =
    (activePartnerFamily?.partners.length ?? 0) === 0 && (activePartnerFamily?.children.length ?? 0) === 0;
  const mediaAlbumHref = `/media/album-view?kind=generated&type=individual&id=${encodeURIComponent(person.id)}`;
  const mediaPreviewItems = useMemo(() => {
    if (!hasMedia) return [] as typeof person.photos;
    if (person.photos.length <= 3) return person.photos;
    const pool = [...person.photos];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }, [hasMedia, person.photos, mediaShuffleKey]);

  return (
    <div className="pb-28 text-text md:hidden">
      <section className="relative overflow-hidden pt-[calc(var(--mobile-nav-height,60px)+1.25rem)]">
        <div className="absolute inset-0" aria-hidden>
          {avatarSrc ? (
            <Image
              src={avatarSrc}
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

        <div className="relative z-10 px-4 pt-1">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex min-w-0 flex-wrap items-center gap-1.5 font-body text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            <Link href="/" className="transition hover:text-link">
              Home
            </Link>
            <span className="text-subtle">/</span>
            <Link href="/tree" className="transition hover:text-link">
              Family Tree
            </Link>
            <span className="text-subtle">/</span>
            <span className="truncate text-heading">{person.fullName}</span>
          </nav>

          <div id="overview" className="scroll-mt-[7.5rem]">
            <div className="flex items-start gap-3.5">
              <div
                className="relative aspect-square h-[92px] w-[92px] shrink-0 overflow-hidden rounded-full border-[5px] bg-surface shadow-[0_14px_34px_rgba(40,28,18,0.24)]"
                style={{ borderColor: portraitBorderColor(person.gender, person.sex) }}
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={person.fullName}
                    fill
                    priority
                    className="object-cover sepia-[0.22]"
                    sizes="92px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-surface-elevated font-heading text-2xl font-semibold text-link">
                    {initials(person.fullName)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pl-2 pt-1 sm:pl-3">
                <h1 className="mt-1 font-heading text-2xl font-semibold leading-[1.12] tracking-[-0.015em] text-heading">
                  {person.fullName}
                </h1>
                <p className="mt-1 font-body text-[0.94rem] leading-snug text-link">{mobileLifeLine(person)}</p>
                {linkedAccounts.length > 0 ? (
                  <p className="mt-1.5 line-clamp-2 font-body text-xs leading-relaxed text-muted">
                    {linkedAccounts.map((account) => `@${account.username}`).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mb-7 mt-4 rounded-xl border border-border-subtle bg-surface/90 p-3 shadow-[0_10px_24px_rgba(60,45,25,0.12)]">
              <div className="grid grid-cols-4 gap-1 text-center">
                {(
                  [
                    {
                      label: "Age",
                      icon: CalendarDays,
                      sub: person.age != null ? `${person.age} years` : "Unknown",
                    },
                    {
                      label: "Born",
                      icon: Baby,
                      sub: person.birthPlace?.split(",").pop()?.trim() ?? person.birthPlace ?? "—",
                    },
                    {
                      label: "Died",
                      icon: CalendarDays,
                      sub: person.deathYear
                        ? person.deathPlace?.split(",").pop()?.trim() ?? "Recorded"
                        : "Living",
                    },
                    {
                      label: "Children",
                      icon: UsersRound,
                      sub: children.length > 0 ? `${children.length} total` : "0 total",
                    },
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
          </div>
        </div>
      </section>


      <section id="family" className="scroll-mt-[7.5rem] px-4 py-8">
        <div className="text-center">
          <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Family</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Closest Relations</h2>
          <p className="mt-1 font-body text-sm leading-relaxed text-muted">The people who shaped {pronoun} life.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFamilyTab("child")}
            aria-pressed={familyTab === "child"}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition",
              familyTab === "child"
                ? "border border-crimson bg-surface-elevated shadow-[0_4px_14px_rgba(60,45,25,0.08)]"
                : "border border-transparent bg-surface-inset/80",
            )}
          >
            <FamilyTabIcon icon={Home} />
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-sm font-semibold leading-snug text-heading">Parents & Siblings</span>
              <span className="mt-1 block font-body text-xs leading-snug text-muted">
                {parents.length} {parents.length === 1 ? "parent" : "parents"} · {siblings.length}{" "}
                {siblings.length === 1 ? "sibling" : "siblings"}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFamilyTab("partner")}
            aria-pressed={familyTab === "partner"}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-3 text-left transition",
              familyTab === "partner"
                ? "border border-crimson bg-surface-elevated shadow-[0_4px_14px_rgba(60,45,25,0.08)]"
                : "border border-transparent bg-surface-inset/80",
            )}
          >
            <FamilyTabIcon icon={Heart} />
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-sm font-semibold leading-snug text-heading">Partner(s) & Children</span>
              <span className="mt-1 block font-body text-xs leading-snug text-muted">
                {partners.length} {partners.length === 1 ? "partner" : "partners"} · {children.length}{" "}
                {children.length === 1 ? "child" : "children"}
              </span>
            </span>
          </button>
        </div>

        <div className="mt-4">
          {familyTab === "child" ? (
            <>
              {childFamilyGroups.length > 1 ? (
                <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {childFamilyGroups.map((group, idx) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setChildFamilyIdx(idx)}
                      aria-pressed={idx === childFamilyIdx}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition",
                        idx === childFamilyIdx
                          ? "border-crimson bg-surface-elevated text-crimson"
                          : "border-border-subtle bg-surface text-muted hover:bg-surface-elevated",
                      )}
                      title={group.tabLabel}
                    >
                      {group.tabLabel}
                    </button>
                  ))}
                </div>
              ) : null}
              <RelationsGroup label="Parents" items={activeChildFamily?.parents ?? []} />
              <RelationsGroup label="Siblings" items={activeChildFamily?.siblings ?? []} />
              {activeChildEmpty ? (
                <p className="mt-4 rounded-xl border border-dashed border-border-subtle bg-surface/70 px-4 py-6 text-center font-body text-sm leading-relaxed text-muted">
                  No parents or siblings recorded yet.
                </p>
              ) : null}
            </>
          ) : (
            <>
              {partnerFamilyGroups.length > 1 ? (
                <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {partnerFamilyGroups.map((group, idx) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setPartnerFamilyIdx(idx)}
                      aria-pressed={idx === partnerFamilyIdx}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition",
                        idx === partnerFamilyIdx
                          ? "border-crimson bg-surface-elevated text-crimson"
                          : "border-border-subtle bg-surface text-muted hover:bg-surface-elevated",
                      )}
                      title={group.tabLabel}
                    >
                      {group.tabLabel}
                    </button>
                  ))}
                </div>
              ) : null}
              {activePartnerEmpty ? (
                <p className="mt-4 rounded-xl border border-dashed border-border-subtle bg-surface/70 px-4 py-6 text-center font-body text-sm leading-relaxed text-muted">
                  No partner or children recorded yet.
                </p>
              ) : (
                <>
                  <RelationsGroup
                    label={(activePartnerFamily?.partners.length ?? 0) === 1 ? "Partner" : "Partners"}
                    items={activePartnerFamily?.partners ?? []}
                  />
                  <RelationsGroup label="Children" items={activePartnerFamily?.children ?? []} />
                </>
              )}
            </>
          )}
        </div>
      </section>

      {hasAssociates ? (
        <section id="associates" className="scroll-mt-[7.5rem] border-t border-border-subtle px-4 py-8">
          <RelationsGroup
            label="Other associations"
            items={associates}
            relationSuffix={(item) => ("relationLabel" in item ? item.relationLabel : null)}
          />
        </section>
      ) : null}

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


      {hasMedia ? (
        <section id="media" className="scroll-mt-[7.5rem] px-4 py-8">
          <div className="text-center">
            <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Media</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Family album</h2>
          </div>
          <p className="mt-3 text-center font-body text-xs text-muted">
            Showing 3 random photos. Tap randomize to see a different set.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setMediaShuffleKey((k) => k + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Randomize
            </button>
            <Link
              href={mediaAlbumHref}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
            >
              <Library className="h-3.5 w-3.5" aria-hidden />
              Open album
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-3 gap-1.5">
            {mediaPreviewItems.map((photo) => (
              <li key={photo.id}>
                <Link
                  href={`/media/${encodeURIComponent(photo.id)}`}
                  className="relative block aspect-square overflow-hidden rounded-sm bg-surface-inset"
                >
                  <Image
                    src={photo.src}
                    alt={photo.title || person.fullName}
                    fill
                    className="object-cover sepia-[0.2]"
                    sizes="33vw"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        id="charts"
        className="scroll-mt-[7.5rem] border-y border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--link)_7%,var(--bg)),color-mix(in_srgb,var(--link)_3%,var(--bg)))] px-4 py-8"
      >
        <div className="text-center">
          <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Tree</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Charts</h2>
          <p className="mx-auto mt-3 max-w-md font-body text-xs leading-relaxed text-muted">
            Choose a chart below to explore {person.fullName.split(" ")[0] || "this person"}&apos;s place in the tree —
            their descendants, their ancestors, or both in the layout that feels right to you.
          </p>
        </div>
        <div className="mt-6">
          <ProfileCharts xref={person.xref} fullName={person.fullName} />
        </div>
      </section>

      {hasNotes ? <MobileProfileNotes notes={notes} subjectName={person.fullName} /> : null}

      {hasResearch ? (
        <section id="open-questions" className="scroll-mt-[7.5rem] border-t border-border-subtle px-4 py-8">
          <div className="text-center">
            <p className="font-body text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-crimson">Research</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold leading-tight text-heading">Open questions</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {openQuestions.map((q) => (
              <li key={q.id} className="rounded-xl border border-border-subtle bg-surface-elevated p-4">
                <p className="font-heading text-base font-semibold text-heading">{q.question}</p>
                {q.details ? <p className="mt-1 text-sm text-muted">{q.details}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="px-4 pb-4 pt-2">
        <Link
          href={contributionHref}
          className="flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-link px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          Contribute
        </Link>
      </div>

      <MobileBottomBar
        person={person}
        contributionHref={contributionHref}
        avatarSrc={avatarSrc}
        hasAssociates={hasAssociates}
        hasNotes={hasNotes}
        hasMedia={hasMedia}
        hasResearch={hasResearch}
      />
    </div>
  );
}
