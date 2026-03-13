"use client";

import { forwardRef } from "react";
import { motion } from "motion/react";
import type { JourneyStep } from "@/data/journeySteps";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatContentWithLinks, JOURNEY_V2_CARD } from "../journeyUtils";
import { JourneyEventImage } from "../JourneyEventImage";

export const ARROW_DURATION_MS = 500;

type JourneyCardV2Props = {
  step: JourneyStep;
  index: number;
  totalCount: number;
  animate?: boolean;
  animationDelayMs?: number;
  animationDelaySeconds?: number;
  onAnimationEnd?: () => void;
};

export const JourneyCardV2 = forwardRef<HTMLDivElement, JourneyCardV2Props>(function JourneyCardV2({
  step,
  index,
  totalCount,
  animate = false,
  animationDelayMs = 0,
  animationDelaySeconds = 0,
  onAnimationEnd,
}, ref) {
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) {
    const cardClass = animate ? "journey-desktop-card-animate" : "journey-desktop-card-initial";
    return (
      <div
        ref={ref}
        className={`flex min-w-0 flex-shrink-0 justify-start p-0 ${cardClass}`}
        style={animate ? { animationDelay: `${animationDelaySeconds}s` } : undefined}
      >
        <div
          className="timeline-card journey-panel relative flex h-full min-h-[360px] w-full max-w-[280px] flex-col overflow-visible"
          style={{ borderRadius: "10px", padding: "20px" }}
        >
          <JourneyEventImage index={index} isFirst={isFirst} isLast={isLast} />
          {step.date && (
            <div className="divider journey-divider my-2">
              <span className="journey-card-date font-body">{step.date}</span>
            </div>
          )}
          <div className="main-content flex flex-col">
            <span className="journey-card-location mb-1.5 block font-heading">
              {step.location}
            </span>
            {step.content && (
              <span className="journey-card-body block font-body">
                {formatContentWithLinks(step.content)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="flex min-w-0 flex-shrink-0 justify-start p-0"
      initial={JOURNEY_V2_CARD.initial}
      animate={animate ? JOURNEY_V2_CARD.inView : JOURNEY_V2_CARD.initial}
      transition={JOURNEY_V2_CARD.transition(animationDelayMs)}
      onAnimationComplete={onAnimationEnd}
    >
      <div
        className="timeline-card journey-panel relative flex h-full min-h-[360px] w-full max-w-[280px] flex-col overflow-visible"
        style={{ borderRadius: "10px", padding: "20px" }}
      >
        <JourneyEventImage index={index} isFirst={isFirst} isLast={isLast} />
        {step.date && (
          <div className="divider journey-divider my-2">
            <span className="journey-card-date font-body">{step.date}</span>
          </div>
        )}
        <div className="main-content flex flex-col">
          <span className="journey-card-location mb-1.5 block font-heading">
            {step.location}
          </span>
          {step.content && (
            <span className="journey-card-body block font-body">
              {formatContentWithLinks(step.content)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
