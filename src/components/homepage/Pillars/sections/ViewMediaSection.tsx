"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { pillarSlideInVariants } from "./slide-in-variants";
import type { PillarSectionProps } from "./types";

const RIGHT_INDEX = 2;

export function ViewMediaSection({ pillar, index, mounted, isSectionInView }: PillarSectionProps) {
  const pillarRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pillarRef, { once: false, amount: 0.5 });

  const [first, ...rest] = pillar.title.split(" ");
  const hasRedUnderline = index === 2 && first === "View";

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
      custom={RIGHT_INDEX}
      className={`group relative min-h-[120px] min-w-0 flex-1 overflow-visible bg-transparent bg-no-repeat p-10 md:min-h-[120px] md:transition-all md:duration-500 md:ease-[cubic-bezier(0.4,0,0.2,1)] md:hover:flex-[1.15] ${
        isInView ? "pillar-in-view" : ""
      }`}
    >
      <div ref={pillarRef} className="pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute bottom-0 right-0 z-[1] h-[min(47vw,200px)] w-[min(72vw,236px)] md:h-[240px] md:w-[min(100%,288px)]"
        aria-hidden
      >
        <div className="relative h-full w-full">
          <Image
            src="/images/oldSchoolCamera.png"
            alt=""
            fill
            sizes="(max-width: 767px) 72vw, 288px"
            className="object-cover object-right-bottom opacity-[0.10] md:opacity-[0.18]"
          />
        </div>
      </div>
      <div className="relative z-10 min-h-[220px] w-full min-w-0 overflow-visible md:min-h-0 md:contents">
        {contentShell}
      </div>
    </motion.div>
  );
}
