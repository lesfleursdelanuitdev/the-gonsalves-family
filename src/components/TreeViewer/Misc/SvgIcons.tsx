export const ICON_PATHS = {
  crown: ["M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z", "M5 21h14"],
  heart: ["M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"],
  arrowUp: ["m5 12 7-7 7 7", "M12 19V5"],
  arrowDown: ["M12 5v14", "m5 12 7 7 7-7"],
  home: ["M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M16 3.128a4 4 0 0 1 0 7.744", "M22 21v-2a4 4 0 0 0-3-3.87"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  /** Lucide "User" (head circle + body) – used for person / male / female placeholders */
  person: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"],
  /** Lucide ChevronDown – expand subtree (show descendants) */
  chevronDown: ["m6 9 6 6 6-6"],
  /** Lucide ChevronUp – collapse subtree (hide descendants) */
  chevronUp: ["m18 15-6-6-6 6"],
} as const;

/** Lucide "User" circle (head): cx=12, cy=7, r=4 */
export const ICON_PERSON_CIRCLE = { cx: 12, cy: 7, r: 4 };

export const ICON_CIRCLE = { cx: 9, cy: 7, r: 4 };

export interface IconInSvgProps {
  x: number;
  y: number;
  size: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

function IconPaths(props: IconInSvgProps & { paths: readonly string[]; circle?: { cx: number; cy: number; r: number } }) {
  const { paths, circle, x, y, size, fill, stroke, strokeWidth = 1.5 } = props;
  const s = size / 24;
  return (
    <g transform={"translate(" + x + ", " + y + ") scale(" + s + ") translate(-12, -12)"}>
      <g fill={fill ?? "none"} stroke={stroke ?? "currentColor"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {circle && <circle cx={circle.cx} cy={circle.cy} r={circle.r} />}
      </g>
    </g>
  );
}

export function IconCrown(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.crown} {...props} />;
}

export function IconHeart(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.heart} {...props} />;
}

export function IconArrowUp(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.arrowUp} {...props} />;
}

export function IconArrowDown(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.arrowDown} {...props} />;
}

export function IconHome(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.home} {...props} />;
}

export function IconUsers(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.users} circle={ICON_CIRCLE} {...props} />;
}

export function IconX(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.x} {...props} />;
}

export function IconPerson(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.person} circle={ICON_PERSON_CIRCLE} {...props} />;
}

/** Same as IconPerson (Lucide has no separate male icon). */
export function IconPersonMale(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.person} circle={ICON_PERSON_CIRCLE} {...props} />;
}

/** Same as IconPerson (Lucide has no separate female icon). */
export function IconPersonFemale(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.person} circle={ICON_PERSON_CIRCLE} {...props} />;
}

export function IconChevronDown(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.chevronDown} {...props} />;
}

export function IconChevronUp(props: IconInSvgProps) {
  return <IconPaths paths={ICON_PATHS.chevronUp} {...props} />;
}
