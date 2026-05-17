import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, Heart, HeartCrack, UsersRound } from "lucide-react";
import { Footer } from "@/components/homepage";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { PageContainer, Section } from "@/components/wireframe";
import { publicFamilyTreeHref } from "@/lib/treeViewerUrl";
import { ProfileNotes } from "@/components/individuals/ProfileNotes";
import { ProfileTimeline } from "@/components/individuals/ProfileTimeline";
import { FamilyMemberCard } from "./FamilyMemberCard";
import { FamilyPortrait } from "./FamilyPortrait";
import { FamilyProfileMediaSection } from "./FamilyProfileMediaSection";
import { MobileFamilyProfile } from "./MobileFamilyProfile";
import type { DivorcedStatus, PublicFamilyProfile } from "./types";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

function divorcedLabel(status: DivorcedStatus): string {
  if (status === "yes") return "Yes";
  if (status === "no") return "No";
  return "Unknown";
}

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarHeart;
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

export function FamilyProfilePage({ family }: { family: PublicFamilyProfile }) {
  const treeViewHref = publicFamilyTreeHref(family);
  const partners = family.members.filter((m) => m.role === "Partner");
  const children = family.members.filter((m) => m.role === "Child");
  const timeline = family.timeline ?? [];
  const notes = family.notes ?? [];
  const hasNotes = notes.length > 0;

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-bg text-text md:pb-0">
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <MobileFamilyProfile family={family} treeViewHref={treeViewHref} />

        <div className="hidden md:block">
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
                  <Link href="/tree" className="transition hover:text-link">
                    Family Tree
                  </Link>
                  <span className="text-subtle">/</span>
                  <Link href="/families" className="transition hover:text-link">
                    Families
                  </Link>
                  <span className="text-subtle">/</span>
                  <span className="text-heading">{family.title}</span>
                </nav>

                <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(180px,0.36fr)_minmax(0,1fr)] md:items-start lg:gap-8 lg:grid-cols-[minmax(220px,0.42fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <FamilyPortrait
                      partners={family.partners}
                      className="overflow-hidden rounded-2xl border border-border/80 shadow-[0_8px_24px_rgba(60,45,25,0.08)]"
                    />
                  </div>

                  <div className="min-w-0 space-y-5 rounded-2xl border border-white/[0.08] bg-bg/18 p-5 backdrop-blur-[6px] sm:p-6">
                    <div className="space-y-3">
                      <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-heading sm:text-5xl md:text-6xl">
                        {family.title}
                      </h1>
                      <div className="h-px w-24 bg-gradient-to-r from-link/70 via-link/30 to-transparent" />
                      <p className="text-base text-muted sm:text-lg">
                        {family.marriageDateLabel
                          ? `Married ${family.marriageDateLabel}${family.marriagePlaceLabel ? ` · ${family.marriagePlaceLabel}` : ""}`
                          : (family.marriagePlaceLabel ?? "Marriage details not recorded")}
                      </p>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      <MetadataRow icon={CalendarHeart} label="Marriage" value={family.marriageDateLabel} />
                      <MetadataRow icon={HeartCrack} label="Divorced" value={divorcedLabel(family.divorcedStatus)} />
                      <MetadataRow icon={UsersRound} label="Children" value={String(family.childrenCount)} />
                      <MetadataRow icon={Heart} label="Partners" value={String(family.partners.length)} />
                    </div>

                    {treeViewHref ? (
                      <Link
                        href={treeViewHref}
                        className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-link transition hover:bg-link-soft-bg hover:text-link-soft-fg"
                      >
                        View in tree
                      </Link>
                    ) : null}
                  </div>
                </div>
              </PageContainer>
            </div>
          </Section>

          <Section noPadding className="min-w-0 overflow-x-hidden pb-12 pt-2 md:py-12">
            <PageContainer narrow>
              <section id="members" className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.08)] sm:p-6">
                <div className="border-b border-border-subtle pb-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Members</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-heading">Family Members</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    Partners and children linked to this family in the tree.
                  </p>
                </div>

                {partners.length > 0 || children.length > 0 ? (
                  <div className="mt-6 min-w-0 w-full space-y-6">
                    {partners.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="font-heading text-lg font-semibold text-heading">Partners</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {partners.map((member) => (
                            <FamilyMemberCard
                              key={member.id}
                              member={member}
                              partners={family.partners}
                              showAncestorsAction
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {children.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="font-heading text-lg font-semibold text-heading">Children</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {children.map((member) => (
                            <FamilyMemberCard
                              key={member.id}
                              member={member}
                              partners={family.partners}
                              showDescendancyChartAction
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {family.members.length === 0 ? (
                  <p className="mt-6 rounded-xl border border-dashed border-border-subtle/80 bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                    No members are linked to this family yet.
                  </p>
                ) : null}
              </section>

              <div className="mt-6 rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-[0_10px_26px_rgba(60,45,25,0.08)] sm:p-6">
                <FamilyProfileMediaSection familyId={family.id} albumHref={family.albumHref} />
              </div>

              {hasNotes ? (
                <div className="mt-6">
                  <ProfileNotes
                    notes={notes}
                    description="Source notes and transcribed remarks connected to this family."
                  />
                </div>
              ) : null}
            </PageContainer>
          </Section>

          <Section
            id="events"
            className="min-w-0 overflow-x-hidden border-y border-border-subtle bg-[linear-gradient(180deg,rgba(129,89,58,0.07),rgba(129,89,58,0.03))] py-10 md:py-14"
          >
            <PageContainer narrow>
              <div className="mb-6 text-center">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#8b2e2e]">Events</p>
                <h2 className="mt-2 font-heading text-3xl font-semibold text-heading">Timeline</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  Family events and events linked to partners and children in this family group.
                </p>
              </div>
              <ProfileTimeline items={timeline} />
            </PageContainer>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
