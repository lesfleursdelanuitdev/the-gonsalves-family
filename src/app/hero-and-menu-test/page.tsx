"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const HeroAndMenu = dynamic(
  () =>
    import("@/components/homepage/HeroAndMenu").then((m) => ({
      default: m.HeroAndMenu,
    })),
  { ssr: false, loading: () => <div className="min-h-[420px] animate-pulse bg-bg/20" /> }
);

/**
 * Test page for the HeroAndMenu component in isolation.
 * Visit /hero-and-menu-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function HeroAndMenuTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-0 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <HeroAndMenu />
      </main>
    </div>
  );
}
