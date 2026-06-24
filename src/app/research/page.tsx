import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  Building2,
  Dna,
  ListChecks,
  Search,
} from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { Section, PageContainer } from "@/components/wireframe";
import { SITE_NAV_GROUPS } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navConfig";
import { resolveNavIcon } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navIcons";
import { loadPublicOpenQuestions, type PublicOpenQuestion } from "@/lib/research/load-public-open-questions";
import { loadPublicSources, type PublicSource } from "@/lib/research/load-public-sources";
import { sourceDisplayLabel } from "@/components/research/source-label";
import { OpenQuestionCard } from "@/components/research/OpenQuestionCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research · The Gonsalves Family",
  description: "Open questions, sources, repositories, statistics, and analytics search for the published family tree.",
};

const HERO_IMAGE = "/images/oldMapBackground.png";
const HERO_FEATURE_IMAGE = "/images/searchHeader.png";

/** Lucide icon for each Research nav item, keyed by its navConfig icon key. */
const RESEARCH_ICONS: Record<string, typeof ListChecks> = {
  "list-checks": ListChecks,
  "book-marked": BookMarked,
  building: Building2,
  "bar-chart": BarChart3,
  search: Search,
  dna: Dna,
};

/** Section cards are driven from the Research menu group so the hub stays in sync with the nav. */
const RESEARCH_SECTIONS = SITE_NAV_GROUPS.find((g) => g.id === "research")?.items ?? [];

function SpotlightHeading({
  eyebrow,
  title,
  seeAllHref,
  seeAllLabel,
}: {
  eyebrow: string;
  title: string;
  seeAllHref: string;
  seeAllLabel: string;
}) {
  return (
    <div className="mb-6 flex min-w-0 items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="section-subtitle">{eyebrow}</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          {title}
        </h2>
        <div className="mt-3 h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
      </div>
      <Link
        href={seeAllHref}
        className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-link sm:inline-flex"
      >
        {seeAllLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function SourceCard({ source }: { source: PublicSource }) {
  const title = sourceDisplayLabel(source);
  const subtitle = [source.author?.trim(), source.publication?.trim()].filter(Boolean).join(" · ");

  return (
    <Link
      href="/research/sources"
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
    >
      <div className="flex min-h-[7.5rem] flex-1 flex-col gap-3 p-5">
        <BookMarked className="h-7 w-7 shrink-0 text-link" strokeWidth={1.8} aria-hidden />
        <h3 className="break-words font-heading text-lg font-semibold leading-snug text-heading line-clamp-2">
          {title}
        </h3>
        {subtitle ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{subtitle}</p>
        ) : (
          <p className="text-xs text-muted">Citation in the published tree</p>
        )}
      </div>
    </Link>
  );
}

export default async function ResearchHubPage() {
  let openQuestions: PublicOpenQuestion[] = [];
  let sources: PublicSource[] = [];
  try {
    [openQuestions, sources] = await Promise.all([
      loadPublicOpenQuestions().then((items) => items.slice(0, 3)),
      loadPublicSources().then((items) => items.slice(0, 3)),
    ]);
  } catch {
    openQuestions = [];
    sources = [];
  }

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        {/* Hero */}
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src={HERO_IMAGE} alt="" fill priority className="object-cover object-center opacity-90 sepia-[0.18]" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted">
                  <Link href="/" className="min-w-0 shrink transition hover:text-link">
                    Home
                  </Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <span className="min-w-0 text-heading">Research</span>
                </nav>

                <p className="section-subtitle">Research &amp; Evidence</p>

                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  Explore the <span className="italic">research</span>
                </h1>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                  Open questions, sources, repositories, statistics, and analytics — evidence and gaps in the
                  published family tree, all in one place.
                </p>

                <div className="pt-1">
                  <Link
                    href="/research/open-questions"
                    className="inline-flex items-center gap-2 rounded-xl bg-link px-6 py-3.5 font-body text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px"
                  >
                    Browse open questions
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        {/* Start here — feature band into open questions. */}
        <Section noPadding className="min-w-0 overflow-x-hidden pt-8 pb-6 md:pt-10 md:pb-8">
          <PageContainer narrow>
            <Link
              href="/research/open-questions"
              aria-label="Browse unresolved research questions in the published tree"
              className="group relative flex min-h-[236px] min-w-0 items-center overflow-hidden rounded-[18px] border border-[rgba(42,40,32,0.18)] shadow-[0_14px_36px_rgba(42,32,16,0.18)]"
            >
              <Image
                src={HERO_FEATURE_IMAGE}
                alt=""
                fill
                aria-hidden
                sizes="(max-width: 760px) 100vw, 1100px"
                className="object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{ background: "linear-gradient(135deg, rgba(120,96,58,0.28), rgba(60,44,22,0.42))" }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{ background: "linear-gradient(90deg, rgba(34,24,11,0.82), rgba(34,24,11,0.40) 55%, rgba(34,24,11,0.05))" }}
                aria-hidden
              />

              <div className="relative z-[2] max-w-[600px] px-[26px] py-[28px] sm:px-[42px] sm:py-[34px]">
                <p className="font-body text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#e8bca2]">
                  Start here
                </p>
                <h2 className="mt-3 font-heading text-[28px] font-medium leading-[1.04] tracking-[-0.015em] text-[#f7efdc] sm:text-[34px]">
                  Open questions
                </h2>
                <p className="mt-[9px] max-w-[46ch] font-body text-[15px] leading-[1.6] text-[rgba(247,239,220,0.82)]">
                  Unresolved items that still need verification, sources, or clarification in the published tree.
                </p>
                <span className="mt-[22px] inline-flex items-center gap-[9px] rounded-[11px] bg-[#f4ecd8] px-6 py-3.5 font-body text-[14.5px] font-semibold text-[#244730] shadow-sm transition duration-200 group-hover:-translate-y-px group-hover:bg-white">
                  View open questions
                  <ArrowRight className="h-[18px] w-[18px] transition duration-200 group-hover:translate-x-[3px]" aria-hidden />
                </span>
              </div>
            </Link>
          </PageContainer>
        </Section>

        {/* Section grid — one card per Research menu item */}
        <Section noPadding className="min-w-0 overflow-x-hidden pb-8 md:pb-10">
          <PageContainer narrow>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {RESEARCH_SECTIONS.map((item) => {
                const Icon = RESEARCH_ICONS[item.icon] ?? resolveNavIcon(item.icon);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-w-0 flex-col rounded-2xl border border-border/80 bg-surface-elevated p-6 shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
                  >
                    <Icon className="h-7 w-7 text-link" strokeWidth={1.8} aria-hidden />
                    <h2 className="mt-4 font-heading text-xl font-semibold text-heading">{item.label}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-link">
                      Open {item.label}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </PageContainer>
        </Section>

        {/* Spotlight — Open questions */}
        {openQuestions.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-10 md:pb-12">
            <PageContainer narrow>
              <SpotlightHeading
                eyebrow="Spotlight"
                title="Open questions"
                seeAllHref="/research/open-questions"
                seeAllLabel="See all questions"
              />
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {openQuestions.map((question) => (
                  <OpenQuestionCard key={question.id} question={question} />
                ))}
              </div>
            </PageContainer>
          </Section>
        )}

        {/* Spotlight — Sources */}
        {sources.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-12 md:pb-16">
            <PageContainer narrow>
              <SpotlightHeading
                eyebrow="Spotlight"
                title="Sources"
                seeAllHref="/research/sources"
                seeAllLabel="See all sources"
              />
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </PageContainer>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}
