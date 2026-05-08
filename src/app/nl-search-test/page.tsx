import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { NlSearchPlayground } from "@/components/research/NlSearchPlayground";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";

/**
 * Isolated shell for QA/debug of the NL search playground (same UI as /research/nl-search).
 * Visit /nl-search-test — not linked from site nav.
 */
export const metadata: Metadata = {
  title: "NL search playground (test) · The Gonsalves Family",
  description: "Development/test route for the natural language search playground.",
  robots: { index: false, follow: false },
};

export default async function NlSearchTestPage() {
  const treeId = await getPublicResearchTreeId();

  return (
    <div className="bg-bg min-h-screen text-text">
      <Navbar />
      <main>
        <p className="text-muted mx-auto max-w-4xl px-4 pt-4 text-center text-sm">
          <span className="text-text font-medium">Test route</span>
          {" · "}
          <Link href="/research/nl-search" className="text-link hover:text-link-hover underline-offset-2 hover:underline">
            /research/nl-search
          </Link>
          {" · "}
          <Link href="/" className="text-link hover:text-link-hover underline-offset-2 hover:underline">
            ← Home
          </Link>
        </p>
        <NlSearchPlayground treeId={treeId} />
      </main>
    </div>
  );
}
