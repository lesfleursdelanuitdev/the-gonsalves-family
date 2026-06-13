import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Images,
  LayoutGrid,
  Music,
  ScrollText,
  Sparkles,
  Video,
} from "lucide-react";
import { StoryKind } from "@ligneous/prisma";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { Section, PageContainer } from "@/components/wireframe";
import { StoryCard } from "@/components/stories/StoryCard";
import { fetchPublishedStoriesList, type StoryListItem } from "@/lib/stories/story-queries";
import { SITE_NAV_GROUPS } from "@/components/homepage/HeroAndMenu/Navbar/site-nav/navConfig";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { loadPublicAlbumsPageData } from "@/lib/album/load-public-albums-page-data";
import type {
  CuratedAlbum,
  GeneratedAlbum,
  PublicAlbumsPageData,
} from "@/lib/album/public-albums-page-types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Family Archive · The Gonsalves Family",
  description:
    "Albums, scrapbooks, stories, photos, documents, and recordings from the family's collected history.",
};

const HERO_DESKTOP_PHOTO = "/images/albumsCoverImage.png";
const HERO_MOBILE_PHOTO = "/images/albumsCoverImageMobile.png";

/** Lucide icon for each Archive nav item, keyed by its navConfig icon key. */
const ARCHIVE_ICONS: Record<string, typeof BookOpen> = {
  "book-open": BookOpen,
  "layout-grid": LayoutGrid,
  "file-text": FileText,
  sparkles: Sparkles,
  images: Images,
  "scroll-text": ScrollText,
  music: Music,
  video: Video,
};

/** Section cards are driven from the Archive menu group so the hub stays in sync with the nav. */
const ARCHIVE_SECTIONS = SITE_NAV_GROUPS.find((g) => g.id === "archive")?.items ?? [];

const EMPTY_ALBUMS_DATA: PublicAlbumsPageData = {
  curatedAlbums: [],
  generatedIndividualAlbums: [],
  generatedFamilyAlbums: [],
  generatedEventAlbums: [],
  generatedPlaceAlbums: [],
  generatedDateAlbums: [],
  generatedTagAlbums: [],
};

/** Interleave the six scrapbook categories so the spotlight shows a mixed sample. */
function mixedScrapbooks(data: PublicAlbumsPageData, limit: number): GeneratedAlbum[] {
  const categories = [
    data.generatedIndividualAlbums,
    data.generatedPlaceAlbums,
    data.generatedEventAlbums,
    data.generatedFamilyAlbums,
    data.generatedDateAlbums,
    data.generatedTagAlbums,
  ];
  const out: GeneratedAlbum[] = [];
  const maxLen = categories.reduce((m, c) => Math.max(m, c.length), 0);
  for (let i = 0; i < maxLen && out.length < limit; i++) {
    for (const cat of categories) {
      if (cat[i]) {
        out.push(cat[i]);
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

function SpotlightHeading({ eyebrow, title, seeAllHref, seeAllLabel }: {
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

function AlbumCard({ album }: { album: CuratedAlbum }) {
  return (
    <Link
      href={`/media/album/${encodeURIComponent(album.id)}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {album.coverSrc?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverSrc}
            alt={album.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1ead9,#e6dcc6)]">
            <LayoutGrid className="h-12 w-12 text-link/60" strokeWidth={1.4} aria-hidden />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <h3 className="break-words font-heading text-lg font-semibold leading-tight text-heading">
          {album.title}
        </h3>
        {album.description?.trim() ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{album.description}</p>
        ) : null}
      </div>
    </Link>
  );
}

function ScrapbookCard({ album }: { album: GeneratedAlbum }) {
  return (
    <Link
      href={album.href}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {album.thumbSrc?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.thumbSrc}
            alt={album.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f1ead9,#e6dcc6)]">
            <Sparkles className="h-12 w-12 text-link/60" strokeWidth={1.4} aria-hidden />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <h3 className="break-words font-heading text-base font-semibold leading-tight text-heading">
          {album.title}
        </h3>
        <p className="text-xs text-muted">
          {album.photoCount} {album.photoCount === 1 ? "item" : "items"}
        </p>
      </div>
    </Link>
  );
}

export default async function FamilyArchivePage() {
  const fileUuid = await resolveTreeFileUuid();

  let albumsData: PublicAlbumsPageData = EMPTY_ALBUMS_DATA;
  let latestStories: StoryListItem[] = [];
  try {
    [albumsData, latestStories] = await Promise.all([
      fileUuid ? loadPublicAlbumsPageData(prisma, fileUuid) : Promise.resolve(EMPTY_ALBUMS_DATA),
      fetchPublishedStoriesList([StoryKind.story, StoryKind.folklore]).then((s) => s.slice(0, 3)),
    ]);
  } catch {
    albumsData = EMPTY_ALBUMS_DATA;
    latestStories = [];
  }

  const albums = albumsData.curatedAlbums.slice(0, 3);
  const scrapbooks = mixedScrapbooks(albumsData, 6);

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        {/* Hero */}
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src={HERO_MOBILE_PHOTO} alt="" fill priority className="object-cover md:hidden" sizes="100vw" />
            <Image src={HERO_DESKTOP_PHOTO} alt="" fill priority className="hidden object-cover md:block" sizes="100vw" />
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
                  <span className="min-w-0 text-heading">Archive</span>
                </nav>

                <p className="section-subtitle">Family Archive</p>

                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  Explore the <span className="italic">archive</span>
                </h1>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                  Albums, scrapbooks, stories, photos, documents, and recordings — the family&apos;s
                  collected history, all in one place.
                </p>

                <div className="pt-1">
                  <Link
                    href="/media"
                    className="inline-flex items-center gap-2 rounded-xl bg-link px-6 py-3.5 font-body text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-px"
                  >
                    Browse albums &amp; scrapbooks
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        {/* Start here — sepia feature band into the Media library. */}
        <Section noPadding className="min-w-0 overflow-x-hidden pt-8 pb-6 md:pt-10 md:pb-8">
          <PageContainer narrow>
            <Link
              href="/media"
              aria-label="Browse the family's albums and scrapbooks in the Media library"
              className="group relative flex min-h-[236px] min-w-0 items-center overflow-hidden rounded-[18px] border border-[rgba(42,40,32,0.18)] shadow-[0_14px_36px_rgba(42,32,16,0.18)]"
            >
              <Image
                src={HERO_DESKTOP_PHOTO}
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
                  Albums &amp; scrapbooks
                </h2>
                <p className="mt-[9px] max-w-[46ch] font-body text-[15px] leading-[1.6] text-[rgba(247,239,220,0.82)]">
                  Browse curated albums and the auto-generated scrapbooks built from people, places, and events.
                </p>
                <span className="mt-[22px] inline-flex items-center gap-[9px] rounded-[11px] bg-[#f4ecd8] px-6 py-3.5 font-body text-[14.5px] font-semibold text-[#244730] shadow-sm transition duration-200 group-hover:-translate-y-px group-hover:bg-white">
                  Open the media library
                  <ArrowRight className="h-[18px] w-[18px] transition duration-200 group-hover:translate-x-[3px]" aria-hidden />
                </span>
              </div>
            </Link>
          </PageContainer>
        </Section>

        {/* Section grid — one card per Archive menu item */}
        <Section noPadding className="min-w-0 overflow-x-hidden pb-8 md:pb-10">
          <PageContainer narrow>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {ARCHIVE_SECTIONS.map((item) => {
                const Icon = ARCHIVE_ICONS[item.icon] ?? BookOpen;
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

        {/* Spotlight — Albums */}
        {albums.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-10 md:pb-12">
            <PageContainer narrow>
              <SpotlightHeading eyebrow="Spotlight" title="Albums" seeAllHref="/media" seeAllLabel="See all albums" />
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </PageContainer>
          </Section>
        )}

        {/* Spotlight — Scrapbooks (generated albums) */}
        {scrapbooks.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-10 md:pb-12">
            <PageContainer narrow>
              <SpotlightHeading eyebrow="Spotlight" title="Scrapbooks" seeAllHref="/media" seeAllLabel="See all scrapbooks" />
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {scrapbooks.map((album) => (
                  <ScrapbookCard key={album.id} album={album} />
                ))}
              </div>
            </PageContainer>
          </Section>
        )}

        {/* Spotlight — Stories */}
        {latestStories.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-12 md:pb-16">
            <PageContainer narrow>
              <SpotlightHeading eyebrow="Spotlight" title="Stories" seeAllHref="/stories" seeAllLabel="See all stories" />
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {latestStories.map((story) => (
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
