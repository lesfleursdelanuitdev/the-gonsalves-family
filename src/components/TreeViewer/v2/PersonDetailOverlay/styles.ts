import type React from "react";

export const SECTION_BORDER_RADIUS = 10;

export const OVERLAY_C1 = "#efe7d6";
export const OVERLAY_C2 = "#f4efe2";

export const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: "5%",
  left: "5%",
  width: "90%",
  maxWidth: "90vw",
  height: "90%",
  maxHeight: "90vh",
  margin: 0,
  background: OVERLAY_C1,
  border: "1px solid var(--border, #e0d9cc)",
  borderRadius: 12,
  boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
  zIndex: 501,
  overflow: "auto",
  padding: 24,
  paddingTop: 40,
};

export const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: "rgba(229, 220, 200, 0.85)",
  borderRadius: SECTION_BORDER_RADIUS,
  padding: 0,
  marginTop: 16,
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
};

export const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  padding: "16px 16px",
  borderTopLeftRadius: SECTION_BORDER_RADIUS,
  borderTopRightRadius: SECTION_BORDER_RADIUS,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  border: "1px solid rgba(46, 122, 82, 0.12)",
  backgroundColor: "rgba(46, 122, 82, 0.06)",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#14532d",
};

export const sectionContentStyle: React.CSSProperties = {
  borderLeft: "1px solid rgba(0, 0, 0, 0.04)",
  borderRight: "1px solid rgba(0, 0, 0, 0.04)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
  borderBottomLeftRadius: SECTION_BORDER_RADIUS,
  borderBottomRightRadius: SECTION_BORDER_RADIUS,
  padding: "16px 16px",
  backgroundColor: "rgba(0, 0, 0, 0.02)",
};

export const sectionDescriptionStyle: React.CSSProperties = {
  margin: "0 12px 12px 12px",
  fontSize: 16,
  lineHeight: 1.4,
  color: "rgba(0, 0, 0, 0.65)",
  fontFamily: "system-ui, sans-serif",
};

export const familyGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 0,
  fontSize: 14,
};

export const eventsPaginationBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "12px 12px",
  backgroundColor: "rgba(46, 122, 82, 0.04)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
  fontSize: 13,
};
export const eventsPaginationButtonStyle: React.CSSProperties = {
  padding: "4px 10px",
  border: "1px solid rgba(46, 122, 82, 0.25)",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  color: "#14532d",
  backgroundColor: "rgba(46, 122, 82, 0.08)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const eventsFilterRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
};
export const eventsFilterLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#14532d",
};
export const eventsFilterSelectStyle: React.CSSProperties = {
  padding: "4px 10px",
  border: "1px solid rgba(46, 122, 82, 0.25)",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  color: "#fff",
  backgroundColor: "rgba(46, 122, 82, 0.75)",
  fontFamily: "inherit",
  minWidth: 0,
  cursor: "pointer",
};
export const eventsFilterSelectButtonStyle: React.CSSProperties = {
  display: "block",
  width: "calc(100% - 24px)",
  margin: "8px 12px 0 12px",
  padding: "8px 12px",
  border: "1px solid rgba(46, 122, 82, 0.3)",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  color: "#14532d",
  backgroundColor: "rgba(46, 122, 82, 0.1)",
  cursor: "pointer",
  fontFamily: "inherit",
};
export const eventsFilterPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  marginBottom: 8,
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  color: "#14532d",
  backgroundColor: "rgba(46, 122, 82, 0.12)",
  border: "1px solid rgba(46, 122, 82, 0.2)",
};
export const eventsFilterPillCloseStyle: React.CSSProperties = {
  padding: 0,
  margin: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  color: "#14532d",
  fontSize: 14,
  lineHeight: 1,
  opacity: 0.8,
};

export const familyNumberTabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  marginTop: 12,
  marginBottom: 12,
};

export const familyNumberTabStyle: React.CSSProperties = {
  minWidth: 28,
  padding: "6px 10px",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  color: "#14532d",
  backgroundColor: "rgba(46, 122, 82, 0.06)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const familyNumberTabSelectedStyle: React.CSSProperties = {
  ...familyNumberTabStyle,
  backgroundColor: "rgba(46, 122, 82, 0.12)",
};

export const familyGridChildrenStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 0,
  gridColumn: "1 / -1",
};

export const rowBorderBottom = "1px solid rgba(0, 0, 0, 0.1)";
export const noRowBorder = { borderBottom: "none" as const };

export const familyGridHeaderRowStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  padding: "12px 12px",
  backgroundColor: "rgba(46, 122, 82, 0.03)",
  fontWeight: 600,
  borderBottom: rowBorderBottom,
};

export const familyGridSubHeaderRowStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  padding: "12px 12px",
  backgroundColor: "rgba(46, 122, 82, 0.03)",
  fontWeight: 600,
  borderBottom: rowBorderBottom,
};

export const familyGridLabelCellStyle: React.CSSProperties = {
  padding: "12px 12px",
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  fontWeight: 600,
  borderBottom: rowBorderBottom,
  borderRight: "1px solid rgba(0, 0, 0, 0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

export const familyGridNumberCellStyle: React.CSSProperties = {
  padding: "12px 0.2rem",
  backgroundColor: "rgba(0, 0, 0, 0.06)",
  fontWeight: 600,
  textAlign: "center",
  borderBottom: rowBorderBottom,
};

export const familyGridDataCellStyle: React.CSSProperties = {
  padding: "12px 12px",
  borderBottom: rowBorderBottom,
};

/** Events section: first column (dates) – same as data cell but with a right border; date centered in cell. */
export const eventsDateCellStyle: React.CSSProperties = {
  ...familyGridDataCellStyle,
  borderRight: rowBorderBottom,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  color: "#215b36",
};

export const sectionTitleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const sectionIconWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 42,
  height: 42,
  borderRadius: "50%",
  padding: 8,
  backgroundColor: "rgba(46, 122, 82, 0.15)",
};

export const iconColor = "#14532d";
export const iconSize = 16;

/** Circular background + padding for small icons (e.g. event type, gender). Matches event icons in EventsSection. */
export const iconWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(46, 122, 82, 0.05)",
  borderRadius: "50%",
  padding: 6,
  flexShrink: 0,
  marginRight: 8,
};

export const listUlStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  fontSize: 14,
  listStyleType: "disc",
};

export const loadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 200,
  fontSize: 16,
  color: "var(--tree-text-muted)",
};

export const errorStyle: React.CSSProperties = {
  padding: 16,
  color: "var(--crimson)",
  fontSize: 14,
};

export const closeButtonStyle: React.CSSProperties = {
  padding: "9px 20px",
  fontSize: 13,
  fontFamily: "system-ui, sans-serif",
  fontWeight: 500,
  cursor: "pointer",
  background: "var(--tree-root)",
  border: "1px solid var(--tree-root)",
  borderRadius: 7,
  color: "var(--surface-elevated)",
};

export const chartButtonsRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
};

export const chartButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: 12,
  fontFamily: "system-ui, sans-serif",
  fontWeight: 500,
  cursor: "pointer",
  background: "rgba(46, 122, 82, 0.08)",
  border: "1px solid rgba(46, 122, 82, 0.2)",
  borderRadius: 6,
  color: "#14532d",
  textDecoration: "none",
};

export const profileHeaderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

export const profileHeaderAvatarColumnStyle: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "stretch",
};

export const profileHeaderAvatarPlaceholderStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  backgroundColor: "rgba(46, 122, 82, 0.15)",
  border: "1px solid rgba(46, 122, 82, 0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const profileHeaderNameColumnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

export const profileHeaderNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 600,
  fontFamily: "var(--font-heading-raw), serif",
  color: "var(--heading)",
};

/** Last-name underline colors (two shades darker than PersonNodeView for better contrast in overlay). */
export const NAME_UNDERLINE_MALE = "#6fa3c4";
export const NAME_UNDERLINE_FEMALE = "#c97a94";
export const NAME_UNDERLINE_OTHER = "#7ab87b";

/** Gender colors for overlay gradient only — 11 shades lighter than underline colors. */
const NAME_GRADIENT_MALE = "#f0f7fa";
const NAME_GRADIENT_FEMALE = "#fdf3f5";
const NAME_GRADIENT_OTHER = "#f6fbf6";

export function getLastNameUnderlineColor(gender: string | null | undefined): string {
  if (gender === "Male") return NAME_UNDERLINE_MALE;
  if (gender === "Female") return NAME_UNDERLINE_FEMALE;
  return NAME_UNDERLINE_OTHER;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Gender icon wrap: same as iconWrapStyle but background is the icon color at 5% opacity. */
export function getGenderIconWrapStyle(gender: string | null | undefined): React.CSSProperties {
  const color = getLastNameUnderlineColor(gender);
  return {
    ...iconWrapStyle,
    backgroundColor: hexToRgba(color, 0.05),
  };
}

function getOverlayGenderColor(gender: string | null | undefined): string {
  if (gender === "Male") return NAME_GRADIENT_MALE;
  if (gender === "Female") return NAME_GRADIENT_FEMALE;
  return NAME_GRADIENT_OTHER;
}

/** Overlay background gradient: C1 → gender color (faded) → C2 → C1. */
export function getOverlayBackground(gender: string | null | undefined): string {
  const genderColor = getOverlayGenderColor(gender);
  return `linear-gradient(to bottom, ${OVERLAY_C1}, ${genderColor}, ${OVERLAY_C2}, ${OVERLAY_C1})`;
}

export const profileHeaderLastNameStyle: React.CSSProperties = {
  fontStyle: "italic",
  borderBottom: "2px solid #8b2e2e",
};

export function getProfileHeaderLastNameStyle(gender?: string | null): React.CSSProperties {
  return {
    fontStyle: "italic",
    borderBottom: `2px solid ${getLastNameUnderlineColor(gender)}`,
  };
}

/** Mobile overrides: smaller overlay and header text, reduced padding */
export const overlayStyleMobile: React.CSSProperties = {
  fontSize: 13,
  padding: 12,
  paddingTop: 20,
};

export const profileHeaderNameStyleMobile: React.CSSProperties = {
  fontSize: 18,
};

export const profileHeaderDatesStyleMobile: React.CSSProperties = {
  fontSize: 12,
};

export const sectionTitleStyleMobile: React.CSSProperties = {
  fontSize: 12,
  padding: "14px 12px",
};

export const sectionContentStyleMobile: React.CSSProperties = {
  fontSize: 13,
  padding: "14px 12px",
};

export const sectionDescriptionStyleMobile: React.CSSProperties = {
  fontSize: 14,
};

export const profileHeaderAvatarPlaceholderStyleMobile: React.CSSProperties = {
  width: 56,
  height: 56,
};
