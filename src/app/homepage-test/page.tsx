"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/homepage/HeroAndMenu/Navbar";
import { JourneyStrip } from "@/components/homepage/JourneyStrip";

const HeroAndMenu = dynamic(
  () =>
    import("@/components/homepage/HeroAndMenu").then((m) => ({
      default: m.HeroAndMenu,
    })),
  { ssr: false, loading: () => <div className="min-h-[420px] animate-pulse bg-bg/20" /> }
);

const Pillars = dynamic(
  () => import("@/components/homepage/Pillars").then((m) => ({ default: m.Pillars })),
  { ssr: false, loading: () => <div className="min-h-[200px] animate-pulse bg-bg/20" /> }
);

const Identity = dynamic(
  () => import("@/components/homepage/Identity").then((m) => ({ default: m.Identity })),
  { ssr: false, loading: () => <div className="min-h-[200px] animate-pulse bg-bg/20" /> }
);

const Statistics = dynamic(
  () => import("@/components/homepage/Statistics").then((m) => ({ default: m.Statistics })),
  { ssr: false, loading: () => <div className="min-h-[200px] animate-pulse bg-bg/20" /> }
);

/**
 * Test page: Navbar + HeroAndMenu + Pillars + JourneyStrip + Identity + Statistics (for isolating overflow).
 * Visit /homepage-test to preview.
 */
export default function HomepageTestPage() {
  return (
    <div className="min-h-screen w-full max-w-full min-w-0 bg-bg m-0 p-0" suppressHydrationWarning>
      <main className="min-h-screen w-full max-w-full min-w-0 m-0 p-0">
        <Navbar />
        <HeroAndMenu />
        <Pillars />
        <JourneyStrip />
        <Identity />
        <Statistics />
      </main>
    </div>
  );
}
