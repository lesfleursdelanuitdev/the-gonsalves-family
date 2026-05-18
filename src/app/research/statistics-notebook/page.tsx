import type { Metadata } from "next";
import { StatisticsAnalyticsEnginePreview } from "@/components/statistics/StatisticsAnalyticsEnginePreview";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";

export const metadata: Metadata = {
  title: "Statistics notebook · Research · The Gonsalves Family",
  description: "Charts and counts across the published family tree.",
};

export default async function ResearchStatisticsNotebookPage() {
  const treeId = await getPublicResearchTreeId();

  return (
    <ResearchPageShell
      title="Statistics notebook"
      description="Interactive charts and summaries from the tree analytics engine."
    >
      <StatisticsAnalyticsEnginePreview treeId={treeId} />
    </ResearchPageShell>
  );
}
