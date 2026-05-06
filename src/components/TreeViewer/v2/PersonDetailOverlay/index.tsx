"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { BasicPersonDetails, PersonDetailOverlayProps } from "./types";
import {
  useBasicPersonDetails,
  useFamiliesAsChild,
  useFamiliesAsSpouse,
  useIndividualMediaPeek,
  useNotes,
  useSources,
  useGedcomEvents,
} from "./hooks";
import { stripSlashesFromName, splitDisplayName, getLifetimeStartYear, getLifetimeEndYear } from "./utils";
import { resolveGedcomMediaFileRef } from "@/lib/images";
import {
  overlayStyle,
  overlayStyleMobile,
  loadingStyle,
  errorStyle,
  iconColor,
  iconSize,
  OVERLAY_C1,
} from "./styles";
import { PersonDetailOverlayProfileHeader } from "./PersonDetailOverlayProfileHeader";
import { BirthSection } from "./BirthSection";
import { DeathSection } from "./DeathSection";
import { FamiliesSection } from "./FamiliesSection";
import { SourcesSection } from "./SourcesSection";
import { EventsSection } from "./EventsSection";
import { NotesSection } from "./NotesSection";
import { MediaSection } from "./MediaSection";
import { ExploreMoreSection } from "./ExploreMoreSection";
import { OverlayScrollProvider, OverlayScrollRoot } from "./OverlayScrollContext";
import { AnimatedSection } from "./AnimatedSection";
import { PersonDetailSectionNav, type PersonDetailNavItem } from "./PersonDetailSectionNav";
import {
  DEFAULT_SECTION_OPEN,
  PERSON_DETAIL_SECTION_DOM_ID,
  type PersonOverlayNavId,
} from "./personDetailNav";

export type { PersonDetailOverlayPerson, PersonDetailOverlayProps } from "./types";

function deathOverlayHasContent(death: BasicPersonDetails["death"]): boolean {
  return Boolean(death.date ?? death.place ?? death.event);
}

function profileRasterPublicUrl(
  profile: { fileRef: string | null; form: string | null } | null | undefined
): string | null {
  if (!profile?.fileRef?.trim()) return null;
  const f = (profile.form ?? "").toLowerCase().trim();
  const ok = !f || ["jpeg", "jpg", "png", "gif", "webp", "bmp", "tif", "tiff"].includes(f);
  if (!ok) return null;
  return resolveGedcomMediaFileRef(profile.fileRef) || null;
}

export function PersonDetailOverlay({
  person,
  onClose,
  onSelectLinkedPerson,
  isMobile,
}: PersonDetailOverlayProps) {
  const [familyOriginIndex, setFamilyOriginIndex] = useState(0);
  const [familySpouseIndex, setFamilySpouseIndex] = useState(0);
  const [sectionOpen, setSectionOpen] = useState(() => ({ ...DEFAULT_SECTION_OPEN }));
  const [footerActiveActionId, setFooterActiveActionId] = useState<PersonOverlayNavId | null>(null);

  useEffect(() => {
    setSectionOpen({ ...DEFAULT_SECTION_OPEN });
    setFooterActiveActionId(null);
  }, [person.xref]);

  const setSectionExpanded = useCallback((id: PersonOverlayNavId, expanded: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [id]: expanded }));
  }, []);

  const handleSectionNavJump = useCallback((id: PersonOverlayNavId) => {
    setFooterActiveActionId(id);
    setSectionOpen((prev) => ({ ...prev, [id]: true }));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(PERSON_DETAIL_SECTION_DOM_ID[id])?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    });
  }, []);

  const basic = useBasicPersonDetails(person.xref);
  const familiesAsChild = useFamiliesAsChild(person.xref);
  const familiesAsSpouse = useFamiliesAsSpouse(person.xref);
  const notes = useNotes(person.xref);
  const sources = useSources(person.xref);
  const gedcomEvents = useGedcomEvents(person.xref);
  const mediaPeek = useIndividualMediaPeek(person.xref);

  const basicData = basic.data;
  const familiesOfOrigin = familiesAsChild.data ?? [];
  const familiesAsSpouseData = familiesAsSpouse.data ?? [];
  const notesData = notes.data ?? [];
  const sourcesData = sources.data ?? [];
  const allEvents = gedcomEvents.data ?? [];
  const lifetimeStartYear =
    basicData != null ? getLifetimeStartYear(basicData.birth?.date ?? null) : null;
  const lifetimeEndYear =
    basicData != null
      ? getLifetimeEndYear(basicData.birth?.date ?? null, basicData.death?.date ?? null)
      : null;
  const eventsData =
    lifetimeStartYear == null && lifetimeEndYear == null
      ? allEvents
      : allEvents.filter((e) => {
          if (e.year == null) return true;
          if (lifetimeStartYear != null && e.year < lifetimeStartYear) return false;
          if (lifetimeEndYear != null && e.year > lifetimeEndYear) return false;
          return true;
        });

  const isLoading = basic.status === "loading";
  const isError = basic.status === "error";
  const showContent = basic.status === "success" && basicData;

  // Prefer the name from the tree (chart) when available; it includes all given names (e.g. middle)
  // from the name-form API. The basic-detail API may only have full_name which can omit middle names.
  const treeName = (person.name ?? "").trim();
  const apiName = showContent && basicData.name != null ? basicData.name.trim() : null;
  const displayName = stripSlashesFromName(
    treeName !== "" ? person.name : (apiName ?? person.name)
  );
  const { first, last } = splitDisplayName(displayName);

  const profilePhotoSrc =
    mediaPeek.status === "success" && mediaPeek.data
      ? profileRasterPublicUrl(mediaPeek.data.displayPhoto) ?? profileRasterPublicUrl(mediaPeek.data.profile)
      : null;
  const coverStripSrc = profilePhotoSrc;

  /** Pull cover flush with modal inner top and sides (matches overlay padding / mobile overrides). */
  const coverEdgePull = isMobile
    ? { marginTop: -20, marginLeft: -12, marginRight: -12 }
    : { marginTop: -40, marginLeft: -24, marginRight: -24 };

  const navItems = useMemo((): PersonDetailNavItem[] => {
    const items: PersonDetailNavItem[] = [];
    if (isLoading) return items;
    if (!showContent || !basicData) {
      items.push({ id: "explore", label: "Explore more" });
      return items;
    }
    items.push({ id: "birth", label: "Birth" });
    if (deathOverlayHasContent(basicData.death)) items.push({ id: "death", label: "Death" });
    if (familiesOfOrigin.length > 0 || familiesAsSpouseData.length > 0) {
      items.push({ id: "families", label: "Families" });
    }
    if (sourcesData.length > 0) items.push({ id: "sources", label: "Sources" });
    items.push({ id: "media", label: "Media" });
    if (eventsData.length > 0) items.push({ id: "events", label: "Events" });
    if (notesData.length > 0) items.push({ id: "notes", label: "Notes" });
    items.push({ id: "explore", label: "Explore more" });
    return items;
  }, [
    isLoading,
    showContent,
    basicData,
    familiesOfOrigin.length,
    familiesAsSpouseData.length,
    sourcesData.length,
    eventsData.length,
    notesData.length,
  ]);

  const scrollAreaStyle = useMemo(() => {
    const side = isMobile ? 12 : 24;
    return {
      paddingTop: isMobile ? 20 : 40,
      paddingRight: side,
      paddingBottom: side,
      paddingLeft: side,
      ...(isMobile ? { fontSize: 13 } : {}),
    };
  }, [isMobile]);

  const overlayShellStyle = useMemo(
    () => ({
      ...overlayStyle,
      overflow: "hidden" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
      minHeight: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    }),
    []
  );

  return (
    <>
      <div
        role="presentation"
        aria-hidden
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 500 }}
        onClick={onClose}
      />
      <OverlayScrollProvider>
        <OverlayScrollRoot
          role="dialog"
          aria-modal
          aria-labelledby={isLoading ? undefined : "person-detail-overlay-title"}
          aria-busy={isLoading}
          style={
            isLoading
              ? {
                  ...overlayStyle,
                  ...(isMobile ? overlayStyleMobile : {}),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }
              : overlayShellStyle
          }
          scrollAreaStyle={isLoading ? undefined : scrollAreaStyle}
          footer={
            !isLoading ? (
              <PersonDetailSectionNav
                items={navItems}
                onJump={handleSectionNavJump}
                onClose={onClose}
                isMobile={isMobile}
                activeActionId={footerActiveActionId}
              />
            ) : undefined
          }
        >
          {isLoading && (
            <div style={loadingStyle}>
              <Loader2 size={32} className="animate-spin" style={{ flexShrink: 0, marginRight: 12, color: "var(--tree-text-muted)" }} aria-hidden />
              <span>Loading…</span>
            </div>
          )}

          {!isLoading && (
            <>
              {coverStripSrc != null && coverStripSrc !== "" && (
                <div
                  style={{
                    height: 96,
                    ...coverEdgePull,
                    marginBottom: 12,
                    borderRadius: "12px 12px 0 0",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- OBJE URL from admin */}
                  <img
                    src={coverStripSrc}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: "blur(5px)",
                      transform: "scale(1.06)",
                      transformOrigin: "center center",
                    }}
                  />
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(239,231,214,0.55) 42%, rgba(239,231,214,0.92) 78%, ${OVERLAY_C1} 100%)`,
                    }}
                  />
                </div>
              )}
              <PersonDetailOverlayProfileHeader
              xref={person.xref}
              first={first}
              last={last}
              birthDate={basicData?.birth.date ?? null}
              deathDate={basicData?.death.date ?? null}
              living={basicData?.living}
              gender={basicData?.gender ?? null}
              isMobile={isMobile}
              profilePhotoSrc={profilePhotoSrc}
              birthYMD={
                basicData?.birth?.event
                  ? {
                      year: basicData.birth.event.year ?? null,
                      month: basicData.birth.event.month ?? null,
                      day: basicData.birth.event.day ?? null,
                    }
                  : null
              }
              deathYMD={
                basicData?.death?.event
                  ? {
                      year: basicData.death.event.year ?? null,
                      month: basicData.death.event.month ?? null,
                      day: basicData.death.event.day ?? null,
                    }
                  : null
              }
            />

            {isError && (
              <div style={errorStyle}>
                <p style={{ margin: 0 }}>{basic.error ?? "Something went wrong."}</p>
              </div>
            )}

            {showContent && basicData && (
              <>
                <div
                  style={{
                    marginTop: 24,
                    display: "grid",
                    gap: 16,
                    alignItems: "start",
                    gridTemplateColumns:
                      isMobile || !deathOverlayHasContent(basicData.death)
                        ? "minmax(0, 1fr)"
                        : "minmax(0, 1fr) minmax(0, 1fr)",
                  }}
                >
                  <AnimatedSection staggerIndex={0}>
                    <div id={PERSON_DETAIL_SECTION_DOM_ID.birth}>
                      <BirthSection
                        data={basicData.birth}
                        isMobile={isMobile}
                        sectionRootStyle={{ marginTop: 0 }}
                        expanded={sectionOpen.birth}
                        onExpandedChange={(v) => setSectionExpanded("birth", v)}
                      />
                    </div>
                  </AnimatedSection>
                  {deathOverlayHasContent(basicData.death) ? (
                    <AnimatedSection staggerIndex={1}>
                      <div id={PERSON_DETAIL_SECTION_DOM_ID.death}>
                        <DeathSection
                          data={basicData.death}
                          isMobile={isMobile}
                          sectionRootStyle={{ marginTop: 0 }}
                          expanded={sectionOpen.death}
                          onExpandedChange={(v) => setSectionExpanded("death", v)}
                        />
                      </div>
                    </AnimatedSection>
                  ) : null}
                </div>
                <AnimatedSection staggerIndex={2}>
                  <div id={PERSON_DETAIL_SECTION_DOM_ID.families}>
                    <FamiliesSection
                      personXref={person.xref}
                      familiesOfOrigin={familiesOfOrigin}
                      familiesAsSpouse={familiesAsSpouseData}
                      selectedChildFamilyIndex={familyOriginIndex}
                      onSelectChildFamilyIndex={setFamilyOriginIndex}
                      selectedSpouseFamilyIndex={familySpouseIndex}
                      onSelectSpouseFamilyIndex={setFamilySpouseIndex}
                      onSelectLinkedPerson={onSelectLinkedPerson}
                      isMobile={isMobile}
                      expanded={sectionOpen.families}
                      onExpandedChange={(v) => setSectionExpanded("families", v)}
                    />
                  </div>
                </AnimatedSection>
                <AnimatedSection staggerIndex={3}>
                  <div id={PERSON_DETAIL_SECTION_DOM_ID.sources}>
                    <SourcesSection
                      sources={sourcesData}
                      isMobile={isMobile}
                      expanded={sectionOpen.sources}
                      onExpandedChange={(v) => setSectionExpanded("sources", v)}
                    />
                  </div>
                </AnimatedSection>
                <AnimatedSection staggerIndex={4}>
                  <div id={PERSON_DETAIL_SECTION_DOM_ID.media}>
                    <MediaSection
                      status={mediaPeek.status}
                      peek={mediaPeek.data}
                      isMobile={isMobile}
                      onRandomizeSamples={mediaPeek.randomizeSamples}
                      samplesRefetchBusy={mediaPeek.samplesRefetchBusy}
                      expanded={sectionOpen.media}
                      onExpandedChange={(v) => setSectionExpanded("media", v)}
                    />
                  </div>
                </AnimatedSection>
                <AnimatedSection staggerIndex={5}>
                  <div id={PERSON_DETAIL_SECTION_DOM_ID.events}>
                    <EventsSection
                      events={eventsData}
                      onSelectLinkedPerson={onSelectLinkedPerson}
                      isMobile={isMobile}
                      expanded={sectionOpen.events}
                      onExpandedChange={(v) => setSectionExpanded("events", v)}
                    />
                  </div>
                </AnimatedSection>
                <AnimatedSection staggerIndex={6}>
                  <div id={PERSON_DETAIL_SECTION_DOM_ID.notes}>
                    <NotesSection
                      notes={notesData}
                      isMobile={isMobile}
                      open={sectionOpen.notes}
                      onOpenChange={(v) => setSectionExpanded("notes", v)}
                    />
                  </div>
                </AnimatedSection>
              </>
            )}

            <AnimatedSection staggerIndex={7}>
              <div id={PERSON_DETAIL_SECTION_DOM_ID.explore}>
                <ExploreMoreSection
                  personXref={person.xref}
                  displayName={displayName}
                  isMobile={isMobile}
                  onLinkClick={onClose}
                  open={sectionOpen.explore}
                  onOpenChange={(v) => setSectionExpanded("explore", v)}
                />
              </div>
            </AnimatedSection>
          </>
        )}
        </OverlayScrollRoot>
      </OverlayScrollProvider>
    </>
  );
}
