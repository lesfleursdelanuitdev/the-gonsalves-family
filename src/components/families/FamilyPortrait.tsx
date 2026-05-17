import type { CSSProperties } from "react";
import Image from "next/image";
import { getNameBackgroundColor } from "@/lib/person-name-accent";
import type { PublicFamilyPartner } from "./types";

const PERSON_CARD_FALLBACK_BG = "/images/personCardBg.png";

const AVATAR_SIZE = {
  card: {
    shell: "h-24 w-24 sm:h-28 sm:w-28",
    borderClass: "border-[5px]",
    initials: "text-3xl sm:text-4xl",
    imageSizes: "(max-width: 640px) 96px, 112px",
    overlap: "-ml-10 sm:-ml-12",
    empty: "h-24 w-24 sm:h-28 sm:w-28",
  },
  hero: {
    shell: "h-[72px] w-[72px]",
    borderClass: "border-4",
    initials: "text-2xl",
    imageSizes: "72px",
    overlap: "-ml-8",
    empty: "h-[72px] w-[72px]",
  },
} as const;

export type FamilyAvatarSize = keyof typeof AVATAR_SIZE;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0]?.toUpperCase() ?? "") : "";
  return (first + last) || "?";
}

function PartnerAvatar({
  partner,
  className,
  style,
  size = "card",
}: {
  partner: PublicFamilyPartner;
  className?: string;
  style?: CSSProperties;
  size?: FamilyAvatarSize;
}) {
  const borderColor = getNameBackgroundColor(partner.sex ?? partner.gender);
  const dims = AVATAR_SIZE[size];

  return (
    <div className={`shrink-0 p-1.5 ${className ?? ""}`} style={style}>
      <div
        className={`relative overflow-hidden rounded-full bg-surface shadow-[0_14px_34px_rgba(40,28,18,0.22)] ${dims.shell} ${dims.borderClass}`}
        style={{ borderColor }}
      >
        {partner.portraitSrc ? (
          <Image
            src={partner.portraitSrc}
            alt={partner.fullName}
            fill
            className="object-cover sepia-[0.2]"
            sizes={dims.imageSizes}
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center font-heading font-semibold tracking-[0.04em] text-link ${dims.initials}`}
          >
            {initials(partner.fullName)}
          </span>
        )}
      </div>
    </div>
  );
}

/** Overlapping partner avatars for family cards and mobile hero. */
export function FamilyOverlappingAvatars({
  partners,
  size = "card",
}: {
  partners: PublicFamilyPartner[];
  size?: FamilyAvatarSize;
}) {
  const dims = AVATAR_SIZE[size];

  if (partners.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full border-border-subtle bg-surface-elevated shadow-[0_14px_34px_rgba(40,28,18,0.18)] ${dims.empty} ${dims.borderClass} border`}
      >
        <span className={`font-heading font-semibold text-muted ${dims.initials}`}>?</span>
      </div>
    );
  }

  if (partners.length === 1) {
    return <PartnerAvatar partner={partners[0]!} size={size} />;
  }

  return (
    <div className="relative flex items-center justify-center">
      <PartnerAvatar partner={partners[0]!} className="relative z-0" size={size} />
      <PartnerAvatar partner={partners[1]!} className={`relative z-10 ${dims.overlap}`} size={size} />
    </div>
  );
}

/** Card-style family portrait: aged-paper frame with overlapping partner avatars only. */
export function FamilyPortrait({
  partners,
  className = "",
  interactive = false,
}: {
  partners: PublicFamilyPartner[];
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[4/5] w-full min-w-0 overflow-hidden bg-surface ${className}`.trim()}
    >
      <Image
        src={PERSON_CARD_FALLBACK_BG}
        alt=""
        fill
        className={`object-cover object-center sepia-[0.28] saturate-[0.72] ${interactive ? "transition duration-500 group-hover:scale-[1.03]" : ""}`}
        sizes="(max-width: 768px) 40vw, 220px"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,241,228,0.06),rgba(64,41,24,0.18)),radial-gradient(circle_at_center,rgba(255,248,232,0.08),rgba(44,30,20,0.18))]" />
      <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
        <FamilyOverlappingAvatars partners={partners} />
      </div>
    </div>
  );
}
