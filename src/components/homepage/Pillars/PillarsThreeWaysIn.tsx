"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { PILLARS } from "@/data/pillars";
import type { Pillar } from "@/data/pillars";

const CARD_RISE = {
  hidden: { opacity: 0, y: 26 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.1 + i * 0.12,
      ease: [0.2, 0.7, 0.2, 1] as const,
    },
  }),
};

function ThreeWaysCard({
  pillar,
  index,
  mounted,
  isSectionInView,
}: {
  pillar: Pillar;
  index: number;
  mounted: boolean;
  isSectionInView: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate={mounted && isSectionInView ? "visible" : "hidden"}
      variants={CARD_RISE}
      custom={index}
      className="h-full"
    >
      <Link
        href={pillar.href}
        className="pillars-v3-card group flex h-full flex-col overflow-hidden rounded-xl border border-[rgba(139,94,60,0.18)] bg-surface-elevated no-underline shadow-[0_1px_2px_rgba(44,42,38,0.06),0_10px_26px_-14px_rgba(44,42,38,0.4)]"
        aria-label={`${pillar.title} — ${pillar.content}`}
      >
        <div
          className="relative overflow-hidden bg-surface-inset"
          style={{ aspectRatio: "16/11" }}
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
          <div
            className="pointer-events-none absolute inset-0 z-[15]"
            style={{
              background:
                "linear-gradient(to top, rgba(36,24,12,0.62) 0%, rgba(36,24,12,0.05) 46%, rgba(36,24,12,0.18) 100%)",
            }}
            aria-hidden
          />
          <Image
            src={pillar.image}
            alt={pillar.imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1200px) 33vw, 380px"
            className="pillars-v3-photo object-cover object-top"
            style={
              pillar.imageFilter
                ? ({
                    "--pillars-v3-photo-rest": pillar.imageFilter,
                    "--pillars-v3-photo-hover":
                      pillar.imageFilterHover ?? "brightness(1.02)",
                  } as React.CSSProperties)
                : undefined
            }
          />
          <span
            className="absolute left-3 top-3 z-20 bg-crimson px-2 py-1 font-body text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-white shadow-sm"
            aria-hidden
          >
            {pillar.subtitle}
          </span>
          <span
            className="absolute bottom-1 left-4 z-20 font-heading text-[clamp(50px,5.2vw,68px)] font-semibold italic leading-none tracking-[-0.05em] text-[rgba(251,247,238,0.96)] [text-shadow:0_2px_14px_rgba(0,0,0,0.4)]"
            aria-hidden
          >
            {pillar.numeral}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-[22px] pb-5 pt-[22px]">
          <h3 className="m-0 font-heading text-[23px] font-semibold tracking-[-0.015em] text-heading">
            {pillar.title}
          </h3>
          <p className="mb-0 mt-[9px] flex-1 font-body text-[15px] leading-[1.55] text-muted">
            {pillar.content}
          </p>

          {pillar.caption && (
            <p
              className="mt-3 border-l-2 pl-3 font-body text-[13px] leading-[1.6] text-muted"
              style={{ borderColor: "rgba(139,94,60,0.45)" }}
            >
              {pillar.caption}
            </p>
          )}

          <div
            className="mt-[17px] h-px"
            style={{ background: "rgba(139,94,60,0.18)" }}
            aria-hidden
          />

          <div className="mt-3.5 flex items-center justify-between">
            <span className="section-subtitle">{pillar.linkLabel}</span>
            <span className="pillars-v3-arrow-btn" aria-hidden>
              <ArrowRight className="pillars-v3-arrow-icon h-[15px] w-[15px]" strokeWidth={2.2} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function PillarsThreeWaysIn() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative w-full bg-bg py-[clamp(48px,7vw,88px)] pb-[clamp(40px,5vw,64px)]${isInView ? " identity-in-view" : ""}`}
    >
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[min(100%,1680px)] px-5 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[660px] text-center">
          <p className="section-subtitle mb-[13px] !text-[11px] !tracking-[0.22em]">
            Three ways in
          </p>
          <h2 className="m-0 font-heading text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.12] tracking-[-0.02em] text-heading">
            Wherever you&apos;d like to{" "}
            <span className="identity-one-underline italic font-medium">begin.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] font-body text-[15px] leading-[1.6] text-muted">
            Three doors into the same family story — follow the people, the histories, or the
            keepsakes.
          </p>
        </div>

        <div
          className="mt-[clamp(36px,4vw,52px)] grid gap-[26px]"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(262px, 1fr))" }}
        >
          {PILLARS.map((pillar, index) => (
            <ThreeWaysCard
              key={pillar.title}
              pillar={pillar}
              index={index}
              mounted={mounted}
              isSectionInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
