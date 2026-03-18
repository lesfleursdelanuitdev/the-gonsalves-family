"use client";

import type { ReactNode } from "react";
import {
  sectionBoxStyle,
  sectionTitleStyle,
  sectionTitleRowStyle,
  sectionContentStyle,
  sectionContentStyleMobile,
  sectionDescriptionStyle,
  sectionDescriptionStyleMobile,
  sectionIconWrapStyle,
  sectionTitleStyleMobile,
} from "./styles";

interface SectionProps {
  icon: ReactNode;
  title: string;
  /** Short explanation shown below the header, at the top of the content. */
  description?: string;
  /** Optional extra styles for the description paragraph (e.g. marginTop). */
  descriptionStyle?: React.CSSProperties;
  children: ReactNode;
  contentStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  isMobile?: boolean;
}

export function Section({ icon, title, description, descriptionStyle, children, contentStyle, titleStyle, isMobile }: SectionProps) {
  return (
    <section style={sectionBoxStyle}>
      <h3
        style={{
          ...sectionTitleStyle,
          ...sectionTitleRowStyle,
          ...(isMobile ? sectionTitleStyleMobile : {}),
          ...titleStyle,
        }}
      >
        <span style={sectionIconWrapStyle}>{icon}</span> {title}
      </h3>
      <div
        style={{
          ...sectionContentStyle,
          ...(isMobile ? sectionContentStyleMobile : {}),
          ...contentStyle,
        }}
      >
        {description != null && description !== "" ? (
          <p style={{ ...sectionDescriptionStyle, ...(isMobile ? sectionDescriptionStyleMobile : {}), ...descriptionStyle }}>{description}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
