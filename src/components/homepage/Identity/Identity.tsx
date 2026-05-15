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

const CULTURE_STATS = [
  { value: "04", label: "Sections" },
  { value: "12", label: "Artifacts" },
  { value: "07", label: "Heritages" },
] as const;

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
      className={`relative z-10 w-full overflow-hidden py-14 md:py-[4.5rem] lg:py-24 ${isInView ? "identity-in-view" : ""}`}
      style={{
        background:
          "radial-gradient(circle at 18% 8%, rgba(255,255,255,0.52) 0%, transparent 34%), radial-gradient(circle at 86% 16%, rgba(195,164,90,0.14) 0%, transparent 32%), linear-gradient(180deg, rgba(239,231,214,0.92), rgba(229,216,190,0.92))",
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-border-subtle" />
        <div className="absolute inset-y-8 left-[42%] hidden w-px bg-border-subtle/80 lg:block" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[min(100%,1680px)] grid-cols-1 gap-10 px-5 sm:px-6 md:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-14 lg:px-10">
        <div className="relative overflow-hidden rounded-lg">
          <div className="relative z-10">
            <p className="section-subtitle mb-8">culture</p>
            <h2 className="max-w-[12ch] font-heading text-5xl font-semibold leading-[0.95] tracking-tight text-heading sm:text-6xl lg:text-7xl">
              Many <span className="identity-one-underline italic">backgrounds,</span>{" "}
              one family.
            </h2>
            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={contentVariants}
            >
              <div className="mt-8 flex max-w-xl gap-5 border-l border-crimson/70 pl-5">
                <p className="font-heading text-xl italic leading-loose text-text/85 md:text-2xl">
                  Portuguese, Caribbean and <HeritageTextRotate /> heritage,
                  woven into one family across two centuries.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mt-8 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between lg:block"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={contentVariants}
            >
              <Link
                href="/culture"
                className="font-body inline-flex w-fit items-center gap-3 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover hover:shadow focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                Explore culture
                <span aria-hidden>&rarr;</span>
              </Link>

              <dl className="grid w-full max-w-md grid-cols-3 border-t border-border-subtle pt-5 sm:max-w-sm lg:mt-10 lg:max-w-md">
                {CULTURE_STATS.map((stat) => (
                  <div key={stat.label} className="min-w-0 pr-4">
                    <dt className="font-body text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-crimson">
                      {stat.value}
                    </dt>
                    <dd className="mt-1 font-body text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-6 hidden items-center gap-6 md:flex">
            <div className="h-px flex-1 bg-border-subtle" />
            <p className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted">
              Family culture index
            </p>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <CultureColumns />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
