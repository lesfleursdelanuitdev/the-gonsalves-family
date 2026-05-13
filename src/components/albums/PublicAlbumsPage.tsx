import Image from "next/image";
import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, Eye, Leaf, MapPin, Sparkles, Tag, UsersRound } from "lucide-react";
import { Footer } from "@/components/homepage";
import { PageContainer, Section } from "@/components/wireframe";
import type { MediaHubCollectionId } from "@/lib/media/media-hub-collection";
import type { CuratedAlbum, GeneratedAlbum, PublicAlbumsPageData } from "./albums-data";
import { MediaHubCollectionTabs, MediaHubGenerateAlbumPill } from "./MediaHubCollectionTabs";

const MEDIA_HUB = "/media";
const FALLBACK_COVER = "/images/oldMapBackground.png";

type GeneratedAlbumCategory = {
  title: string;
  icon: typeof BookOpen;
  items: GeneratedAlbum[];
};

function isRemoteImageSrc(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}

function CuratedAlbumCard({ album }: { album: CuratedAlbum }) {
  return (
    <article className="group min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div className="relative aspect-[16/10] max-w-full overflow-hidden">
        <Image
          src={album.coverSrc?.trim() ? album.coverSrc : FALLBACK_COVER}
          alt={album.title}
          fill
          unoptimized={isRemoteImageSrc(album.coverSrc?.trim() ? album.coverSrc : FALLBACK_COVER)}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" />
      </div>
      <div className="min-w-0 space-y-3 p-4 sm:p-5">
        <h3 className="break-words font-heading text-xl font-semibold leading-tight text-heading text-balance sm:text-2xl md:text-[1.75rem]">
          {album.title}
        </h3>
        <p className="min-h-12 break-words text-sm leading-relaxed text-muted">{album.description}</p>
        <Link
          href={`${MEDIA_HUB}/album/${encodeURIComponent(album.id)}`}
          className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-medium text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg sm:inline-flex sm:w-auto"
        >
          <Eye size={15} aria-hidden />
          <span>View Album</span>
        </Link>
      </div>
    </article>
  );
}

function GeneratedAlbumList({
  title,
  items,
}: {
  title: string;
  items: GeneratedAlbum[];
}) {
  return (
    <section className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated p-3 shadow-[0_6px_20px_rgba(60,45,25,0.06)] sm:p-4">
      <div className="border-b border-border-subtle pb-3">
        <h3 className="min-w-0 font-heading text-lg font-semibold leading-snug text-heading sm:text-xl">
          {title}
        </h3>
      </div>
      <ul className="min-w-0 space-y-2.5">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-3 py-6 text-center text-sm text-muted">
            No albums with linked media yet.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border-subtle/70 bg-surface p-2.5 transition hover:bg-surface-elevated"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-subtle/70">
                    <Image
                      src={item.thumbSrc?.trim() ? item.thumbSrc : FALLBACK_COVER}
                      alt={item.title}
                      fill
                      unoptimized={isRemoteImageSrc(item.thumbSrc?.trim() ? item.thumbSrc : FALLBACK_COVER)}
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-heading text-base font-medium leading-snug text-heading">{item.title}</p>
                    <p className="text-sm text-muted">{item.photoCount} photos</p>
                  </div>
                </div>
                <Link
                  href={item.href}
                  className="inline-flex w-full shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-elevated px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg sm:w-auto sm:py-1.5"
                >
                  View scrapbook
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

function MobileGeneratedAlbumRow({ item }: { item: GeneratedAlbum }) {
  return (
    <Link href={item.href} className="group flex min-w-0 items-center gap-3 py-2.5">
      <span className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border-subtle/70 bg-surface">
        <Image
          src={item.thumbSrc?.trim() ? item.thumbSrc : FALLBACK_COVER}
          alt=""
          fill
          unoptimized={isRemoteImageSrc(item.thumbSrc?.trim() ? item.thumbSrc : FALLBACK_COVER)}
          className="object-cover sepia-[0.12]"
          sizes="72px"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-base font-semibold leading-snug text-heading group-hover:text-link">
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
          {itemCountLabel(item.photoCount)} <span aria-hidden>•</span> Generated scrapbook
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted/75 transition group-hover:translate-x-0.5 group-hover:text-link" aria-hidden />
    </Link>
  );
}

function MobileGeneratedAlbumCategory({ category }: { category: GeneratedAlbumCategory }) {
  const Icon = category.icon;
  if (category.items.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-link/15 bg-link-soft-bg/55 text-link">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="truncate font-heading text-base font-semibold text-heading">{category.title}</h3>
        </div>
      </div>
      <div className="divide-y divide-border-subtle/60 border-y border-border-subtle/60">
        {category.items.map((item) => (
          <MobileGeneratedAlbumRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function MobileGeneratedScrapbooks({ categories }: { categories: GeneratedAlbumCategory[] }) {
  return (
    <div className="rounded-[1.75rem] border border-border-subtle/80 bg-surface/92 p-5 shadow-[0_16px_34px_rgba(60,45,25,0.12)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">
            Generated Collections
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold leading-tight text-heading">
            Selected Generated Scrapbooks
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            These examples show how the scrapbook generator can gather family media into a living gallery from
            people, families, places, dates, tags, and events in the tree. Use the scrapbook generator to create
            one of your own.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-link-soft-bg/35 text-link shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <Link
        href="/scrapbook-generator"
        className="mb-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-link px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-[0_10px_20px_rgba(31,90,56,0.18)] transition hover:bg-link-hover"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        Generate a scrapbook
      </Link>

      <div className="space-y-7">
        {categories.map((category) => (
          <MobileGeneratedAlbumCategory key={category.title} category={category} />
        ))}
      </div>

      <p className="mt-7 flex items-start gap-3 rounded-2xl bg-link-soft-bg/45 px-4 py-3 text-xs leading-relaxed text-muted">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-link/15 bg-surface/70 text-link">
          <Leaf className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>Scrapbooks are generated automatically and may be updated as new media is added.</span>
      </p>
    </div>
  );
}

export type PublicAlbumsPageProps = {
  data: PublicAlbumsPageData;
  activeCollection: MediaHubCollectionId;
};

export function PublicAlbumsPage({ data, activeCollection }: PublicAlbumsPageProps) {
  const {
    curatedAlbums,
    generatedIndividualAlbums,
    generatedFamilyAlbums,
    generatedEventAlbums,
    generatedPlaceAlbums,
    generatedDateAlbums,
    generatedTagAlbums,
  } = data;
  const generatedAlbumCategories: GeneratedAlbumCategory[] = [
    { title: "Generated from Places", icon: MapPin, items: generatedPlaceAlbums },
    { title: "Generated from Dates", icon: CalendarDays, items: generatedDateAlbums },
    { title: "Generated from People", icon: UsersRound, items: generatedIndividualAlbums },
    { title: "Generated from Families", icon: UsersRound, items: generatedFamilyAlbums },
    { title: "Generated from Tags", icon: Tag, items: generatedTagAlbums },
    { title: "Generated from Events", icon: BookOpen, items: generatedEventAlbums },
  ];

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section className="relative min-w-0 overflow-x-hidden pb-12 pt-28 md:pb-16 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src="/images/albumsCoverImageMobile.png"
              alt=""
              fill
              priority
              className="object-cover md:hidden"
              sizes="100vw"
            />
            <Image
              src="/images/albumsCoverImage.png"
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
              <div className="min-w-0 max-w-full space-y-5 sm:space-y-6">
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
                  <span className="min-w-0 text-heading">Media</span>
                </nav>
                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  Media
                </h1>
                <div className="max-w-2xl rounded-2xl border border-white/[0.08] bg-bg/14 px-5 py-4 backdrop-blur-[4px] [-webkit-backdrop-filter:blur(4px)] sm:px-6 sm:py-5 md:bg-bg/11">
                  <p className="text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                    Explore our family&apos;s memories through curated albums and automatically generated
                    collections built from our family tree. The images and recordings you meet here already lean
                    on the people we honor, the events we revisit, the dates that mark a life, and the places
                    that still feel like home—so when you are ready, those same gentle threads can become a new
                    album to share with the people you love.
                  </p>
                </div>

                <div className="min-w-0 max-w-full pt-5 sm:pt-6">
                  <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    Browse by type
                  </p>
                  <MediaHubCollectionTabs active={activeCollection} />
                  <p className="mb-3 mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted sm:mt-5">
                    Quick links
                  </p>
                  <div className="flex min-w-0">
                    <MediaHubGenerateAlbumPill />
                  </div>
                  {activeCollection !== "mixed" ? (
                    <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted sm:text-sm">
                      Filtered views for this type are not live yet. You&apos;re still seeing the full mixed
                      library.
                    </p>
                  ) : null}
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section className="min-w-0 overflow-x-hidden py-10 md:py-16">
          <PageContainer narrow>
            <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface/80 p-4 shadow-[0_10px_26px_rgba(60,45,25,0.06)] sm:p-5 md:p-7">
              <div
                id="curated-albums"
                className="mb-5 flex min-w-0 flex-col gap-3 scroll-mt-24 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <h2 className="min-w-0 font-heading text-2xl font-semibold leading-tight text-heading sm:text-3xl">
                  Curated Albums
                </h2>
                <Link
                  href={`${MEDIA_HUB}#curated-albums`}
                  className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg sm:self-auto"
                >
                  View more <ChevronRight size={16} aria-hidden />
                </Link>
              </div>
              <div className="grid min-w-0 max-w-full grid-cols-1 gap-5 md:grid-cols-3">
                {curatedAlbums.length === 0 ? (
                  <p className="col-span-full rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-10 text-center text-sm text-muted">
                    No public curated albums yet. Check back after editors publish albums to the site.
                  </p>
                ) : (
                  curatedAlbums.map((album) => <CuratedAlbumCard key={album.id} album={album} />)
                )}
              </div>
              <div
                id="generated-scrapbooks"
                className="mt-6 min-w-0 max-w-full scroll-mt-24"
              >
                <div className="md:hidden">
                  <MobileGeneratedScrapbooks categories={generatedAlbumCategories} />
                </div>

                <div className="hidden min-w-0 max-w-full overflow-hidden rounded-2xl border border-border-subtle/90 bg-[linear-gradient(180deg,rgba(129,89,58,0.11),rgba(129,89,58,0.04))] p-6 md:block">
                  <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 max-w-full space-y-2">
                      <h2 className="font-heading text-2xl font-semibold leading-tight text-heading sm:text-3xl">
                        Selected Generated Scrapbooks
                      </h2>
                      <p className="text-sm leading-relaxed text-muted md:text-base">
                        These examples show how the scrapbook generator can gather family media into a living
                        gallery from people, families, places, dates, tags, and events in the tree. Use the
                        scrapbook generator to create one of your own.
                      </p>
                    </div>
                    <Link
                      href="/scrapbook-generator"
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-link px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover md:inline-flex md:w-auto"
                    >
                      Generate a scrapbook <ChevronRight size={16} aria-hidden />
                    </Link>
                  </div>

                  <div className="mt-6 grid min-w-0 max-w-full grid-cols-1 gap-5 lg:grid-cols-2">
                    <GeneratedAlbumList title="Generated from People" items={generatedIndividualAlbums} />
                    <GeneratedAlbumList title="Generated from Families" items={generatedFamilyAlbums} />
                    <div className="min-w-0 lg:col-span-2">
                      <GeneratedAlbumList title="Generated from Events" items={generatedEventAlbums} />
                    </div>
                    <GeneratedAlbumList title="Generated from Places" items={generatedPlaceAlbums} />
                    <div className="flex min-w-0 flex-col gap-5">
                      <GeneratedAlbumList title="Generated from Dates" items={generatedDateAlbums} />
                      <GeneratedAlbumList title="Generated from Tags" items={generatedTagAlbums} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PageContainer>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
