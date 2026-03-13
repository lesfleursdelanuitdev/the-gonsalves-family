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
        <Pillars />
      </main>
    </div>
  );
}
