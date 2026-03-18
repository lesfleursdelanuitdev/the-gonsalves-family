"use client";

import { IconGenderMale, IconGenderFemale, IconGenderAgender } from "@tabler/icons-react";
import { getLastNameUnderlineColor, getGenderIconWrapStyle } from "./styles";

const GENDER_ICON_SIZE = 16;

interface GenderIconProps {
  gender: string | null | undefined;
  size?: number;
  "aria-hidden"?: boolean;
  style?: React.CSSProperties;
}

export function GenderIcon({ gender, size = GENDER_ICON_SIZE, "aria-hidden": ariaHidden = true, style }: GenderIconProps) {
  const color = getLastNameUnderlineColor(gender);
  const iconStyle = { flexShrink: 0, color, ...style };
  const icon =
    gender === "Male" ? (
      <IconGenderMale size={size} stroke={2} style={iconStyle} aria-hidden={ariaHidden} />
    ) : gender === "Female" ? (
      <IconGenderFemale size={size} stroke={2} style={iconStyle} aria-hidden={ariaHidden} />
    ) : (
      <IconGenderAgender size={size} stroke={2} style={iconStyle} aria-hidden={ariaHidden} />
    );
  return <span style={getGenderIconWrapStyle(gender)} aria-hidden={ariaHidden}>{icon}</span>;
}
