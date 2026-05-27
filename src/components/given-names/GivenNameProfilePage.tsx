import Image from "next/image";
import Link from "next/link";
import { FileSignature, RefreshCw } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PersonCard } from "@/components/individuals/PersonCard";
import { Section } from "@/components/wireframe";
import { GivenNameProfileStatistics } from "./GivenNameProfileStatistics";
import type { PublicGivenNameProfile } from "./types";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

/** Match statistics and sample sections (wider than list-page `PageContainer narrow`). */
const PROFILE_SECTION_INNER =
  "mx-auto w-full min-w-0 max-w-[min(100%,1680px)] px-5 sm:px-6 md:px-8 lg:px-10";

export function GivenNameProfilePage({ givenName }: { givenName: PublicGivenNameProfile }) {
  const samplePeople = givenName.samplePeople;

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-hidden pb-2 pt-[66px] md:pb-12 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image
              src={PERSON_CARD_FALLBACK_BG}
              alt=""
              fill
              priority
              className="scale-105 object-cover object-center opacity-85 blur-xl sepia-[0.28] saturate-[0.72]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/66 via-bg/44 to-bg/18 md:from-bg/82 md:via-bg/64 md:to-bg/36" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <div className={`${PROFILE_SECTION_INNER} py-4 md:py-6`}>
              <nav
                aria-label="Breadcrumb"
                className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted"
              >
                <Link href="/" className="transition hover:text-link">
                  Home
                </Link>
                <span className="text-subtle">/</span>
                <Link href="/tree" className="transition hover:text-link">
                  Family Tree
                </Link>
                <span className="text-subtle">/</span>
                <Link href="/given-names" className="transition hover:text-link">
                  Given Names
                </Link>
                <span className="text-subtle">/</span>
                <span className="text-heading">{givenName.displayGivenName}</span>
              </nav>

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-4">
                  <h1 className="flex items-center gap-3 font-heading text-4xl font-semibold tracking-tight text-heading sm:text-5xl">
                    <FileSignature className="h-10 w-10 shrink-0 text-link" aria-hidden />
                    <span className="break-words">{givenName.displayGivenName}</span>
                  </h1>
                  <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
                  <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                    {givenName.statistics.peopleCount.toLocaleString()} people in our tree carry this given name in their
                    GEDCOM name. Explore distributions below, then browse everyone who matches.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={givenName.individualsHref}
                      className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg"
                    >
                      Browse all people with this given name
                    </Link>
                    <Link
                      href="/given-names"
                      className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface/80 px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-surface-2/90"
                    >
                      All given names
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <GivenNameProfileStatistics statistics={givenName.statistics} />

        <Section noPadding className="min-w-0 overflow-x-hidden py-8 md:py-12">
          <div className={PROFILE_SECTION_INNER}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-heading sm:text-3xl">A few people at random</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                  Three people from the tree who carry this given name. Refresh the page to see a different sample.
                </p>
              </div>
              <p className="inline-flex items-center gap-2 font-body text-xs text-muted">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                New sample on each visit
              </p>
            </div>

            {samplePeople.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-12 text-center text-sm text-muted">
                No matching individuals found for this given name.
              </div>
            ) : (
              <div className="grid w-full min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {samplePeople.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            )}

          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
