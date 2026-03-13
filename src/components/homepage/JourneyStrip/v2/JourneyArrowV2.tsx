"use client";

import { motion } from "motion/react";
import { Arrow } from "@/components/wireframe";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { JOURNEY_V2_ARROW } from "../journeyUtils";

type JourneyArrowV2Props = {
  index: number;
  animate?: boolean;
  animationDelaySeconds?: number;
};

export function JourneyArrowV2({ index, animate = false, animationDelaySeconds = 0 }: JourneyArrowV2Props) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) {
    const arrowClass = animate ? "journey-desktop-arrow-animate" : "journey-desktop-arrow-initial";
    return (
      <div
        key={`arrow-${index}`}
        className={`relative z-10 flex shrink-0 self-center rotate-90 md:rotate-0 ${arrowClass}`}
        aria-hidden
        style={animate ? { animationDelay: `${animationDelaySeconds}s` } : undefined}
      >
        <Arrow />
      </div>
    );
  }

  return (
    <motion.div
      key={`arrow-${index}`}
      className="relative z-10 flex shrink-0 self-center rotate-90 md:rotate-0"
      aria-hidden
      initial={JOURNEY_V2_ARROW.initial}
      animate={animate ? JOURNEY_V2_ARROW.inView : JOURNEY_V2_ARROW.initial}
      transition={JOURNEY_V2_ARROW.transition}
    >
      <Arrow />
    </motion.div>
  );
}
