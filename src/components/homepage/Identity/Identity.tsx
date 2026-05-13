"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { HeritageTextRotate } from "./HeritageTextRotate";
import { CultureColumns } from "./CultureColumns";

const contentVariants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

/**
 * Identity component — blank state for remake.
 * Replaces IdentitySection with a new implementation.
 */
export function Identity() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      ref={sectionRef}
      className={`relative z-10 w-full pb-0 pt-0 ${isInView ? "identity-in-view" : ""}`}
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.35) 0%, transparent 55%), radial-gradient(circle at 50% 0%, #e7dac2 0%, transparent 60%)",
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8 md:gap-10 md:items-start">
        <div className="relative overflow-hidden rounded-lg px-6 pt-10 pb-6 md:px-10 md:pt-14 md:pb-8">
          <div className="relative z-10">
            <p className="section-subtitle mb-2">culture</p>
            <h2 className="mb-12 font-heading text-4xl font-semibold tracking-tight text-heading">
              Many Backgrounds,{" "}
              <span className="identity-one-underline italic">One</span> Family
            </h2>
            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={contentVariants}
            >
              <p className="font-body -mt-4 max-w-2xl text-xl leading-loose text-text md:text-2xl">
                Our story carries the legacy of Portuguese, Caribbean and{" "}
                <HeritageTextRotate /> heritage, woven into one family over time.
              </p>
            </motion.div>
            <p className="mt-8">
              <Link
                href="/culture"
                className="font-body inline-block rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring transition-shadow"
              >
                Explore culture
              </Link>
            </p>
          </div>
        </div>
        <div
          className="flex flex-col gap-4 rounded-lg px-6 pt-10 pb-10 md:px-10 md:pt-14 md:pb-8"
          style={{
            background: "rgba(34, 85, 51, 0.05)",
          }}
        >
          <div className="py-4">
            <CultureColumns />
          </div>
        </div>
      </div>
    </section>
  );
}
