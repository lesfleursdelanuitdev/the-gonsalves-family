import Link from "next/link";
import { HeroV2 } from "@/components/homepage/HeroAndMenu/Hero/HeroV2";

/**
 * Test page for the Hero component in isolation.
 * Visit /hero-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function HeroTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-0 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <HeroV2 />
      </main>
    </div>
  );
}
