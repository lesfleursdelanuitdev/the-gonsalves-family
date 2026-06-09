import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, UsersRound } from "lucide-react";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { Footer } from "@/components/homepage";
import { Section, PageContainer } from "@/components/wireframe";
import { PersonCard } from "@/components/individuals/PersonCard";
import { PeopleSearchBox } from "@/components/people/PeopleSearchBox";
import { loadPublicIndividualsByIds } from "@/lib/individuals/load-public-individuals";

export const metadata = {
  title: "Find People · The Gonsalves Family",
  description:
    "Discover ancestors, relatives, and the branches that shape our family. Search people, explore families, and walk the family tree.",
};

/**
 * Spotlight people, in display order. UUIDs are the public-tree records for
 * Augustinho Thomas Gonsalves, Norman Peter Gonsalves, and Mary Mias Gracis.
 */
/** Archival photo for the "Explore the family tree" sepia band. Swap freely. */
const EXPLORE_BAND_PHOTO = "/images/albumsCoverImage.png";

const SPOTLIGHT_IDS = [
  "8450ef75-63c1-4a84-a1ee-0c5a9ff16f30", // Augustinho Thomas Gonsalves (1894–1998)
  "ce85c538-0185-469d-87d4-edb4514d1ad6", // Norman Peter Gonsalves (1957–2022)
  "7f01d81a-3107-4700-a2c4-89c2b2435ee7", // Mary Mias Gracis (1830–1895)
];

export default async function FindPeoplePage() {
  const loaded = await loadPublicIndividualsByIds(SPOTLIGHT_IDS);
  // loadPublicIndividualsByIds does not preserve input order — restore it.
  const spotlight = SPOTLIGHT_IDS.map((id) => loaded.find((p) => p.id === id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg pb-32 text-text sm:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        {/* Hero */}
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src="/images/albumsCoverImageMobile.png" alt="" fill priority className="object-cover md:hidden" sizes="100vw" />
            <Image src="/images/albumsCoverImage.png" alt="" fill priority className="hidden object-cover md:block" sizes="100vw" />
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
                  <span className="min-w-0 text-heading">Find People</span>
                </nav>

                <p className="section-subtitle">People</p>

                <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                  Find your <span className="italic">family</span>
                </h1>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                  Discover ancestors, relatives, and the branches that shape our family.
                  Search by name to jump straight into a person&apos;s story.
                </p>

                <div className="pt-1">
                  <PeopleSearchBox />
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        {/* Explore the tree — sepia feature band (design: explore-tree-B). The
            primary "start here" way in, full content width below the hero. */}
        <Section noPadding className="min-w-0 overflow-x-hidden pt-8 pb-6 md:pt-10 md:pb-8">
          <PageContainer narrow>
            <Link
              href="/tree/viewer"
              aria-label="Explore the family tree in the interactive Tree Viewer"
              className="group relative flex min-h-[236px] min-w-0 items-center overflow-hidden rounded-[18px] border border-[rgba(42,40,32,0.18)] shadow-[0_14px_36px_rgba(42,32,16,0.18)]"
            >
              {/* Archival photo layer (swap PEOPLE_BAND_PHOTO to change it). */}
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

              {/* Decorative family-tree glyph (desktop only). */}
              <svg
                className="absolute right-[38px] top-1/2 z-[2] hidden h-[108px] w-[180px] -translate-y-1/2 text-[rgba(247,239,220,0.5)] md:block"
                viewBox="0 0 200 120"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                <path
                  d="M100 16 L50 60 M100 16 L150 60 M50 60 L24 104 M50 60 L72 104 M150 60 L128 104 M150 60 L176 104"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  fill="none"
                  opacity={0.5}
                />
                <circle cx="100" cy="16" r="6" fill="currentColor" />
                <circle cx="50" cy="60" r="5" fill="currentColor" />
                <circle cx="150" cy="60" r="5" fill="currentColor" />
                <circle cx="24" cy="104" r="4" fill="currentColor" />
                <circle cx="72" cy="104" r="4" fill="currentColor" />
                <circle cx="128" cy="104" r="4" fill="currentColor" />
                <circle cx="176" cy="104" r="4" fill="currentColor" />
              </svg>

              {/* Text block */}
              <div className="relative z-[2] max-w-[600px] px-[26px] py-[28px] sm:px-[42px] sm:py-[34px]">
                <p className="font-body text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#e8bca2]">
                  Start here
                </p>
                <h2 className="mt-3 font-heading text-[28px] font-medium leading-[1.04] tracking-[-0.015em] text-[#f7efdc] sm:text-[34px]">
                  Explore the family tree
                </h2>
                <p className="mt-[9px] max-w-[46ch] font-body text-[15px] leading-[1.6] text-[rgba(247,239,220,0.82)]">
                  Six generations, one living map. Pan and zoom through every branch in the interactive Tree Viewer.
                </p>
                <span className="mt-[22px] inline-flex items-center gap-[9px] rounded-[11px] bg-[#f4ecd8] px-6 py-3.5 font-body text-[14.5px] font-semibold text-[#244730] shadow-sm transition duration-200 group-hover:-translate-y-px group-hover:bg-white">
                  Open Tree Viewer
                  <ArrowRight className="h-[18px] w-[18px] transition duration-200 group-hover:translate-x-[3px]" aria-hidden />
                </span>
              </div>
            </Link>
          </PageContainer>
        </Section>

        {/* Two more ways in: people + families */}
        <Section noPadding className="min-w-0 overflow-x-hidden pb-8 md:pb-10">
          <PageContainer narrow>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <Link
                href="/individuals"
                className="group flex min-w-0 flex-col rounded-2xl border border-border/80 bg-surface-elevated p-6 shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
              >
                <UsersRound className="h-7 w-7 text-link" strokeWidth={1.8} aria-hidden />
                <h2 className="mt-4 font-heading text-2xl font-semibold text-heading">Search people</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  Browse everyone in our family tree. Filter by name, dates, and more to find an individual.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-link">
                  Browse individuals
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>

              <Link
                href="/families"
                className="group flex min-w-0 flex-col rounded-2xl border border-border/80 bg-surface-elevated p-6 shadow-[0_8px_24px_rgba(60,45,25,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(60,45,25,0.14)]"
              >
                <Users className="h-7 w-7 text-link" strokeWidth={1.8} aria-hidden />
                <h2 className="mt-4 font-heading text-2xl font-semibold text-heading">Search families</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  Explore family units — couples, parents, and children — and how they connect across generations.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-link">
                  Browse families
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </div>
          </PageContainer>
        </Section>

        {/* Spotlight */}
        {spotlight.length > 0 && (
          <Section noPadding className="min-w-0 overflow-x-hidden pb-12 md:pb-16">
            <PageContainer narrow>
              <div className="mb-6 min-w-0">
                <p className="section-subtitle">Spotlight</p>
                <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
                  People to meet
                </h2>
                <div className="mt-3 h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
              </div>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {spotlight.map((person) => (
                  <PersonCard key={person.id} person={person} />
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
