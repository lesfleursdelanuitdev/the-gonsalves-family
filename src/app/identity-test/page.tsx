import Link from "next/link";
import { Identity } from "@/components/homepage/Identity";

/**
 * Test page for the Identity component in isolation.
 * Visit /identity-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function IdentityTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-6 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <Identity />
      </main>
    </div>
  );
}
