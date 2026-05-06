"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Compass, Fan, GitBranch, TreePine, UserCircle } from "lucide-react";
import { personChartHref, fullProfileHref } from "./utils";
import {
  sectionBoxStyle,
  sectionTitleStyle,
  sectionContentStyle,
  sectionContentStyleMobile,
  sectionIconWrapStyle,
  sectionTitleStyleMobile,
  sectionDescriptionStyle,
  sectionDescriptionStyleMobile,
  SECTION_BORDER_RADIUS,
  chartButtonsRowStyle,
  eventsPaginationButtonStyle,
  iconColor,
  iconSize,
} from "./styles";

export interface ExploreMoreSectionProps {
  personXref: string;
  displayName: string;
  isMobile?: boolean;
  onLinkClick: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExploreMoreSection({
  personXref,
  displayName,
  isMobile,
  onLinkClick,
  open,
  onOpenChange,
}: ExploreMoreSectionProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const openResolved = open !== undefined ? open : internalOpen;
  const toggleOpen = () => {
    const next = !openResolved;
    onOpenChange?.(next);
    if (open === undefined) setInternalOpen(next);
  };

  return (
    <section style={sectionBoxStyle}>
      <h3 style={{ margin: 0, padding: 0, border: "none", font: "inherit" }}>
        <button
          type="button"
          id="explore-more-section-toggle"
          aria-expanded={openResolved}
          aria-controls="explore-more-section-content"
          aria-label={openResolved ? "Collapse explore more" : "Expand explore more"}
          onClick={toggleOpen}
          style={{
            ...sectionTitleStyle,
            ...(isMobile ? sectionTitleStyleMobile : {}),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            ...(openResolved
              ? {}
              : {
                  borderBottomLeftRadius: SECTION_BORDER_RADIUS,
                  borderBottomRightRadius: SECTION_BORDER_RADIUS,
                }),
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={sectionIconWrapStyle}>
              <Compass size={iconSize} color={iconColor} aria-hidden />
            </span>
            Explore more
          </span>
          {openResolved ? (
            <ChevronUp size={18} style={{ flexShrink: 0, color: iconColor }} aria-hidden />
          ) : (
            <ChevronDown size={18} style={{ flexShrink: 0, color: iconColor }} aria-hidden />
          )}
        </button>
      </h3>
      {openResolved ? (
        <div
          id="explore-more-section-content"
          role="region"
          aria-labelledby="explore-more-section-toggle"
          style={{
            ...sectionContentStyle,
            ...(isMobile ? sectionContentStyleMobile : {}),
            padding: 12,
            borderBottomLeftRadius: SECTION_BORDER_RADIUS,
            borderBottomRightRadius: SECTION_BORDER_RADIUS,
          }}
        >
          <p
            style={{
              ...sectionDescriptionStyle,
              ...(isMobile ? sectionDescriptionStyleMobile : {}),
              margin: "0 0 12px 0",
            }}
          >
            View this person in other charts or open their full profile page.
          </p>
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
              href={personChartHref(personXref, displayName, "pedigree")}
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
              onClick={onLinkClick}
            >
              <TreePine size={16} aria-hidden />
              Pedigree
            </Link>
            <Link
              href={personChartHref(personXref, displayName, "descendancy")}
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
              onClick={onLinkClick}
            >
              <GitBranch size={16} aria-hidden />
              Descendancy chart
            </Link>
            <Link
              href={personChartHref(personXref, displayName, "fan")}
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
              onClick={onLinkClick}
            >
              <Fan size={16} aria-hidden />
              Fan chart
            </Link>
            <Link
              href={fullProfileHref(personXref)}
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
              onClick={onLinkClick}
            >
              <UserCircle size={16} aria-hidden />
              Full profile
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
