"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Section } from "@/components/wireframe";

import { NARROW_SECTION_MAX_WIDTH, SECTION_PADDING_X } from "@/constants/layout";

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
      className="flex flex-col min-h-[160px] pt-10 pb-0 sm:py-0"
    >
      <div
        ref={sectionRef}
        className="mx-auto w-full h-full min-h-[160px] flex flex-col px-6 flex-1 overflow-x-visible"
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
          <div className="relative flex h-full min-h-[220px] flex-col items-start justify-center overflow-visible pl-6 pr-0 text-left sm:min-h-full sm:pl-8">
            {/* PNG has ~60% empty black on the left — object-cover + right-bottom crops to the camera */}
            {/* Pull into outer px-6 gutter so the bitmap meets the section outer edge (see SECTION_PADDING_X). */}
            <div
              className="pointer-events-none absolute bottom-0 z-[1] h-[min(55vw,240px)] w-[min(85vw,280px)] sm:h-[285px] sm:w-[min(100%,340px)]"
              style={{
                right: -SECTION_PADDING_X,
              }}
              aria-hidden
            >
              <div className="relative h-full w-full">
                <Image
                  src="/images/oldSchoolCamera.png"
                  alt=""
                  fill
                  sizes="(max-width: 767px) 85vw, 340px"
                  className="object-cover object-right-bottom opacity-[0.10] md:opacity-[0.18]"
                />
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-start pr-6">
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
      </div>
    </Section>
  );
}
