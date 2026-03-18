"use client";

import { useContext, useRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import { OverlayScrollContext } from "./OverlayScrollContext";

const duration = 0.65;
const ease = [0.25, 0.46, 0.45, 0.94] as const;
const offset = 28;
/** Delay between each section (seconds) for staggered entrance. */
const staggerSec = 0.08;

interface AnimatedSectionProps {
  children: ReactNode;
  /** Stagger index for ordered entrance (0 = first). When set, animates on mount with delay; otherwise animates when in view. */
  staggerIndex?: number;
}

/**
 * Wraps overlay section content and animates it in order:
 * - If staggerIndex is set: animates on mount with delay so sections appear in sequence (Explore second-to-last, Close last).
 * - Otherwise: animates when scrolling into view (slides from bottom when scrolling down, from top when scrolling up).
 */
export function AnimatedSection({ children, staggerIndex }: AnimatedSectionProps) {
  const ctx = useContext(OverlayScrollContext);
  const ref = useRef<HTMLDivElement>(null);

  const useStagger = staggerIndex !== undefined;
  const inView = useInView(ref, {
    root: ctx?.scrollContainerRef ?? undefined,
    once: true,
    amount: 0.05,
  });

  const direction = ctx?.scrollDirectionRef.current ?? "down";
  const initialY = direction === "down" ? offset : -offset;

  if (useStagger) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: offset }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration,
          ease,
          delay: staggerIndex * staggerSec,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: initialY }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: initialY }}
      transition={{ duration, ease }}
    >
      {children}
    </motion.div>
  );
}
