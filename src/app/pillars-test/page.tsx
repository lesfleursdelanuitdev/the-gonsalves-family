import Link from "next/link";
import { Pillars } from "@/components/homepage/Pillars";

/**
 * Test page for the Pillars component in isolation.
 * Visit /pillars-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function PillarsTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-0 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <p className="px-6 pb-6 text-center text-xs text-muted">
          Single pillar:&nbsp;
          <Link href="/pillars/find-family-test" className="underline hover:text-text">
            Find Family
          </Link>
          {" · "}
          <Link href="/pillars/read-histories-test" className="underline hover:text-text">
            Read Histories
          </Link>
          {" · "}
          <Link href="/pillars/view-media-test" className="underline hover:text-text">
            View Media
          </Link>
        </p>
        <Pillars />
      </main>
    </div>
  );
}
