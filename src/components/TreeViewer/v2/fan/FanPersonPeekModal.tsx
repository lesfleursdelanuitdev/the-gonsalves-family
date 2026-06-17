"use client";

import { Calendar, MapPin } from "lucide-react";
import { COLORS } from "@/lib/person-card-layout";
import { getNameBackgroundColor, NAME_UNDERLINE_PX } from "@/lib/person-name-accent";
import { useLivingPrivacyDisplay } from "@/hooks/useLivingPrivacyDisplay";
import type { FanMoreClickPayload } from "./fanPeekTypes";

const overlayBase: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 260,
};

function personIsLiving(p: FanMoreClickPayload): boolean {
  return p.isLiving === true;
}

function initialsFromPayload(p: FanMoreClickPayload): string {
  const a = (p.firstName?.[0] ?? "").toUpperCase();
  const b = (p.lastName?.[0] ?? "").toUpperCase();
  const s = `${a}${b}`.trim();
  return s || "?";
}

function formatDates(p: FanMoreClickPayload, restricted: boolean): string | null {
  const b = p.birthYear;
  const d = p.deathYear;
  if (restricted) {
    return b != null ? String(b) : null;
  }
  if (b == null && d == null) return null;
  const left = b != null ? String(b) : "?";
  const right = d != null ? String(d) : "present";
  return `${left} — ${right}`;
}

/** Full place string from API — never truncated to a single segment. */
function fullPlace(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t === "" ? null : t;
}

export interface FanPersonPeekModalProps {
  open: boolean;
  payload: FanMoreClickPayload | null;
  isRoot: boolean;
  isMobile?: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onMakeRoot: () => void;
  /** Opens multi-family FAMC picker (pedigree API); only used when payload.hasMultipleFamiliesAsChild. */
  onChooseParentFamily?: () => void;
}

export function FanPersonPeekModal({
  open,
  payload,
  isRoot,
  isMobile = false,
  onClose,
  onViewProfile,
  onMakeRoot,
  onChooseParentFamily,
}: FanPersonPeekModalProps) {
  const { shouldShowMinimalLiving, formatMinimalLivingLabel } = useLivingPrivacyDisplay();

  if (!open || !payload) return null;

  const living = personIsLiving(payload);
  const restricted = shouldShowMinimalLiving(living);
  const displayName = restricted
    ? formatMinimalLivingLabel(payload.name.trim() || "Unknown", payload.birthYear ?? null)
    : payload.name.trim() || "Unknown";
  const datesLine = formatDates(payload, restricted);
  const birthPlaceLine = restricted ? null : fullPlace(payload.birthPlace);
  const deathPlaceLine = restricted ? null : fullPlace(payload.deathPlace);
  const photo = restricted ? "" : (payload.photoUrl ?? "").trim();
  const initials = initialsFromPayload(payload);
  const avatarPx = isMobile ? 70 : 168;
  const avatarRingPx = isMobile ? 2 : 5;
  const avatarRingColor = living ? COLORS.green : COLORS.date;
  const iconCal = isMobile ? 16 : 32;
  const iconPlace = isMobile ? 14 : 30;
  const placeFontSize = isMobile ? 12 : 20;

  const overlay: React.CSSProperties = {
    ...overlayBase,
    padding: isMobile ? 10 : 28,
  };

  const panel: React.CSSProperties = {
    background: COLORS.card,
    border: `1px solid ${COLORS.cardStroke}`,
    borderRadius: isMobile ? 12 : 22,
    padding: isMobile ? "18px 14px 14px" : "44px 44px 36px",
    maxWidth: isMobile ? "min(100%, 300px)" : 620,
    width: "100%",
    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
    position: "relative",
    maxHeight: isMobile ? "min(82dvh, 100%)" : undefined,
    overflowY: isMobile ? "auto" : undefined,
  };

  const btnPrimary: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: isMobile ? 8 : 14,
    padding: isMobile ? "10px 12px" : "19px 24px",
    fontSize: isMobile ? 13 : 20,
    lineHeight: 1.35,
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
    cursor: "pointer",
    border: `1px solid ${COLORS.cardStroke}`,
    background: COLORS.iconBg,
    color: COLORS.text,
  };

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary,
    background: COLORS.green,
    color: "#faf7f0",
    border: `1px solid ${COLORS.green}`,
  };

  const btnDisabled: React.CSSProperties = {
    ...btnSecondary,
    opacity: 0.45,
    cursor: "not-allowed",
  };

  const showChooseParentFamily =
    Boolean(payload.hasMultipleFamiliesAsChild) && typeof onChooseParentFamily === "function";

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <div style={panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fan-peek-name">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: isMobile ? 4 : 14,
            right: isMobile ? 4 : 14,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: isMobile ? 22 : 34,
            lineHeight: 1,
            color: COLORS.muted,
            padding: isMobile ? 4 : 8,
          }}
        >
          ×
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: isMobile ? 10 : 30,
            paddingTop: isMobile ? 2 : 8,
          }}
        >
          <div
            style={{
              width: avatarPx,
              height: avatarPx,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: `${avatarRingPx}px solid ${avatarRingColor}`,
              background: COLORS.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photo ? (
              <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span
                className="font-heading"
                style={{
                  fontSize: avatarPx * 0.36,
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                {initials}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <div
              id="fan-peek-name"
              className="font-heading"
              style={{
                textAlign: "center",
                fontSize: isMobile ? "1.05rem" : "2rem",
                fontWeight: 700,
                color: COLORS.text,
                lineHeight: 1.28,
                letterSpacing: "0.01em",
                wordBreak: "break-word",
                hyphens: "auto",
                borderBottom: `${isMobile ? 2 : NAME_UNDERLINE_PX}px solid ${getNameBackgroundColor(payload.gender)}`,
                display: "inline-block",
                maxWidth: "100%",
                verticalAlign: "bottom",
                boxSizing: "border-box",
                paddingBottom: 2,
              }}
            >
              {displayName}
            </div>

            {(!restricted && (datesLine || birthPlaceLine || deathPlaceLine)) ? (
              <div
                style={{
                  alignSelf: "stretch",
                  marginTop: isMobile ? 8 : 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 8 : 16,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {datesLine ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: isMobile ? 6 : 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Calendar
                      size={iconCal}
                      color={COLORS.date}
                      strokeWidth={isMobile ? 1.5 : 2}
                      aria-hidden
                      style={{ flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: isMobile ? 13 : 26,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: COLORS.date,
                        fontFamily: "system-ui, sans-serif",
                        lineHeight: 1.35,
                        textAlign: "center",
                      }}
                    >
                      {datesLine}
                    </span>
                  </div>
                ) : null}

                {birthPlaceLine ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: isMobile ? 6 : 12,
                      width: "100%",
                      justifyContent: "flex-start",
                    }}
                  >
                    <MapPin
                      size={iconPlace}
                      color={COLORS.muted}
                      strokeWidth={isMobile ? 1.5 : 2}
                      aria-hidden
                      style={{ flexShrink: 0, marginTop: isMobile ? 2 : 3 }}
                    />
                    <span
                      style={{
                        fontSize: placeFontSize,
                        fontWeight: 500,
                        color: COLORS.text,
                        fontFamily: "system-ui, sans-serif",
                        lineHeight: 1.45,
                        textAlign: "left",
                        wordBreak: "break-word",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Born at: </span>
                      {birthPlaceLine}
                    </span>
                  </div>
                ) : null}

                {deathPlaceLine ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: isMobile ? 6 : 12,
                      width: "100%",
                      justifyContent: "flex-start",
                    }}
                  >
                    <MapPin
                      size={iconPlace}
                      color={COLORS.muted}
                      strokeWidth={isMobile ? 1.5 : 2}
                      aria-hidden
                      style={{ flexShrink: 0, marginTop: isMobile ? 2 : 3 }}
                    />
                    <span
                      style={{
                        fontSize: placeFontSize,
                        fontWeight: 500,
                        color: COLORS.text,
                        fontFamily: "system-ui, sans-serif",
                        lineHeight: 1.45,
                        textAlign: "left",
                        wordBreak: "break-word",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Died at: </span>
                      {deathPlaceLine}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              flexWrap: isMobile ? "nowrap" : "wrap",
              gap: isMobile ? 8 : 16,
              width: "100%",
              marginTop: isMobile ? 8 : 16,
              justifyContent: "stretch",
            }}
          >
            <button
              type="button"
              style={{ ...btnPrimary, ...(!isMobile ? { flex: 1, minWidth: 0 } : {}) }}
              onClick={onViewProfile}
            >
              {restricted ? "Sign in to view profile" : "View profile"}
            </button>
            {showChooseParentFamily ? (
              <button
                type="button"
                style={{ ...btnPrimary, ...(!isMobile ? { flex: 1, minWidth: 0 } : {}) }}
                onClick={onChooseParentFamily}
              >
                Choose parent family
              </button>
            ) : null}
            <button
              type="button"
              style={{
                ...(isRoot ? btnDisabled : btnSecondary),
                ...(!isMobile ? { flex: 1, minWidth: 0 } : {}),
              }}
              onClick={isRoot ? undefined : onMakeRoot}
              disabled={isRoot}
              aria-disabled={isRoot}
            >
              {isRoot ? "Already chart root" : "Make root of fan chart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
