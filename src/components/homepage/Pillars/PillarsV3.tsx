"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { PILLARS } from "@/data/pillars";
import { FindFamilySection } from "./sections/FindFamilySection";
import { ReadHistoriesSection } from "./sections/ReadHistoriesSection";
import { ViewMediaSection } from "./sections/ViewMediaSection";
import { PILLARS_SECTION_SURFACE } from "./pillars-section-surface";

export function PillarsV3() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full overflow-x-hidden py-0"
      style={{
        backgroundColor: PILLARS_SECTION_SURFACE,
        boxShadow:
          "0 -8px 40px rgba(0,0,0,0.04), 0 14px 48px -4px rgba(0,0,0,0.05), 0 6px 24px -4px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-48 w-full -translate-x-1/2 md:w-[min(120%,40rem)]"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(255, 250, 240, 0.22) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      {/* Inset lives on FindFamilySection / ReadHistoriesSection / ViewMediaSection roots only — no padding on this row. */}
      <div className="relative m-0 flex w-full min-w-0 flex-col gap-0 p-0 md:flex-row">
        <FindFamilySection
          pillar={PILLARS[0]}
          index={0}
          mounted={mounted}
          isSectionInView={isInView}
        />
        <ReadHistoriesSection
          pillar={PILLARS[1]}
          index={1}
          mounted={mounted}
          isSectionInView={isInView}
        />
        <ViewMediaSection
          pillar={PILLARS[2]}
          index={2}
          mounted={mounted}
          isSectionInView={isInView}
        />
      </div>
    </section>
  );
}
