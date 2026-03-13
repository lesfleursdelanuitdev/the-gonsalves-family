"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { PILLARS } from "@/data/pillars";
import { PillarColumn } from "./PillarColumn";

export function Pillars() {
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
        backgroundColor: "rgba(221, 201, 170, 0.45)",
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
      <div className="pillars-main relative flex flex-col gap-6 py-6 px-0 md:flex-row md:gap-8 md:px-6 md:py-0">
        {PILLARS.map((pillar, index) => (
          <PillarColumn
            key={pillar.title}
            pillar={pillar}
            index={index}
            mounted={mounted}
            isSectionInView={isInView}
          />
        ))}
      </div>
    </section>
  );
}
