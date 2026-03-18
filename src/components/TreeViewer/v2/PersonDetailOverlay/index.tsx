"use client";

import { useState } from "react";
import { Loader2, TreePine, GitBranch, Fan, UserCircle, Compass } from "lucide-react";
import type { PersonDetailOverlayProps } from "./types";
import {
  useBasicPersonDetails,
  useFamiliesAsChild,
  useFamiliesAsSpouse,
  useNotes,
  useSources,
  useGedcomEvents,
} from "./hooks";
import Link from "next/link";
import { stripSlashesFromName, splitDisplayName, personChartHref, fullProfileHref, getLifetimeStartYear, getLifetimeEndYear } from "./utils";
import {
  overlayStyle,
  overlayStyleMobile,
  loadingStyle,
  errorStyle,
  closeButtonStyle,
  chartButtonsRowStyle,
  eventsPaginationButtonStyle,
  iconColor,
  iconSize,
  SECTION_BORDER_RADIUS,
} from "./styles";
import { PersonDetailOverlayProfileHeader } from "./PersonDetailOverlayProfileHeader";
import { BirthSection } from "./BirthSection";
import { DeathSection } from "./DeathSection";
import { FamiliesAsChildSection } from "./FamiliesAsChildSection";
import { FamiliesAsSpouseSection } from "./FamiliesAsSpouseSection";
import { SourcesSection } from "./SourcesSection";
import { EventsSection } from "./EventsSection";
import { NotesSection } from "./NotesSection";
import { Section } from "./Section";
import { OverlayScrollProvider, OverlayScrollRoot } from "./OverlayScrollContext";
import { AnimatedSection } from "./AnimatedSection";

export type { PersonDetailOverlayPerson, PersonDetailOverlayProps } from "./types";

export function PersonDetailOverlay({ person, onClose, isMobile }: PersonDetailOverlayProps) {
  const [familyOriginIndex, setFamilyOriginIndex] = useState(0);
  const [familySpouseIndex, setFamilySpouseIndex] = useState(0);

  const basic = useBasicPersonDetails(person.xref);
  const familiesAsChild = useFamiliesAsChild(person.xref);
  const familiesAsSpouse = useFamiliesAsSpouse(person.xref);
  const notes = useNotes(person.xref);
  const sources = useSources(person.xref);
  const gedcomEvents = useGedcomEvents(person.xref);

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
          style={{
            ...overlayStyle,
            ...(isMobile ? overlayStyleMobile : {}),
            ...(isLoading ? { display: "flex", alignItems: "center", justifyContent: "center" } : {}),
          }}
        >
          {isLoading && (
            <div style={loadingStyle}>
              <Loader2 size={32} className="animate-spin" style={{ flexShrink: 0, marginRight: 12, color: "var(--tree-text-muted)" }} aria-hidden />
              <span>Loading…</span>
            </div>
          )}

          {!isLoading && (
            <>
              <PersonDetailOverlayProfileHeader
              xref={person.xref}
              first={first}
              last={last}
              birthDate={basicData?.birth.date ?? null}
              deathDate={basicData?.death.date ?? null}
              living={basicData?.living}
              gender={basicData?.gender ?? null}
              isMobile={isMobile}
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
                <div style={{ marginTop: 24 }}>
                  <AnimatedSection staggerIndex={0}>
                    <BirthSection data={basicData.birth} isMobile={isMobile} />
                  </AnimatedSection>
                </div>
                <AnimatedSection staggerIndex={1}>
                  <DeathSection data={basicData.death} isMobile={isMobile} />
                </AnimatedSection>
                <AnimatedSection staggerIndex={2}>
                  <FamiliesAsChildSection
                    familiesOfOrigin={familiesOfOrigin}
                    selectedIndex={familyOriginIndex}
                    onSelectIndex={setFamilyOriginIndex}
                    subjectXref={person.xref}
                    isMobile={isMobile}
                  />
                </AnimatedSection>
                <AnimatedSection staggerIndex={3}>
                  <FamiliesAsSpouseSection
                    familiesAsSpouse={familiesAsSpouseData}
                    selectedIndex={familySpouseIndex}
                    onSelectIndex={setFamilySpouseIndex}
                    isMobile={isMobile}
                  />
                </AnimatedSection>
                <AnimatedSection staggerIndex={4}>
                  <SourcesSection sources={sourcesData} isMobile={isMobile} />
                </AnimatedSection>
                <AnimatedSection staggerIndex={5}>
                  <EventsSection events={eventsData} isMobile={isMobile} />
                </AnimatedSection>
                <AnimatedSection staggerIndex={6}>
                  <NotesSection notes={notesData} isMobile={isMobile} />
                </AnimatedSection>
              </>
            )}

            <AnimatedSection staggerIndex={7}>
            <Section
              icon={<Compass size={iconSize} color={iconColor} aria-hidden />}
              title="Explore more"
              description="View this person in other charts or open their full profile page."
              isMobile={isMobile}
              contentStyle={{
                padding: 12,
                borderBottomLeftRadius: SECTION_BORDER_RADIUS,
                borderBottomRightRadius: SECTION_BORDER_RADIUS,
              }}
            >
              <div
                style={{
                  ...chartButtonsRowStyle,
                  marginTop: 0,
                  width: "100%",
                  flexWrap: isMobile ? "wrap" : "nowrap",
                }}
                aria-label="Chart views"
              >
                <Link
                  href={personChartHref(person.xref, displayName, "pedigree")}
                  style={{
                    ...eventsPaginationButtonStyle,
                    padding: "10px 10px",
                    textDecoration: "none",
                    flex: isMobile ? "0 0 calc(50% - 4px)" : 1,
                    minWidth: 0,
                    textAlign: "center",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={onClose}
                >
                  <TreePine size={16} aria-hidden />
                  Pedigree
                </Link>
                <Link
                  href={personChartHref(person.xref, displayName, "descendancy")}
                  style={{
                    ...eventsPaginationButtonStyle,
                    padding: "10px 10px",
                    textDecoration: "none",
                    flex: isMobile ? "0 0 calc(50% - 4px)" : 1,
                    minWidth: 0,
                    textAlign: "center",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={onClose}
                >
                  <GitBranch size={16} aria-hidden />
                  Descendancy chart
                </Link>
                <Link
                  href={personChartHref(person.xref, displayName, "fan")}
                  style={{
                    ...eventsPaginationButtonStyle,
                    padding: "10px 10px",
                    textDecoration: "none",
                    flex: isMobile ? "0 0 calc(50% - 4px)" : 1,
                    minWidth: 0,
                    textAlign: "center",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={onClose}
                >
                  <Fan size={16} aria-hidden />
                  Fan chart
                </Link>
                <Link
                  href={fullProfileHref(person.xref)}
                  style={{
                    ...eventsPaginationButtonStyle,
                    padding: "10px 10px",
                    textDecoration: "none",
                    flex: isMobile ? "0 0 calc(50% - 4px)" : 1,
                    minWidth: 0,
                    textAlign: "center",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onClick={onClose}
                >
                  <UserCircle size={16} aria-hidden />
                  Full profile
                </Link>
              </div>
            </Section>
            </AnimatedSection>
            <AnimatedSection staggerIndex={8}>
              <button type="button" onClick={onClose} style={{ ...closeButtonStyle, width: "100%", marginTop: 16 }}>
                Close
              </button>
            </AnimatedSection>
          </>
        )}
        </OverlayScrollRoot>
      </OverlayScrollProvider>
    </>
  );
}
