"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { FindFamilySection } from "@/components/homepage/Pillars/sections/FindFamilySection";
import { PILLARS_SECTION_SURFACE } from "@/components/homepage/Pillars/pillars-section-surface";
import { PILLARS } from "@/data/pillars";

/**
 * Isolated preview of the Find Family pillar (pedigree background + edge card).
 * Full layout is recreated here for debugging without the other two columns.
 */
export default function FindFamilySectionTestPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-6 pb-2 text-center text-sm text-muted">
          <Link href="/pillars-test" className="underline hover:text-text">
            ← Pillars tests
          </Link>
        </p>
        <p className="px-6 pb-6 text-center text-xs text-muted">FindFamilySection — single column</p>
        <section
          ref={sectionRef}
          className="relative z-10 w-full overflow-x-hidden"
          style={{
            backgroundColor: PILLARS_SECTION_SURFACE,
            boxShadow:
              "0 -8px 40px rgba(0,0,0,0.04), 0 14px 48px -4px rgba(0,0,0,0.05), 0 6px 24px -4px rgba(0,0,0,0.03)",
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-full -translate-x-1/2 md:w-[min(120%,40rem)]"
            style={{
              background: "radial-gradient(ellipse at center top, rgba(255, 250, 240, 0.22) 0%, transparent 65%)",
            }}
            aria-hidden
          />
          <FindFamilySection
            pillar={PILLARS[0]}
            index={0}
            mounted={mounted}
            isSectionInView={isInView}
          />
        </section>
      </main>
    </div>
  );
}
