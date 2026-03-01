"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Arrow, PageContainer, Section } from "@/components/wireframe";
import { JOURNEY_STEPS } from "@/data/journeySteps";

const CARD_ANIMATION = {
  initial: { x: 48, opacity: 0 },
  inView: { x: [48, -10, 0], opacity: 1 },
  transition: (i: number) => ({
    x: {
      duration: 0.65,
      delay: i * 0.22,
      times: [0, 0.72, 1],
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
    opacity: {
      duration: 0.3,
      delay: i * 0.22,
    },
  }),
};

export function JourneyStrip() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, {
    once: true,
    margin: "0px 0px -60% 0px",
  });

  return (
    <Section className="journey-section">
      <div ref={sectionRef}>
      <div className="text-center">
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-black">
          <span className="italic">The</span> Journey
        </h2>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="timeline relative flex flex-nowrap items-stretch justify-center gap-x-12 px-10 md:px-16 font-body leading-relaxed text-text">
          {JOURNEY_STEPS.map((step, index) => (
            <motion.div
              key={`${step.date}-${step.location}`}
              className={`flex flex-shrink-0 items-center ${index === 0 ? "gap-0" : ""}`}
              initial={CARD_ANIMATION.initial}
              animate={isInView ? CARD_ANIMATION.inView : CARD_ANIMATION.initial}
              transition={CARD_ANIMATION.transition(index)}
            >
              {index === 0 && (
                <div className="relative z-10 flex shrink-0 self-center">
                  <Arrow />
                </div>
              )}
              <div
                className="timeline-card journey-panel relative flex h-full min-h-[110px] max-w-[280px] flex-col"
                style={{
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                {step.date && (
                  <span className="journey-card-date mb-1 block font-body">
                    {step.date}
                  </span>
                )}
                <span className="journey-card-location mb-1.5 block font-heading">
                  {step.location}
                </span>
                {step.content && (
                  <span className="journey-card-body block font-body">
                    {step.content
                      .split(/(Augustino Gracis|Mary Mias Gracis)/)
                      .map((part, i) =>
                        part === "Augustino Gracis" || part === "Mary Mias Gracis" ? (
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
                      )}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <PageContainer>
        <p className="mt-4 text-right">
          <Link
            href="/timelines"
            className="font-body text-sm text-link hover:text-link-hover underline"
          >
            See more timelines…
          </Link>
        </p>
      </PageContainer>
      </div>
    </Section>
  );
}
