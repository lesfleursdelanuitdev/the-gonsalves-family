"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Section } from "@/components/wireframe";

import { NARROW_SECTION_MAX_WIDTH } from "@/constants/layout";

const linkClassName = "font-body text-base text-link underline hover:text-link-hover mt-4 inline-block";

const slideInVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      delay: i * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

export function PeopleStoriesMediaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Section
      noPadding
      className="flex flex-col min-h-[160px] py-10 sm:py-0"
    >
      <div
        ref={sectionRef}
        className="mx-auto w-full h-full min-h-[160px] flex flex-col px-6 flex-1"
        style={{ maxWidth: NARROW_SECTION_MAX_WIDTH }}
      >
        <div className="grid grid-cols-1 gap-y-8 gap-x-0 sm:grid-cols-3 sm:items-stretch flex-1 min-h-[160px]">
          <div className="text-left flex flex-col justify-center h-full min-h-full items-start pl-6 sm:pl-0">
            <p className="section-subtitle mb-2">people</p>
            <h3 className="font-heading text-xl font-semibold tracking-tight text-heading">
              Find Family
            </h3>
            <motion.div
              initial="hidden"
              animate={mounted && isInView ? "visible" : "hidden"}
              variants={slideInVariants}
              custom={0}
            >
              <p className="font-body mt-2 text-base text-text/90 max-w-xs leading-relaxed text-left">
                Discover ancestors, relatives, and the branches that shape our family.
              </p>
              <Link href="/people" className={linkClassName}>
                Find
              </Link>
            </motion.div>
          </div>
          <div
            className="text-left flex flex-col justify-center border-y sm:border-y-0 sm:border-x border-solid pt-6 pb-4 pl-6 pr-2 sm:pt-8 sm:pb-6 sm:pl-8 sm:pr-4 h-full min-h-full self-stretch items-start"
            style={{ borderColor: "rgb(139 46 46 / 0.15)" }}
          >
            <p className="section-subtitle mb-2">stories</p>
            <h3 className="font-heading text-xl font-semibold tracking-tight text-heading">
              Read Histories
            </h3>
            <motion.div
              initial="hidden"
              animate={mounted && isInView ? "visible" : "hidden"}
              variants={slideInVariants}
              custom={1}
            >
              <p className="font-body mt-2 text-base text-text/90 max-w-xs leading-relaxed">
                Step into the lives, journeys, and experiences of those who came before us.
              </p>
              <Link href="/stories" className={linkClassName}>
                Read
              </Link>
            </motion.div>
          </div>
          <div className="text-left flex flex-col justify-center h-full min-h-full items-start pl-6 sm:pl-8">
            <p className="section-subtitle mb-2">archives</p>
            <h3 className="font-heading text-xl font-semibold tracking-tight text-heading">
              View Media
            </h3>
            <motion.div
              initial="hidden"
              animate={mounted && isInView ? "visible" : "hidden"}
              variants={slideInVariants}
              custom={2}
            >
              <p className="font-body mt-2 text-base text-text/90 max-w-xs leading-relaxed">
                View the photos, videos, and recordings that hold our family's memories.
              </p>
              <Link href="/archive" className={linkClassName}>
                View
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
}
