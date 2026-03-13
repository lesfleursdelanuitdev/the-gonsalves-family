import Link from "next/link";
import { PreviewTree } from "@/components/homepage/PreviewTree";

/**
 * Test page for the PreviewTree component in isolation.
 * Visit /preview-tree-test to debug layout and styling
 * without the rest of the homepage.
 */
export default function PreviewTreeTestPage() {
  return (
    <div className="min-h-screen bg-bg">
      <main className="min-h-screen py-8">
        <p className="px-6 pb-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-text">
            ← Back to home
          </Link>
        </p>
        <PreviewTree />
      </main>
    </div>
  );
}
