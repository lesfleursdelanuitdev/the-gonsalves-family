import Image from "next/image";
import Link from "next/link";
import { Baby, Cross, Heart, MapPin } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import type { PublicPlaceProfile, PublicPlacePerson, PublicPlaceFamily } from "./types";

function SectionList({
  title,
  items,
  renderItem,
  empty,
}: {
  title: string;
  items: unknown[];
  renderItem: (item: never) => React.ReactNode;
  empty: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/80 bg-surface/90 shadow-[0_10px_26px_rgba(60,45,25,0.06)]">
      <div className="border-b border-border-subtle/70 px-5 py-4">
        <h2 className="font-heading text-base font-semibold text-heading">
          {title} <span className="ml-1 font-body text-sm font-normal text-muted">({items.length})</span>
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-6 font-body text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border-subtle/50">
          {(items as never[]).map(renderItem)}
        </ul>
      )}
    </div>
  );
}

function PersonRow({ person, yearLabel }: { person: PublicPlacePerson; yearLabel: string }) {
  return (
    <li key={person.id}>
      <Link
        href={person.profileHref}
        className="flex min-w-0 items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-2/60"
      >
        <span className="min-w-0 truncate font-body text-sm font-medium text-heading">{person.name}</span>
        {person.year != null ? (
          <span className="shrink-0 font-body text-xs text-muted">
            {yearLabel} {person.year}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function FamilyRow({ family }: { family: PublicPlaceFamily }) {
  return (
    <li key={family.id}>
      <Link
        href={family.profileHref}
        className="flex min-w-0 items-center justify-between gap-3 px-5 py-3 transition hover:bg-surface-2/60"
      >
        <span className="min-w-0 truncate font-body text-sm font-medium text-heading">{family.title}</span>
        {family.year != null ? (
          <span className="shrink-0 font-body text-xs text-muted">Married {family.year}</span>
        ) : null}
      </Link>
    </li>
  );
}

export function PlaceProfilePage({ place }: { place: PublicPlaceProfile }) {
  const totalCount = place.birthCount + place.deathCount + place.marriageCount;

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Section noPadding className="relative min-w-0 overflow-x-hidden pb-4 pt-14 sm:pb-10 md:pb-14 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            <Image src="/images/oldMapBackground.png" alt="" fill priority className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/96 via-bg/82 to-bg/35 md:from-bg/92 md:via-bg/78 md:to-bg/20" />
            <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-bg to-transparent" />
          </div>
          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <div className="min-w-0 max-w-full space-y-5 p-5 backdrop-blur-md [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:p-6">
                <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 font-body text-xs tracking-[0.06em] text-muted">
                  <Link href="/" className="min-w-0 shrink transition hover:text-link">Home</Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <Link href="/tree" className="min-w-0 shrink transition hover:text-link">Family Tree</Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <Link href="/tree/places" className="min-w-0 shrink transition hover:text-link">Places</Link>
                  <span className="shrink-0 text-subtle">/</span>
                  <span className="min-w-0 truncate text-heading">{place.label}</span>
                </nav>

                <div className="flex min-w-0 items-start gap-3">
                  <MapPin className="mt-1.5 h-6 w-6 shrink-0 text-link" aria-hidden />
                  <h1 className="break-words font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl">
                    {place.label}
                  </h1>
                </div>

                <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />

                <div className="flex flex-wrap gap-3">
                  {place.country ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 font-body text-xs font-medium text-muted">
                      {place.country}
                    </span>
                  ) : null}
                  {place.state && place.state !== place.country ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 font-body text-xs font-medium text-muted">
                      {place.state}
                    </span>
                  ) : null}
                  {place.county ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 font-body text-xs font-medium text-muted">
                      {place.county}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 font-body text-xs font-medium text-muted">
                    {totalCount} record{totalCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-wrap gap-5">
                  {[
                    { icon: Baby, label: "Births", value: place.birthCount },
                    { icon: Heart, label: "Marriages", value: place.marriageCount },
                    { icon: Cross, label: "Deaths", value: place.deathCount },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-link" strokeWidth={1.8} aria-hidden />
                      <span className="font-body text-sm text-muted">
                        <span className="font-semibold text-heading">{value}</span> {label.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        <Section noPadding className="min-w-0 overflow-x-hidden pb-10 pt-4 md:pt-8">
          <PageContainer narrow>
            <div className="space-y-5">
              <SectionList
                title="Births"
                items={place.birthIndividuals}
                renderItem={(person: PublicPlacePerson) => <PersonRow key={person.id} person={person} yearLabel="b." />}
                empty="No births recorded at this place."
              />
              <SectionList
                title="Marriages"
                items={place.marriageFamilies}
                renderItem={(family: PublicPlaceFamily) => <FamilyRow key={family.id} family={family} />}
                empty="No marriages recorded at this place."
              />
              <SectionList
                title="Deaths"
                items={place.deathIndividuals}
                renderItem={(person: PublicPlacePerson) => <PersonRow key={person.id} person={person} yearLabel="d." />}
                empty="No deaths recorded at this place."
              />
            </div>
          </PageContainer>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
