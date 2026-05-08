import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Statistics } from "@/components/homepage/Statistics";
import { StatisticsAnalyticsEnginePreview } from "@/components/statistics/StatisticsAnalyticsEnginePreview";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";

/**
 * Test route: homepage Statistics counts + stats-engine analytics (names + individuals, Python API) with Plotly.
 * Visit /statistics-test — not linked from main nav.
 */
export const metadata: Metadata = {
  title: "Statistics test · The Gonsalves Family",
  description: "Debug homepage Statistics UI and research analytics (including individuals).",
  robots: { index: false, follow: false },
};

export default async function StatisticsTestPage() {
  const treeId = await getPublicResearchTreeId();

  return (
    <div className="bg-bg min-h-screen text-text">
      <Navbar />
      <main className="min-h-screen py-8">
        <p className="text-muted px-6 pb-4 text-center text-sm">
          <span className="text-text font-medium">Test route</span>
          {" · "}
          <Link href="/" className="text-link hover:text-link-hover underline-offset-2 hover:underline">
            ← Home
          </Link>
        </p>

        <Statistics />

        <div className="mx-auto mt-14 max-w-6xl border-t border-border-subtle px-4 pt-12 md:px-8">
          <StatisticsAnalyticsEnginePreview treeId={treeId} />
        </div>
      </main>
    </div>
  );
}
