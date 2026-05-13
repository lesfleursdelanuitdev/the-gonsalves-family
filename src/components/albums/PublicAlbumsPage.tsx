import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";
import { Footer } from "@/components/homepage";
import { PageContainer, Section } from "@/components/wireframe";
import {
  curatedAlbums,
  generatedEventAlbums,
  generatedIndividualAlbums,
  generatedTagAlbums,
  type CuratedAlbum,
  type GeneratedAlbum,
} from "./albums-data";

function SectionOrnament() {
  return (
    <div className="flex items-center gap-3 text-subtle" aria-hidden>
      <span className="h-px w-10 bg-border-subtle" />
      <span className="text-xs">+</span>
      <span className="h-px w-10 bg-border-subtle" />
    </div>
  );
}

function CuratedAlbumCard({ album }: { album: CuratedAlbum }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={album.coverSrc}
          alt={album.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-heading text-[1.75rem] font-semibold leading-tight text-heading">{album.title}</h3>
        <p className="min-h-12 text-sm leading-relaxed text-muted">{album.description}</p>
        <Link
          href={`/albums/${album.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
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
    <section className="space-y-4 rounded-2xl border border-border/80 bg-surface-elevated p-4 shadow-[0_6px_20px_rgba(60,45,25,0.06)]">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <h3 className="font-heading text-xl font-semibold text-heading">{title}</h3>
        <Link
          href="/albums"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-link hover:text-link-hover"
        >
          View All <ChevronRight size={14} aria-hidden />
        </Link>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border-subtle/70 bg-surface p-2.5 transition hover:bg-surface-elevated">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-subtle/70">
                <Image src={item.thumbSrc} alt={item.title} fill className="object-cover" sizes="56px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-base font-medium text-heading">{item.title}</p>
                <p className="text-sm text-muted">{item.photoCount} photos</p>
              </div>
              <Link
                href={`/albums/${item.id}`}
                className="shrink-0 rounded-md border border-border-subtle bg-surface-elevated px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
              >
                View Album
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PublicAlbumsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <main className="flex-1">
        <Section className="relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-32">
          <div className="absolute inset-0">
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

          <div className="relative z-10">
            <PageContainer narrow>
              <div className="max-w-2xl space-y-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
                  <Link href="/" className="transition hover:text-link">
                    Home
                  </Link>
                  <span className="text-subtle">/</span>
                  <span className="text-heading">Albums</span>
                </nav>
                <h1 className="font-heading text-5xl font-semibold tracking-tight text-heading md:text-6xl">
                  Albums
                </h1>
                <SectionOrnament />
                <p className="max-w-xl text-lg leading-relaxed text-muted md:text-xl">
                  Explore our family&apos;s memories through curated albums or automatically generated
                  collections built from our family tree.
                </p>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section className="py-12 md:py-16">
          <PageContainer narrow>
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.06)] md:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
                <h2 className="font-heading text-3xl font-semibold text-heading">Curated Albums</h2>
                <Link
                  href="/albums"
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
                >
                  View More Albums <ChevronRight size={16} aria-hidden />
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {curatedAlbums.map((album) => (
                  <CuratedAlbumCard key={album.id} album={album} />
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-border-subtle/90 bg-[linear-gradient(180deg,rgba(129,89,58,0.11),rgba(129,89,58,0.04))] p-5 md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl space-y-2">
                    <h2 className="font-heading text-3xl font-semibold text-heading">Album Generator</h2>
                    <p className="text-sm leading-relaxed text-muted md:text-base">
                      Create custom albums automatically from people, families, events, and tags in our
                      family tree.
                    </p>
                  </div>
                  <Link
                    href="/albums"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-link px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-link-hover"
                  >
                    Go to Album Generator <ChevronRight size={16} aria-hidden />
                  </Link>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  <GeneratedAlbumList
                    title="Generated Albums for Individuals"
                    items={generatedIndividualAlbums}
                  />
                  <GeneratedAlbumList
                    title="Generated Albums for Events"
                    items={generatedEventAlbums}
                  />
                  <GeneratedAlbumList
                    title="Generated Albums for Tags"
                    items={generatedTagAlbums}
                  />
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
