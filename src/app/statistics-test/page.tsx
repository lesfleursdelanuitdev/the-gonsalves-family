import Link from "next/link";
import { Statistics } from "@/components/homepage/Statistics";

/**
 * Test page for the Statistics component in isolation.
 * Visit /statistics-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function StatisticsTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-6 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <Statistics />
      </main>
    </div>
  );
}
