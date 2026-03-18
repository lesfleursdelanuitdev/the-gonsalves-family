"use client";

import { User } from "lucide-react";
import { computedAge, displayXref, type DateYMD } from "./utils";
import {
  profileHeaderStyle,
  profileHeaderAvatarColumnStyle,
  profileHeaderAvatarPlaceholderStyle,
  profileHeaderNameColumnStyle,
  profileHeaderNameStyle,
  getProfileHeaderLastNameStyle,
  profileHeaderNameStyleMobile,
  profileHeaderDatesStyleMobile,
  profileHeaderAvatarPlaceholderStyleMobile,
  iconColor,
} from "./styles";

interface PersonDetailOverlayProfileHeaderProps {
  xref: string;
  first: string;
  last: string;
  birthDate?: string | null;
  deathDate?: string | null;
  living?: boolean;
  gender?: string | null;
  isMobile?: boolean;
  birthYMD?: DateYMD | null;
  deathYMD?: DateYMD | null;
}

export function PersonDetailOverlayProfileHeader({
  xref,
  first,
  last,
  birthDate,
  deathDate,
  living = true,
  gender = null,
  isMobile = false,
  birthYMD = null,
  deathYMD = null,
}: PersonDetailOverlayProfileHeaderProps) {
  const birthStr = (birthDate ?? "").trim();
  const deathStr = (deathDate ?? "").trim();
  const birthLabel = birthStr !== "" ? birthStr : "—";
  const showDates = birthStr !== "" || living === false;
  const datesLine =
    living === true
      ? birthLabel
      : deathStr !== ""
        ? `${birthLabel} – ${deathStr}`
        : `${birthLabel} – ?`;
  const ageDisplay = computedAge(birthDate, deathDate, living ?? true, birthYMD, deathYMD);
  const nameStyle = isMobile ? { ...profileHeaderNameStyle, ...profileHeaderNameStyleMobile } : profileHeaderNameStyle;
  const xrefStyle = isMobile
    ? { margin: 0, marginTop: 8, ...profileHeaderDatesStyleMobile, color: "var(--tree-text-muted, #555)" as const }
    : { margin: 0, marginTop: 2, fontSize: 14, color: "var(--tree-text-muted, #555)" as const };
  const avatarStyle = isMobile
    ? { ...profileHeaderAvatarPlaceholderStyle, ...profileHeaderAvatarPlaceholderStyleMobile }
    : profileHeaderAvatarPlaceholderStyle;

  return (
    <header style={profileHeaderStyle}>
      <div style={profileHeaderAvatarColumnStyle}>
        <div style={avatarStyle} aria-hidden>
          <User size={isMobile ? 28 : 36} color={iconColor} style={{ flexShrink: 0 }} strokeWidth={1.5} />
        </div>
      </div>
      <div style={profileHeaderNameColumnStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showDates && (
            <p className="section-subtitle" style={{ margin: 0, marginBottom: 2, fontSize: "0.65rem" }}>
              {datesLine}
            </p>
          )}
          <h2
            id="person-detail-overlay-title"
            style={nameStyle}
          >
            {first}{first ? " " : null}
            <span style={getProfileHeaderLastNameStyle(gender)}>{last}</span>
          </h2>
          <p style={xrefStyle}>
            {ageDisplay != null && (
              <>
                <strong>AGE: </strong>
                {ageDisplay}
                {" · "}
              </>
            )}
            <strong>XREF: </strong>
            {displayXref(xref)}
          </p>
        </div>
      </div>
    </header>
  );
}
