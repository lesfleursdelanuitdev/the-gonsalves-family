import Link from "next/link";

/** v2 mobile: slide up, used with per-slot delay from parent */
export const JOURNEY_V2_CARD = {
  initial: { y: 40, opacity: 0 },
  inView: { y: 0, opacity: 1 },
  transition: (delayMs: number) => ({
    duration: 0.75,
    delay: delayMs / 1000,
    ease: [0.25, 0.46, 0.45, 0.94] as const,
  }),
};

/** v2 mobile: fade in, duration 0.5s */
export const JOURNEY_V2_ARROW = {
  initial: { opacity: 0 },
  inView: { opacity: 1 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/** v2 desktop: CSS animation delays. Sequence: C0, A1, C1, A2, ..., A(n-1), Cn */
const DESKTOP_CARD_DURATION = 0.75;
const DESKTOP_ARROW_DURATION = 0.5;
const DESKTOP_SLOT = DESKTOP_CARD_DURATION + DESKTOP_ARROW_DURATION;

/** Delay (seconds) for card at index */
export function journeyV2DesktopCardDelay(index: number): number {
  return index * DESKTOP_SLOT;
}

/** Delay (seconds) for arrow at index (1..n-1). Sequence: C0, A1, C1, A2, ..., A(n-1), Cn */
export function journeyV2DesktopArrowDelay(index: number): number {
  return (index - 1) * DESKTOP_SLOT + DESKTOP_CARD_DURATION;
}

export const IMAGE_SIZES = {
  first: { width: 320, height: 170, className: "h-[170px]" },
  last: { width: 320, height: 170, className: "h-[170px]" },
  default: { width: 320, height: 170, className: "h-[170px]" },
} as const;

/** Names highlighted in journey copy. A non-null href makes the name a real
 *  link to that individual; names mapped to null are styled but inert. */
const NAME_LINKS: Record<string, string | null> = {
  "Agustino Gracis":
    "https://gonsalvesfamily.com/individuals/3499e9ad-e40e-452e-ab87-c1c2a0f5de91",
  "Mary Mias Gracis":
    "https://gonsalvesfamily.com/individuals/7f01d81a-3107-4700-a2c4-89c2b2435ee7",
  "Agus Gonsalves":
    "https://gonsalvesfamily.com/individuals/12f7d7d6-b764-4e27-98ed-e76402dc2bec",
};

const BOLD_NAMES = Object.keys(NAME_LINKS);

export function formatContentWithLinks(content: string) {
  return content
    .split(new RegExp(`(${BOLD_NAMES.join("|")})`))
    .map((part, i) => {
      if (!BOLD_NAMES.includes(part)) return part;
      const className = "text-link hover:text-link-hover underline";
      const href = NAME_LINKS[part];
      return href ? (
        <Link key={i} href={href} className={className}>
          {part}
        </Link>
      ) : (
        <Link
          key={i}
          href="#"
          onClick={(e) => e.preventDefault()}
          className={className}
        >
          {part}
        </Link>
      );
    });
}
