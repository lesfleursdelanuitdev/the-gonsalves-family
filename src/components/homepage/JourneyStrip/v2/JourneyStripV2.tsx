"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { JOURNEY_STEPS } from "@/data/journeySteps";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { journeyV2DesktopArrowDelay, journeyV2DesktopCardDelay } from "../journeyUtils";
import { JourneyArrowV2 } from "./JourneyArrowV2";
import { ARROW_DURATION_MS, JourneyCardV2 } from "./JourneyCardV2";

/** Amount of card visible (0–1) to trigger animation */
const IN_VIEW_THRESHOLD = 0.15;

/**
 * Journey Strip v2 — mobile: cards slide up when in view, sequential by slot.
 * Desktop: cards/arrows slide in from right when section in view, staggered C1→A1→C2→A2→...→A(n-1)→Cn.
 */
export function JourneyStripV2() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const sectionRef = useRef<HTMLDivElement>(null);
  const isDesktopInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [inViewCards, setInViewCards] = useState<Set<number>>(new Set());
  const [lastCompletedSlot, setLastCompletedSlot] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const count = JOURNEY_STEPS.length;
    const id = requestAnimationFrame(() => {
      const refs = cardRefs.current;
      const observers: IntersectionObserver[] = [];
      for (let i = 0; i < count; i++) {
        const el = refs[i];
        if (!el) continue;
        const ob = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && mountedRef.current) {
              setInViewCards((prev) => new Set(prev).add(i));
            }
          },
          { threshold: IN_VIEW_THRESHOLD, rootMargin: "0px 0px 20px 0px" }
        );
        ob.observe(el);
        observers.push(ob);
      }
      return () => observers.forEach((o) => o.disconnect());
    });
    return () => cancelAnimationFrame(id);
  }, [isMobile]);

  const handleAnimationEnd = useCallback((index: number) => {
    setLastCompletedSlot((prev) => Math.max(prev, index));
  }, []);

  return (
    <section
      ref={sectionRef}
      className="journey-section-v2 relative w-full min-w-0 max-w-full overflow-x-clip pt-12 pb-24"
    >
      <div className="pointer-events-none absolute inset-0 left-0 right-0 top-0 bottom-0 z-0 h-full w-full max-w-full overflow-hidden opacity-[0.12]" aria-hidden>
        <div className="absolute inset-0 origin-center" style={{ transform: "scale(1.12)" }}>
          <Image
            src="/images/agedmap.png"
            alt=""
            fill
            className="object-cover object-center"
            aria-hidden
          />
        </div>
      </div>
      <div className="relative z-10 text-center">
        <p className="section-subtitle mb-2">Timelines</p>
        <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-heading">
          <span className="italic">The</span> Journey
        </h2>
      </div>
      <div
        className="timeline timeline-vertical journey-timeline-v2 relative z-10 flex min-w-0 max-w-full flex-col items-center gap-y-4 py-4 px-6 font-body text-text md:flex-row md:flex-nowrap md:items-stretch md:justify-evenly md:gap-x-4 md:gap-y-0 md:py-0 md:px-16"
      >
        {JOURNEY_STEPS.flatMap((step, index) => {
          const prevSlotComplete = index === 0 || lastCompletedSlot >= index - 1;
          const inView = inViewCards.has(index);
          const slotReady = inView && prevSlotComplete;
          const mobileCardDelay = index > 0 ? ARROW_DURATION_MS : 0;
          const desktopCardDelay = journeyV2DesktopCardDelay(index);
          const desktopArrowDelay = index > 0 ? journeyV2DesktopArrowDelay(index) : 0;

          return [
            ...(index > 0
              ? [
                  <JourneyArrowV2
                    key={`arrow-${index}`}
                    index={index}
                    animate={isMobile ? slotReady : mounted && isDesktopInView}
                    animationDelaySeconds={!isMobile ? desktopArrowDelay : undefined}
                  />,
                ]
              : []),
            <JourneyCardV2
              key={`${step.date}-${step.location}`}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              step={step}
              index={index}
              totalCount={JOURNEY_STEPS.length}
              animate={isMobile ? slotReady : mounted && isDesktopInView}
              animationDelayMs={isMobile ? mobileCardDelay : undefined}
              animationDelaySeconds={!isMobile ? desktopCardDelay : undefined}
              onAnimationEnd={
                isMobile && slotReady ? () => handleAnimationEnd(index) : undefined
              }
            />,
          ];
        })}
      </div>
      <div className="relative z-10 px-6">
        <p className="mt-10 text-center">
          <Link
            href="/timelines"
            className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
          >
            See more timelines…
          </Link>
        </p>
      </div>
    </section>
  );
}
