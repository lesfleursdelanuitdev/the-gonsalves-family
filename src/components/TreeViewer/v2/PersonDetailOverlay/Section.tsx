"use client";

import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  SECTION_BORDER_RADIUS,
  iconColor,
  sectionBoxStyle,
  sectionContentStyle,
  sectionContentStyleMobile,
  sectionDescriptionStyle,
  sectionDescriptionStyleMobile,
  sectionIconWrapStyle,
  sectionTitleRowStyle,
  sectionTitleStyle,
  sectionTitleStyleMobile,
} from "./styles";

interface SectionProps {
  icon: ReactNode;
  title: string;
  /** Short explanation shown below the header, at the top of the content. */
  description?: string;
  /** Optional extra styles for the description paragraph (e.g. marginTop). */
  descriptionStyle?: CSSProperties;
  children: ReactNode;
  contentStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  /** Merged onto the outer `<section>` (after `sectionBoxStyle`). */
  rootStyle?: CSSProperties;
  isMobile?: boolean;
  /** When true, the header toggles visibility of the body (default expanded unless `defaultExpanded` is false). */
  collapsible?: boolean;
  /** Only used when `collapsible` is true. Default: open. */
  defaultExpanded?: boolean;
  /** Controlled expanded state when `collapsible`; both `expanded` and `onExpandedChange` should be supplied. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function Section({
  icon,
  title,
  description,
  descriptionStyle,
  children,
  contentStyle,
  titleStyle,
  rootStyle,
  isMobile,
  collapsible = false,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
}: SectionProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const expandedResolved = collapsible
    ? expanded !== undefined
      ? expanded
      : uncontrolledExpanded
    : true;
  const uid = useId().replace(/:/g, "");
  const headingId = `section-h-${uid}`;
  const panelId = `section-panel-${uid}`;

  const showBody = !collapsible || expandedResolved;

  const toggleExpanded = () => {
    if (!collapsible) return;
    const next = !expandedResolved;
    if (expanded !== undefined) onExpandedChange?.(next);
    else setUncontrolledExpanded(next);
  };

  const collapsibleButtonStyle: CSSProperties = {
    ...sectionTitleStyle,
    ...(isMobile ? sectionTitleStyleMobile : {}),
    ...titleStyle,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    ...(expandedResolved
      ? {}
      : {
          borderBottomLeftRadius: SECTION_BORDER_RADIUS,
          borderBottomRightRadius: SECTION_BORDER_RADIUS,
        }),
  };

  const staticTitleStyle: CSSProperties = {
    ...sectionTitleStyle,
    ...sectionTitleRowStyle,
    ...(isMobile ? sectionTitleStyleMobile : {}),
    ...titleStyle,
  };

  return (
    <section style={{ ...sectionBoxStyle, ...rootStyle }}>
      {collapsible ? (
        <h3 style={{ margin: 0, padding: 0, border: "none", font: "inherit" }}>
          <button
            type="button"
            id={headingId}
            aria-expanded={expandedResolved}
            aria-controls={panelId}
            aria-label={expandedResolved ? `Collapse ${title}` : `Expand ${title}`}
            onClick={toggleExpanded}
            style={collapsibleButtonStyle}
          >
            <span style={{ ...sectionTitleRowStyle, minWidth: 0 }}>
              <span style={sectionIconWrapStyle}>{icon}</span>
              {title}
            </span>
            {expandedResolved ? (
              <ChevronUp size={18} style={{ flexShrink: 0, color: iconColor }} aria-hidden />
            ) : (
              <ChevronDown size={18} style={{ flexShrink: 0, color: iconColor }} aria-hidden />
            )}
          </button>
        </h3>
      ) : (
        <h3 style={staticTitleStyle}>
          <span style={sectionIconWrapStyle}>{icon}</span> {title}
        </h3>
      )}
      {showBody ? (
        <div
          id={collapsible ? panelId : undefined}
          role={collapsible ? "region" : undefined}
          aria-labelledby={collapsible ? headingId : undefined}
          style={{
            ...sectionContentStyle,
            ...(isMobile ? sectionContentStyleMobile : {}),
            ...contentStyle,
          }}
        >
          {description != null && description !== "" ? (
            <p
              style={{
                ...sectionDescriptionStyle,
                ...(isMobile ? sectionDescriptionStyleMobile : {}),
                ...descriptionStyle,
              }}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
