import Link from "next/link";
import { UpcomingDates } from "@/components/homepage/UpcomingDates";

/**
 * Test page for the UpcomingDates component in isolation.
 * Visit /upcoming-dates-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function UpcomingDatesTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-6 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <UpcomingDates />
      </main>
    </div>
  );
}
