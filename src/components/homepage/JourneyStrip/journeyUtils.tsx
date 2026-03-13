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

const BOLD_NAMES = ["Augustino Gracis", "Mary Mias Gracis", "Agus Gonsalves"] as const;

export function formatContentWithLinks(content: string) {
  return content
    .split(new RegExp(`(${BOLD_NAMES.join("|")})`))
    .map((part, i) =>
      BOLD_NAMES.includes(part as (typeof BOLD_NAMES)[number]) ? (
        <Link
          key={i}
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-link hover:text-link-hover underline"
        >
          {part}
        </Link>
      ) : (
        part
      )
    );
}
