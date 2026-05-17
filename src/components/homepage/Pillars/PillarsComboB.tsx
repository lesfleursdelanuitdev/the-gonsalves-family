"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { PILLARS } from "@/data/pillars";
import { pillarSlideInVariants } from "./sections/slide-in-variants";
import type { Pillar } from "@/data/pillars";

function ComboBCard({
  pillar,
  index,
  mounted,
  isSectionInView,
  indent = false,
}: {
  pillar: Pillar;
  index: number;
  mounted: boolean;
  isSectionInView: boolean;
  indent?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate={mounted && isSectionInView ? "visible" : "hidden"}
      variants={pillarSlideInVariants}
      custom={index}
      className={indent ? "md:my-6" : undefined}
    >
      <Link
        href={pillar.href}
        className="combo-b-card border"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "rgba(139,94,60,0.2)",
        }}
        aria-label={`${pillar.title} — ${pillar.content}`}
      >
        {/* Mobile-only header: inline numeral + eyebrow above photo */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-0 md:hidden">
          <span
            className="font-heading combo-b-numeral"
            style={{
              fontSize: "36px",
              fontStyle: "italic",
              fontWeight: 600,
              letterSpacing: "-0.06em",
              lineHeight: 1,
            }}
            aria-hidden
          >
            {pillar.numeral}
          </span>
          <span className="section-subtitle" aria-hidden>
            {pillar.subtitle}
          </span>
        </div>

        {/* Card inner grid: [64px left margin | 1fr content] — desktop only uses 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-[64px_1fr]">
          {/* Left margin column — desktop only */}
          <div
            className="combo-b-margin-col hidden md:flex flex-col items-center justify-between py-5 border-r"
            style={{ borderColor: "rgba(139,94,60,0.2)" }}
          >
            {/* Eyebrow label reads bottom-to-top */}
            <span
              className="section-subtitle"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
              aria-hidden
            >
              {pillar.subtitle}
            </span>

            {/* Giant italic numeral */}
            <span
              className="font-heading combo-b-numeral"
              style={{
                fontSize: "64px",
                fontStyle: "italic",
                fontWeight: 600,
                letterSpacing: "-0.06em",
                lineHeight: 1,
              }}
              aria-hidden
            >
              {pillar.numeral}
            </span>
          </div>

          {/* Right content area */}
          <div className="flex flex-col min-w-0">
            {/* 16:9 photograph, full-bleed */}
            <div
              className="relative overflow-hidden w-full"
              style={{ aspectRatio: "16/9" }}
            >
              {pillar.imageOverlay && (
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{ backgroundColor: pillar.imageOverlay }}
                  aria-hidden
                />
              )}
              {pillar.imageTexture && (
                <div
                  className="pointer-events-none absolute inset-0 z-20 opacity-[0.18]"
                  style={{
                    backgroundImage: "url('/images/agedpaperbg2.png')",
                    backgroundRepeat: "repeat",
                    backgroundSize: "480px auto",
                  }}
                  aria-hidden
                />
              )}
              <Image
                src={pillar.image}
                alt={pillar.imageAlt}
                fill
                sizes="(max-width: 767px) 100vw, calc((min(1180px, 100vw - 96px) - 56px) / 3 - 64px)"
                className="object-cover object-top combo-b-photo"
                style={
                  pillar.imageFilter
                    ? ({
                        "--combo-photo-rest": pillar.imageFilter,
                        "--combo-photo-hover": pillar.imageFilterHover ?? "brightness(1.02)",
                      } as React.CSSProperties)
                    : undefined
                }
              />
            </div>

            {/* Body block */}
            <div className="flex flex-col flex-1 px-[22px] pt-5 pb-[22px]">
              <h2
                className="font-heading text-heading font-semibold"
                style={{ fontSize: "24px", letterSpacing: "-0.015em" }}
              >
                {pillar.title}
              </h2>

              <p
                className="font-body text-muted mt-2"
                style={{ fontSize: "16px", lineHeight: "1.55" }}
              >
                {pillar.content}
              </p>

              {pillar.caption && (
                <p
                  className="font-body mt-3 pl-3 text-muted border-l-2"
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.6",
                    borderColor: "rgba(139,94,60,0.45)",
                  }}
                >
                  {pillar.caption}
                </p>
              )}

              {/* Divider + CTA row */}
              <div
                className="mt-4 pt-4 border-t flex items-center justify-between"
                style={{ borderColor: "rgba(139,94,60,0.2)" }}
              >
                <span className="section-subtitle">{pillar.linkLabel}</span>
                <div className="combo-b-arrow-btn">
                  <ArrowRight
                    className="w-3.5 h-3.5 combo-b-arrow-icon"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function PillarsComboB() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative z-10 w-full overflow-x-hidden${isInView ? " identity-in-view" : ""}`}
      style={{
        background: "linear-gradient(180deg, var(--bg) 0%, var(--surface-inset) 100%)",
        boxShadow: "0 -10px 32px rgba(0,0,0,0.08), 0 10px 32px rgba(0,0,0,0.08)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/images/agedbg1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      {/* Aged-paper texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.17]"
        style={{
          backgroundImage: "url('/images/agedpaperbg2.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "480px auto",
        }}
        aria-hidden
      />

      {/* Hero-aligned background washes (HeroAndMenu + HeroV2) */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-bg/34 md:bg-bg/52" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-0 md:hidden"
        aria-hidden
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 48%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden md:block"
        aria-hidden
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] md:opacity-[0.10]" aria-hidden>
        <Image
          src="/images/agedpaperbg.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-70 md:opacity-100"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 55%, transparent 85%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 md:opacity-50"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 100%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 45%, transparent 70%), linear-gradient(to top, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 40%, transparent 70%), radial-gradient(ellipse 100% 90% at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 50%, transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,1680px)] px-5 sm:px-6 md:px-8 lg:px-10">

        {/* Section header */}
        <div className="relative z-10 text-center pt-9 pb-8 md:pt-11 md:pb-10 lg:pt-12 lg:pb-12">
          <p className="section-subtitle mb-3">Three ways in</p>
          <h2
            className="font-heading text-heading font-semibold"
            style={{ fontSize: "32px", letterSpacing: "-0.02em" }}
          >
            Wherever you&apos;d like to{" "}
            <span className="identity-one-underline italic" style={{ fontWeight: 500 }}>begin.</span>
          </h2>
        </div>

        {/* 3-up card grid */}
        <div
          className="relative z-10 grid grid-cols-1 md:grid-cols-3 pb-11 md:pb-14 lg:pb-16"
          style={{ gap: "28px" }}
        >
          {PILLARS.map((pillar, index) => (
            <ComboBCard
              key={pillar.title}
              pillar={pillar}
              index={index}
              mounted={mounted}
              isSectionInView={isInView}
              indent={index !== 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
