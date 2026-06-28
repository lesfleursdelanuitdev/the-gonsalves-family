"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { JOURNEY_STEPS } from "@/data/journeySteps";
import { formatContentWithLinks } from "../journeyUtils";
import { JourneyModernMobile } from "./JourneyModernMobile";

const JOURNEY_EVENT_ALTS = [
  "A ship arriving at the island of Madeira",
  "Sugar cane and an anchor at the estate",
  "A couple at Enmore Estate",
  "A globe representing the worldwide diaspora",
] as const;

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;
const LINE_EASE = [0.4, 0, 0.2, 1] as const;

const illustrationVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      delay: 0.15 + i * 0.2,
      ease: ENTRANCE_EASE,
    },
  }),
};

const textVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      delay: 0.55 + i * 0.12,
      ease: ENTRANCE_EASE,
    },
  }),
};

const nodeVariants = {
  hidden: { scale: 0.2, opacity: 0 },
  visible: (i: number) => ({
    scale: [0.2, 1.18, 1],
    opacity: 1,
    transition: {
      duration: 0.45,
      delay: 0.35 + i * 0.25,
      ease: ENTRANCE_EASE,
    },
  }),
};

function JourneyStepText({
  step,
  index,
  animate,
}: {
  step: (typeof JOURNEY_STEPS)[number];
  index: number;
  animate: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center px-3 text-center"
      initial="hidden"
      animate={animate ? "visible" : "hidden"}
      variants={textVariants}
      custom={index}
    >
      {step.date && (
        <p className="m-0 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[#8b5e3c]">
          {step.date}
        </p>
      )}
      <p className="mb-1.5 mt-1.5 font-heading text-lg font-medium italic text-primary">
        {step.location}
      </p>
      {step.content && (
        <p className="m-0 max-w-[230px] font-body text-sm leading-[1.55] text-muted">
          {formatContentWithLinks(step.content)}
        </p>
      )}
    </motion.div>
  );
}

function JourneyTimelineDesktop({ animate }: { animate: boolean }) {
  return (
    <div className="hidden overflow-x-auto pb-1.5 md:block">
      <div className="relative min-w-[720px]">
        <div className="grid grid-cols-4">
          {JOURNEY_STEPS.map((step, index) => (
            <motion.div
              key={`ill-${step.date}-${step.location}`}
              className="journey-v3-illustration flex h-[168px] items-end justify-center px-3"
              initial="hidden"
              animate={animate ? "visible" : "hidden"}
              variants={illustrationVariants}
              custom={index}
            >
              <Image
                src={`/images/mainpage-timeline-events/event${index + 1}.png`}
                alt={JOURNEY_EVENT_ALTS[index] ?? ""}
                width={220}
                height={150}
                className="h-auto max-h-[150px] w-auto max-w-full object-contain drop-shadow-[0_9px_11px_rgba(44,42,38,0.18)] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
              />
            </motion.div>
          ))}
        </div>

        <div className="relative h-[54px]">
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-1/2 h-0.5 -translate-y-1/2 overflow-hidden">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-accent-muted to-[#8b5e3c]"
              initial={{ scaleX: 0 }}
              animate={animate ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.25, ease: LINE_EASE }}
              style={{ transformOrigin: "left center" }}
              aria-hidden
            />
          </div>
          <div className="grid h-full grid-cols-4">
            {JOURNEY_STEPS.map((step, index) => (
              <div key={`node-${step.date}`} className="flex items-center justify-center">
                <motion.span
                  className="journey-v3-node block h-4 w-4 rounded-full bg-primary"
                  initial="hidden"
                  animate={animate ? "visible" : "hidden"}
                  variants={nodeVariants}
                  custom={index}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-y-6">
          {JOURNEY_STEPS.map((step, index) => (
            <JourneyStepText key={`text-${step.date}-${step.location}`} step={step} index={index} animate={animate} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function JourneyStripV3() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const animate = mounted && isInView;

  return (
    <section
      ref={sectionRef}
      className="journey-section-v3 relative w-full min-w-0 max-w-full overflow-x-clip border-t border-[rgba(139,94,60,0.12)] bg-[#ECE3D1] py-[clamp(56px,7vw,92px)] pb-[clamp(52px,6vw,86px)] max-md:pt-0 shadow-[inset_0_18px_42px_-36px_rgba(44,42,38,0.3),inset_0_-18px_42px_-36px_rgba(44,42,38,0.3)] max-md:shadow-[inset_0_-18px_42px_-36px_rgba(44,42,38,0.3)]"
    >
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[min(100%,1680px)] px-5 sm:px-6 md:px-8 lg:px-10">
        <div className="journey-modern-shell">
          <div className="text-center">
            <p className="section-subtitle mb-[11px] !text-[11px] !tracking-[0.22em]">Timelines</p>
            <h2 className="m-0 font-heading text-[clamp(36px,5.2vw,52px)] font-semibold leading-[1.08] tracking-[-0.02em] text-heading">
              <span className="font-medium italic">The</span> Journey
            </h2>
            <p className="mx-auto mt-[15px] max-w-[480px] font-body text-[15px] leading-[1.6] text-muted">
              Four moments that carried the family from Madeira to a world-spanning diaspora.
            </p>
          </div>

          <div className="mt-[clamp(36px,4vw,54px)] max-md:mt-5">
            <JourneyModernMobile />
            <JourneyTimelineDesktop animate={animate} />
          </div>
        </div>

        <p className="mt-10 hidden text-center md:block">
          <Link href="/timelines" className="journey-v3-cta group inline-flex items-center gap-2 font-body">
            See more timelines
            <ArrowRight
              className="h-[15px] w-[15px] transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={2.2}
              aria-hidden
            />
          </Link>
        </p>
      </div>
    </section>
  );
}
