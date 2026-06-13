import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper, Languages, Feather, Utensils } from "lucide-react";
import { StoryKind } from "@ligneous/prisma";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { Section, PageContainer } from "@/components/wireframe";
import { StoryCard } from "@/components/stories/StoryCard";
import { fetchPublishedStoriesList, type StoryListItem } from "@/lib/stories/story-queries";
import { SITE_NAV_GROUPS } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navConfig";

export const metadata = {
  title: "Explore Culture · The Gonsalves Family",
  description:
    "Explore our family's culture and heritage — articles, language, folklore, and recipes passed down through generations.",
};

/** Feature-band background (archival, articles-themed). Swap freely. */
const EXPLORE_BAND_PHOTO = "/images/storiesArticlesCover.png";

/** Lucide icon for each Culture nav item, keyed by its navConfig icon key. */
const CULTURE_ICONS: Record<string, typeof Newspaper> = {
  newspaper: Newspaper,
  languages: Languages,
  feather: Feather,
  utensils: Utensils,
};

/** Section cards are driven from the Culture menu group so the hub stays in
 *  sync with the nav. */
const CULTURE_SECTIONS = SITE_NAV_GROUPS.find((g) => g.id === "culture")?.items ?? [];

export default async function ExploreCulturePage() {
  let latestArticles: StoryListItem[] = [];
  try {
    latestArticles = (
      await fetchPublishedStoriesList([StoryKind.article, StoryKind.post])
    ).slice(0, 3);
  } catch {
    latestArticles = [];
  }

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        {/* Hero */}
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src={EXPLORE_BAND_PHOTO} alt="" fill priority className="object-cover md:hidden" sizes="100vw" />
            <Image src={EXPLORE_BAND_PHOTO} alt="" fill priority className="hidden object-cover md:block" sizes="100vw" />
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
                  <span className="min-w-0 text-heading">Culture</span>
                </nav>

                <p className="section-subtitle">Culture &amp; Heritage</p>

                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  Explore our <span className="italic">culture</span>
                </h1>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                  The articles, language, folklore, and food that carry our family&apos;s
                  heritage across generations.
                </p>

                <div className="pt-1">
                  <Link
                    href="/culture/articles"
                    className="inline-flex items-center gap-2 rounded-xl bg-link px-6 py-3.5 font-body text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px"
                  >
                    Start reading
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        {/* Start here — sepia feature band into Articles, the section with the
            most published content today. */}
        <Section noPadding className="min-w-0 overflow-x-hidden pt-8 pb-6 md:pt-10 md:pb-8">
          <PageContainer narrow>
            <Link
              href="/culture/articles"
              aria-label="Read the family's articles and essays"
              className="group relative flex min-h-[236px] min-w-0 items-center overflow-hidden rounded-[18px] border border-[rgba(42,40,32,0.18)] shadow-[0_14px_36px_rgba(42,32,16,0.18)]"
            >
              {/* Archival photo layer (swap EXPLORE_BAND_PHOTO to change it). */}
              <Image
                src={EXPLORE_BAND_PHOTO}
                alt=""
                fill
                aria-hidden
                sizes="(max-width: 760px) 100vw, 1100px"
                className="object-cover object-center"
              />
              {/* Sepia wash over the photo. */}
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(120,96,58,0.28), rgba(60,44,22,0.42))",
                }}
                aria-hidden
              />
              {/* Left-to-right darkening veil for legibility. */}
              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(34,24,11,0.82), rgba(34,24,11,0.40) 55%, rgba(34,24,11,0.05))",
                }}
                aria-hidden
              />

              {/* Text block */}
              <div className="relative z-[2] max-w-[600px] px-[26px] py-[28px] sm:px-[42px] sm:py-[34px]">
                <p className="font-body text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#e8bca2]">
                  Start here
                </p>
                <h2 className="mt-3 font-heading text-[28px] font-medium leading-[1.04] tracking-[-0.015em] text-[#f7efdc] sm:text-[34px]">
                  Articles &amp; essays
                </h2>
                <p className="mt-[9px] max-w-[46ch] font-body text-[15px] leading-[1.6] text-[rgba(247,239,220,0.82)]">
                  In-depth pieces on the history, communities, and traditions that shaped our family.
                </p>
                <span className="mt-[22px] inline-flex items-center gap-[9px] rounded-[11px] bg-[#f4ecd8] px-6 py-3.5 font-body text-[14.5px] font-semibold text-[#244730] shadow-sm transition duration-200 group-hover:-translate-y-px group-hover:bg-white">
                  Read the articles
                  <ArrowRight className="h-[18px] w-[18px] transition duration-200 group-hover:translate-x-[3px]" aria-hidden />
                </span>
              </div>
            </Link>
          </PageContainer>
        </Section>

        {/* Section grid — one card per Culture menu item */}
        <Section noPadding className="min-w-0 overflow-x-hidden pb-8 md:pb-10">
          <PageContainer narrow>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              {CULTURE_SECTIONS.map((item) => {
                const Icon = CULTURE_ICONS[item.icon] ?? Newspaper;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-w-0 flex-col rounded-2xl border border-border/80 bg-surface-elevated p-6 shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
                  >
                    <Icon className="h-7 w-7 text-link" strokeWidth={1.8} aria-hidden />
                    <h2 className="mt-4 font-heading text-2xl font-semibold text-heading">
                      {item.label}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-link">
                      Explore {item.label}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </PageContainer>
        </Section>

        {/* Spotlight — latest articles */}
        {latestArticles.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-12 md:pb-16">
            <PageContainer narrow>
              <div className="mb-6 flex min-w-0 items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="section-subtitle">Spotlight</p>
                  <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
                    Latest articles
                  </h2>
                  <div className="mt-3 h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
                </div>
                <Link
                  href="/culture/articles"
                  className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-link sm:inline-flex"
                >
                  See all articles
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {latestArticles.map((story) => (
                  <StoryCard key={story.id} story={story} />
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
