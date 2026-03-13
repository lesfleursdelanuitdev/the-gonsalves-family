import Link from "next/link";
import { JourneyStrip } from "@/components/homepage/JourneyStrip";

/**
 * Test page for the Journey Strip component in isolation.
 * Visit /journey-test to debug layout, centering, and animations
 * without the rest of the homepage.
 */
export default function JourneyTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-0 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <JourneyStrip />
      </main>
    </div>
  );
}
