import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitBranch, Users, UsersRound } from "lucide-react";
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

        {/* Explore the tree — the primary, most prominent way in */}
        <Section noPadding className="min-w-0 overflow-x-hidden pt-8 pb-6 md:pt-10 md:pb-8">
          <PageContainer narrow>
            <Link
              href="/tree/viewer"
              className="group flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-link/25 bg-link-soft-bg p-7 shadow-[0_10px_28px_rgba(60,45,25,0.1)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(60,45,25,0.16)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8"
            >
              <div className="flex min-w-0 items-start gap-4">
                <GitBranch className="mt-1 h-9 w-9 shrink-0 text-link" strokeWidth={1.8} aria-hidden />
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl font-semibold text-heading sm:text-3xl">Explore the family tree</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
                    See how everyone connects — pan and zoom through generations in the interactive Tree Viewer.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition group-hover:bg-primary-hover">
                Open Tree Viewer
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
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
