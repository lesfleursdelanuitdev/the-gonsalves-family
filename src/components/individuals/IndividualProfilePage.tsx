import Image from "next/image";
import Link from "next/link";
import { Baby, CalendarDays, Dna, GitBranch, Heart, HelpCircle, Network, UsersRound } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { FamilyRelationsTabs } from "./FamilyRelationsTabs";
import { MobileIndividualProfile } from "./MobileIndividualProfile";
import { PersonCardTreeModalTrigger } from "./PersonCardTreeModal";
import { ProfileMediaSection } from "./ProfileMediaSection";
import { ProfileNotes } from "./ProfileNotes";
import { ProfileCharts } from "./ProfileCharts";
import { ProfileTimeline } from "./ProfileTimeline";
import { ProfileRelationshipCalculator } from "./ProfileRelationshipCalculator";
import type { PublicIndividualProfile, PublicIndividualRelation } from "./types";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

function lifeLabel(birthYear: number | null, deathYear: number | null): string {
  const born = birthYear ? String(birthYear) : "Unknown";
  const died = deathYear ? String(deathYear) : "Present";
  return `${born} - ${died}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function summarizePartners(partners: PublicIndividualRelation[]): string | null {
  if (partners.length === 0) return null;
  const visible = partners.slice(0, 2).map((partner) => partner.fullName);
  const remaining = partners.length - visible.length;
  return remaining > 0 ? `${visible.join(", ")}, +${remaining}` : visible.join(", ");
}

function Portrait({ person, className }: { person: PublicIndividualProfile | PublicIndividualRelation; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface ${className ?? ""}`}>
      {person.portraitSrc ? (
        <Image src={person.portraitSrc} alt={person.fullName} fill className="object-cover sepia-[0.22]" sizes="(max-width: 768px) 100vw, 33vw" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={PERSON_CARD_FALLBACK_BG}
            alt=""
            fill
            className="object-cover object-center sepia-[0.28] saturate-[0.72]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,241,228,0.06),rgba(64,41,24,0.18)),radial-gradient(circle_at_center,rgba(255,248,232,0.08),rgba(44,30,20,0.18))]" />
          <div className="relative flex aspect-square w-28 shrink-0 items-center justify-center rounded-full border border-border-subtle/90 bg-surface-elevated/92 shadow-[0_14px_34px_rgba(40,28,18,0.18),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[2px] sm:w-32">
            <span className="font-heading text-5xl font-semibold tracking-[0.04em] text-link sm:text-6xl">
              {initials(person.fullName)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border-subtle/70 bg-surface/80 px-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-link" aria-hidden />
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-heading">{value ?? "Not recorded"}</p>
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border-subtle/70 py-3 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-heading">{value ?? "Not recorded"}</span>
    </div>
  );
}

function statusLabel(status: string): string {
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function contributionHref(person: PublicIndividualProfile): string {
  const params = new URLSearchParams({
    individualXref: person.xref,
    individualName: person.fullName,
  });
  return `/contribute?${params.toString()}`;
}

export function IndividualProfilePage({ person }: { person: PublicIndividualProfile }) {
  const parents = person.parents ?? [];
  const siblings = person.siblings ?? [];
  const partners = person.partners ?? person.spouses ?? (person.partner ? [person.partner] : person.spouse ? [person.spouse] : []);
  const children = person.children ?? [];
  const familiesAsChild = person.familiesAsChild ?? [];
  const familiesAsPartner = person.familiesAsPartner ?? [];
  const timeline = person.timeline ?? [];
  const notes = person.notes ?? [];
  const associates = person.associates ?? [];
  const openQuestions = person.openQuestions ?? [];
  const linkedAccounts = person.linkedAccounts ?? [];
  const hasMedia = person.photos.length > 0;
  const hasNotes = notes.length > 0;
  const hasAssociates = associates.length > 0;
  const hasOpenQuestions = openQuestions.length > 0;
  const partnerLabel = summarizePartners(partners);
  const childrenLabel = children.length > 0 ? `${children.length} recorded` : null;
  const contributeHref = contributionHref(person);
  const profileTabs = [
    "Overview",
    "Family",
    ...(hasAssociates ? ["Associates"] : []),
    ...(hasNotes ? ["Notes"] : []),
    ...(linkedAccounts.length > 0 ? ["Linked Accounts"] : []),
    "Events",
    ...(hasMedia ? ["Media"] : []),
    "Charts",
    ...(hasOpenQuestions ? ["Open Questions"] : []),
    "Relationship",
  ];

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text md:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <MobileIndividualProfile person={person} contributionHref={contributeHref} />

        <div className="hidden md:block">
        <Section noPadding className="relative min-w-0 overflow-hidden pb-2 pt-[66px] md:pb-12 md:pt-32">
          <div className="absolute inset-0 min-w-0 max-w-full">
            {person.portraitSrc ? (
              <Image
                src={person.portraitSrc}
                alt=""
                fill
                priority
                className="scale-105 object-cover opacity-85 blur-xl sepia-[0.28] saturate-[0.9]"
                sizes="100vw"
              />
            ) : (
              <Image
                src={PERSON_CARD_FALLBACK_BG}
                alt=""
                fill
                priority
                className="scale-105 object-cover object-center opacity-85 blur-xl sepia-[0.28] saturate-[0.72]"
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-bg/66 via-bg/44 to-bg/18 md:from-bg/82 md:via-bg/64 md:to-bg/36" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg/90 to-transparent" />
          </div>

          <div className="relative z-10 min-w-0 max-w-full">
            <PageContainer narrow>
              <nav
                aria-label="Breadcrumb"
                className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-xs tracking-[0.06em] text-muted"
              >
                <Link href="/" className="transition hover:text-link">
                  Home
                </Link>
                <span className="text-subtle">/</span>
                <Link href="/individuals" className="transition hover:text-link">
                  Individuals
                </Link>
                <span className="text-subtle">/</span>
                <span className="text-heading">{person.fullName}</span>
              </nav>

              <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(180px,0.36fr)_minmax(0,1fr)] md:items-end lg:gap-8 lg:grid-cols-[minmax(220px,0.42fr)_minmax(0,1fr)]">
                <Portrait
                  person={person}
                  className="mx-auto aspect-[4/5] w-full max-w-[280px] rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(25,18,12,0.28)] md:mx-0"
                />

                <div className="min-w-0 space-y-5 rounded-2xl border border-white/[0.08] bg-bg/18 p-5 backdrop-blur-[6px] [-webkit-backdrop-filter:blur(6px)] sm:p-6">
                  <div className="space-y-3">
                    <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                      {person.fullName}
                    </h1>
                    <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
                    <p className="text-base text-muted sm:text-lg">{lifeLabel(person.birthYear, person.deathYear)}</p>
                    <p className="hidden max-w-3xl text-sm leading-relaxed text-muted md:block md:text-base">
                      {person.biography}
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetadataRow icon={Baby} label="Born" value={[person.birthDateLabel, person.birthPlace].filter(Boolean).join(" · ") || null} />
                    <MetadataRow icon={CalendarDays} label="Died" value={[person.deathDateLabel, person.deathPlace].filter(Boolean).join(" · ") || null} />
                    <MetadataRow icon={Heart} label="Partner" value={partnerLabel} />
                    <MetadataRow icon={UsersRound} label="Children" value={childrenLabel} />
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>
        </Section>

        <div className="relative z-20 hidden border-y border-border-subtle bg-surface/80 backdrop-blur-sm md:block">
          <PageContainer narrow>
            <nav aria-label="Profile sections" className="flex min-w-0 flex-wrap gap-2 py-2">
              {profileTabs.map((tab, idx) => (
                <a
                  key={tab}
                  href={`#${tab.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    idx === 0 ? "bg-link text-primary-foreground" : "border border-border-subtle bg-surface text-link hover:bg-link-soft-bg hover:text-link-soft-fg"
                  }`}
                >
                  {tab}
                </a>
              ))}
              <Link
                href={contributeHref}
                className="ml-auto rounded-lg bg-link px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-link-hover"
              >
                Contribute
              </Link>
            </nav>
          </PageContainer>
        </div>


        <Section id="overview" noPadding className="min-w-0 overflow-x-hidden pb-8 pt-2 md:py-12">
          <PageContainer narrow>
            <aside className="rounded-2xl border border-border/80 bg-surface-elevated/90 p-5 shadow-[0_18px_48px_rgba(40,28,18,0.14)] sm:p-6 md:shadow-[0_8px_24px_rgba(60,45,25,0.06)]">
              <h2 className="font-heading text-2xl font-semibold text-heading">Quick Facts</h2>
              <div className="mt-4">
                <FactRow label="Full name" value={person.fullName} />
                <FactRow label="Tree ref" value={person.xref} />
                <FactRow label="Gender" value={person.gender} />
              </div>
            </aside>

            <section id="family" className="mt-6 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]">
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Family</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Closest Relations</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    These are the people who shaped this person&apos;s life and the families connected to them.
                  </p>
                </div>
                <PersonCardTreeModalTrigger
                  personId={person.id}
                  xref={person.xref}
                  fullName={person.fullName}
                  triggerAriaLabel="View family tree"
                  triggerClassName="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg sm:h-auto sm:w-auto sm:px-4 sm:py-2"
                  triggerChildren={
                    <>
                      <GitBranch className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
                      <span className="hidden sm:inline">View Family Tree</span>
                      <span className="hidden sm:inline" aria-hidden>
                        &rarr;
                      </span>
                    </>
                  }
                />
              </div>
              <FamilyRelationsTabs
                parents={parents}
                siblings={siblings}
                partners={partners}
                childRelations={children}
                familiesAsChild={familiesAsChild}
                familiesAsPartner={familiesAsPartner}
              />
            </section>

            {hasAssociates ? (
              <section id="associates" className="mt-6 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]">
                <div className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
                    <Network className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Associates</p>
                    <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Associated People</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Non-family relationships recorded in the GEDCOM association fields.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {associates.map((associate) => (
                    <Link
                      key={`${associate.id}-${associate.relationLabel}`}
                      href={`/individuals/${encodeURIComponent(associate.id)}`}
                      className="group flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle/80 bg-surface-elevated/80 p-3 transition hover:-translate-y-0.5 hover:border-link/30 hover:shadow-[0_12px_24px_rgba(60,45,25,0.1)]"
                    >
                      <Portrait person={associate} className="h-14 w-14 shrink-0 rounded-full border border-border-subtle" />
                      <div className="min-w-0">
                        <p className="truncate font-heading text-base font-semibold text-heading group-hover:text-link">{associate.fullName}</p>
                        <p className="mt-0.5 text-xs text-muted">{lifeLabel(associate.birthYear, associate.deathYear)}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-link">{associate.relationLabel}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {hasNotes ? (
              <div className="mt-6">
                <ProfileNotes notes={notes} />
              </div>
            ) : null}

            {linkedAccounts.length > 0 ? (
              <section id="linked-accounts" className="mt-6 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]">
                <div className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
                    <UsersRound className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Linked Accounts</p>
                    <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Connected Family Accounts</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Registered family accounts connected to this person in the tree.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {linkedAccounts.map((account) => (
                    <article key={account.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle/80 bg-surface-elevated/80 p-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-[linear-gradient(180deg,rgba(129,89,58,0.12),rgba(129,89,58,0.05))]">
                        <span className="font-heading text-base font-semibold tracking-[0.04em] text-link/80">
                          {initials(account.displayName)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-heading text-base font-semibold text-heading">{account.displayName}</p>
                          {account.verified ? (
                            <span className="rounded-full border border-link/20 bg-link-soft-bg px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-link">
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">@{account.username}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-link">
                          Linked {account.linkedAtLabel}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

          </PageContainer>
        </Section>

        <Section id="events" className="min-w-0 overflow-x-hidden border-y border-border-subtle bg-[linear-gradient(180deg,rgba(129,89,58,0.07),rgba(129,89,58,0.03))] py-10 md:py-14">
          <PageContainer narrow>
            <div className="mb-6 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Events</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-heading">Timeline</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                Personal and partner-family events are always included; relative events are filtered to this person&apos;s lifetime.
              </p>
            </div>
            <ProfileTimeline items={timeline} />
          </PageContainer>
        </Section>

        {hasMedia ? (
          <Section id="media" className="min-w-0 overflow-x-hidden py-10 md:py-14">
            <PageContainer narrow>
              <ProfileMediaSection xref={person.xref} individualId={person.id} />
            </PageContainer>
          </Section>
        ) : null}

        <Section
          id="charts"
          className="min-w-0 overflow-x-hidden border-y border-border-subtle bg-[linear-gradient(180deg,rgba(129,89,58,0.07),rgba(129,89,58,0.03))] py-10 md:py-14"
        >
          <PageContainer narrow>
            <div className="mb-6 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Tree</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-heading">Charts</h2>
            </div>
            <ProfileCharts xref={person.xref} fullName={person.fullName} />
          </PageContainer>
        </Section>

        {hasOpenQuestions ? (
          <Section className="min-w-0 overflow-x-hidden border-t border-border-subtle py-10 md:py-14">
            <PageContainer narrow>
              <section
                id="open-questions"
                className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]"
              >
              <div className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
                  <HelpCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Open Questions</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Questions Still Being Researched</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Unresolved or documented research questions connected to this person.
                  </p>
                </div>
              </div>
                  <div className="grid gap-4">
                    {openQuestions.map((question) => (
                    <article key={question.id} className="rounded-xl border border-border-subtle/80 bg-surface-elevated/80 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-link/20 bg-link-soft-bg px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-link">
                          {statusLabel(question.status)}
                        </span>
                        <span className="text-xs text-muted">Opened {question.createdAtLabel}</span>
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-heading">{question.question}</h3>
                      {question.details ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{question.details}</p>
                      ) : null}
                    </article>
                    ))}
                  </div>
              </section>
            </PageContainer>
          </Section>
        ) : null}
        <Section className="min-w-0 overflow-x-hidden border-t border-border-subtle py-10 md:py-14">
          <PageContainer narrow>
            <section
              id="relationship"
              className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_20px_52px_rgba(40,28,18,0.15)] sm:p-6 md:shadow-[0_10px_26px_rgba(60,45,25,0.08)]"
            >
              <div className="mb-5 flex items-start gap-3 border-b border-border-subtle pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-link/20 bg-link-soft-bg text-link">
                  <Dna className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Relationship</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Find a Relationship</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Select another person from the tree to find out how they are related to {person.fullName}.
                  </p>
                </div>
              </div>
              <ProfileRelationshipCalculator sourceId={person.id} sourceName={person.fullName} />
            </section>
          </PageContainer>
        </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
