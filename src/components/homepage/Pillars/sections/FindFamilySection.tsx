"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  PILLAR_FEATHER_FROM_EDGE_X,
  PILLAR_FEATHER_FROM_EDGE_Y,
  PILLAR_FEATHER_TO_EDGE_X,
  PILLAR_FEATHER_TO_EDGE_Y,
} from "../pillars-section-surface";
import { pillarSlideInVariants } from "./slide-in-variants";
import type { PillarSectionProps } from "./types";

const FIND_FAMILY_PEDIGREE_MASK =
  "radial-gradient(circle at 50% 46%, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.84) 10%, rgba(0,0,0,0.52) 26%, rgba(0,0,0,0.2) 46%, rgba(0,0,0,0.05) 64%, transparent 78%)";

const LEFT_INDEX = 0;

export function FindFamilySection({ pillar, index, mounted, isSectionInView }: PillarSectionProps) {
  const pillarRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pillarRef, { once: false, amount: 0.5 });

  const [first, ...rest] = pillar.title.split(" ");
  const hasRedUnderline = index === 0 && first === "Find";

  const edgeCardClasses =
    "w-full min-w-0 max-w-[min(100%,22rem)] rounded-md border border-[rgb(139_46_46/0.08)] md:transition-transform md:duration-500 md:ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:translate-x-2";

  const contentShell = (
    <div
      className={`relative z-10 ${edgeCardClasses} p-6`}
      style={{
        backgroundColor: "rgba(221, 201, 170, 0.08)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="section-subtitle mb-2">{pillar.subtitle}</p>
      <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-heading">
        <span
          className={hasRedUnderline ? "pillar-title-underline italic" : "italic"}
          style={
            hasRedUnderline
              ? {
                  textDecoration: "underline",
                  textDecorationColor: "var(--crimson)",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "3px",
                }
              : undefined
          }
        >
          {first}
        </span>
        {rest.length > 0 && ` ${rest.join(" ")}`}
      </h2>
      <p className="font-body mt-2 text-base leading-relaxed text-text/90 max-w-xs">{pillar.content}</p>
      <Link
        href={pillar.href}
        className="group font-body mt-4 inline-flex items-center gap-2 text-lg font-medium text-link underline hover:text-link-hover"
      >
        {pillar.linkLabel}
        <ArrowRight
          className="pillar-link-arrow-mobile h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
          aria-hidden
        />
      </Link>
    </div>
  );

  return (
    <motion.div
      key={pillar.title}
      initial="hidden"
      animate={mounted && isSectionInView ? "visible" : "hidden"}
      variants={pillarSlideInVariants}
      custom={LEFT_INDEX}
      className={`group relative min-h-[120px] min-w-0 flex-1 bg-no-repeat bg-transparent p-10 md:transition-all md:duration-500 md:ease-[cubic-bezier(0.4,0,0.2,1)] md:hover:flex-[1.15] ${
        isInView ? "pillar-in-view" : ""
      }`}
    >
      <div ref={pillarRef} className="pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.74] bg-no-repeat"
        style={{
          backgroundImage: "url('/images/pedigreeSample2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          filter: "blur(1px)",
          WebkitMaskImage: FIND_FAMILY_PEDIGREE_MASK,
          maskImage: FIND_FAMILY_PEDIGREE_MASK,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "110% 156%",
          maskSize: "110% 156%",
          WebkitMaskPosition: "50% 46%",
          maskPosition: "50% 46%",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-44 max-md:block md:hidden"
        style={{ background: PILLAR_FEATHER_FROM_EDGE_Y }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 max-md:block md:hidden"
        style={{ background: PILLAR_FEATHER_TO_EDGE_Y }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-[min(12rem,42%)] md:block"
        style={{ background: PILLAR_FEATHER_FROM_EDGE_X }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[min(12rem,42%)] md:block"
        style={{ background: PILLAR_FEATHER_TO_EDGE_X }}
        aria-hidden
      />
      {contentShell}
    </motion.div>
  );
}
