"use client";

import { useEffect, useState } from "react";
import { Heart, Home, Users } from "lucide-react";
import type { CSSProperties } from "react";
import { Section } from "./Section";
import { FamiliesAsChildContent } from "./FamiliesAsChildContent";
import { FamiliesAsSpouseContent } from "./FamiliesAsSpouseContent";
import {
  familyNumberTabSelectedStyle,
  familyNumberTabStyle,
  iconColor,
  iconSize,
  SECTION_BORDER_RADIUS,
} from "./styles";
import type { FamiliesAsChildResponse, FamiliesAsSpouseResponse, PersonDetailOverlayPerson } from "./types";

type FamilyOfOrigin = FamiliesAsChildResponse["familiesOfOrigin"][number];
type FamilyAsSpouse = FamiliesAsSpouseResponse["familiesAsSpouse"][number];

type PrimaryTab = "child" | "spouse";

export interface FamiliesSectionProps {
  personXref: string;
  familiesOfOrigin: FamilyOfOrigin[];
  familiesAsSpouse: FamilyAsSpouse[];
  selectedChildFamilyIndex: number;
  onSelectChildFamilyIndex: (index: number) => void;
  selectedSpouseFamilyIndex: number;
  onSelectSpouseFamilyIndex: (index: number) => void;
  onSelectLinkedPerson?: (person: PersonDetailOverlayPerson) => void;
  isMobile?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const primaryTabBarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 4,
  paddingBottom: 12,
};

function primaryTabButtonStyle(selected: boolean, disabled: boolean): CSSProperties {
  return {
    ...familyNumberTabStyle,
    ...(selected ? familyNumberTabSelectedStyle : {}),
    flex: "1 1 0",
    minWidth: 0,
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
    letterSpacing: "0.02em",
    textTransform: "none" as const,
    ...(disabled ? { opacity: 0.45, cursor: "not-allowed" } : {}),
  };
}

const primaryTabInnerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
};

const emptyPanelStyle: CSSProperties = {
  margin: 0,
  padding: "16px 16px 20px",
  fontSize: 14,
  lineHeight: 1.45,
  color: "rgba(20, 40, 25, 0.72)",
};

const DESCRIPTION_AS_CHILD =
  "The family or families this person was part of as a child—parents and siblings (by birth, adoption, or foster care).";

const DESCRIPTION_AS_SPOUSE =
  "This person's adult partnerships and the children from those unions.";

export function FamiliesSection({
  personXref,
  familiesOfOrigin,
  familiesAsSpouse,
  selectedChildFamilyIndex,
  onSelectChildFamilyIndex,
  selectedSpouseFamilyIndex,
  onSelectSpouseFamilyIndex,
  onSelectLinkedPerson,
  isMobile,
  expanded,
  onExpandedChange,
}: FamiliesSectionProps) {
  const hasChild = familiesOfOrigin.length > 0;
  const hasSpouse = familiesAsSpouse.length > 0;
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("child");

  useEffect(() => {
    if (hasChild && !hasSpouse) setPrimaryTab("child");
    else if (!hasChild && hasSpouse) setPrimaryTab("spouse");
    else setPrimaryTab("child");
  }, [personXref, hasChild, hasSpouse]);

  if (!hasChild && !hasSpouse) return null;

  const innerHasNumberedTabs =
    (primaryTab === "child" && familiesOfOrigin.length > 1) ||
    (primaryTab === "spouse" && familiesAsSpouse.length > 1);

  const sectionDescription =
    primaryTab === "child" ? DESCRIPTION_AS_CHILD : DESCRIPTION_AS_SPOUSE;

  return (
    <Section
      icon={<Users size={iconSize} color={iconColor} aria-hidden />}
      title="Families"
      collapsible
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      description={sectionDescription}
      descriptionStyle={{ paddingTop: 12, paddingBottom: 9 }}
      isMobile={isMobile}
      contentStyle={{
        paddingTop: innerHasNumberedTabs ? 12 : 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        borderBottomLeftRadius: SECTION_BORDER_RADIUS,
        borderBottomRightRadius: SECTION_BORDER_RADIUS,
      }}
    >
      <div role="tablist" aria-label="Family view" style={primaryTabBarStyle}>
        <button
          type="button"
          role="tab"
          aria-selected={primaryTab === "child"}
          aria-disabled={!hasChild}
          disabled={!hasChild}
          style={primaryTabButtonStyle(primaryTab === "child", !hasChild)}
          onClick={() => hasChild && setPrimaryTab("child")}
        >
          <span style={primaryTabInnerRowStyle}>
            <Home size={iconSize} color={iconColor} aria-hidden />
            <span>Parents & Siblings</span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={primaryTab === "spouse"}
          aria-disabled={!hasSpouse}
          disabled={!hasSpouse}
          style={primaryTabButtonStyle(primaryTab === "spouse", !hasSpouse)}
          onClick={() => hasSpouse && setPrimaryTab("spouse")}
        >
          <span style={primaryTabInnerRowStyle}>
            <Heart size={iconSize} color={iconColor} aria-hidden />
            <span>Partner(s) & children</span>
          </span>
        </button>
      </div>
      {primaryTab === "child" ? (
        hasChild ? (
          <FamiliesAsChildContent
            familiesOfOrigin={familiesOfOrigin}
            selectedIndex={selectedChildFamilyIndex}
            onSelectIndex={onSelectChildFamilyIndex}
            subjectXref={personXref}
            onSelectLinkedPerson={onSelectLinkedPerson}
            isMobile={isMobile}
          />
        ) : (
          <p style={emptyPanelStyle}>No families as child are recorded for this person.</p>
        )
      ) : hasSpouse ? (
        <FamiliesAsSpouseContent
          familiesAsSpouse={familiesAsSpouse}
          selectedIndex={selectedSpouseFamilyIndex}
          onSelectIndex={onSelectSpouseFamilyIndex}
          onSelectLinkedPerson={onSelectLinkedPerson}
          isMobile={isMobile}
        />
      ) : (
        <p style={emptyPanelStyle}>No families as spouse or partner are recorded for this person.</p>
      )}
    </Section>
  );
}
