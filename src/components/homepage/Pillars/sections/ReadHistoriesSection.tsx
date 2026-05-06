"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { pillarSlideInVariants } from "./slide-in-variants";
import type { PillarSectionProps } from "./types";

const MIDDLE_INDEX = 1;

export function ReadHistoriesSection({ pillar, index, mounted, isSectionInView }: PillarSectionProps) {
  const pillarRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(pillarRef, { once: false, amount: 0.5 });

  const [first, ...rest] = pillar.title.split(" ");
  const hasRedUnderline = index === 1 && first === "Read";

  const contentShell = (
    <div className="relative z-10">
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
      <div
        className="font-body mb-4 mt-6 w-fit rounded p-6 text-sm italic text-text/70 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
      >
        Pictured in the background is{" "}
        <Link href="/people/lucy-gonsalves" className="text-link underline hover:text-link-hover">
          Lucy
        </Link>{" "}
        &{" "}
        <Link href="/people/augustinho-gonsalves" className="text-link underline hover:text-link-hover">
          Augustinho Gonsalves
        </Link>{" "}
        with their son{" "}
        <Link href="/people/sydney-gonsalves" className="text-link underline hover:text-link-hover">
          Sydney
        </Link>
        , 1917.{" "}
        <Link href="/people/augustinho-gonsalves" className="text-link underline hover:text-link-hover">
          Read
        </Link>{" "}
        the biography of Augustinho Gonsalves, who lived to be over 100.
      </div>
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
      custom={MIDDLE_INDEX}
      className={`group relative min-h-[120px] min-w-0 flex-1 bg-no-repeat overflow-hidden p-10 md:transition-all md:duration-500 md:ease-[cubic-bezier(0.4,0,0.2,1)] md:hover:flex-[1.15] ${
        isInView ? "pillar-in-view" : ""
      }`}
      style={{
        backgroundImage: `linear-gradient(rgba(221, 201, 170, 0.72), rgba(221, 201, 170, 0.76)), url('/images/histories/journey/family/Sydney1917.jpg')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }}
    >
      <div ref={pillarRef} className="pointer-events-none absolute inset-0" aria-hidden />
      {contentShell}
    </motion.div>
  );
}
