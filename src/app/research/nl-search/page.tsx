import type { Metadata } from "next";
import { NlSearchPlayground } from "@/components/research/NlSearchPlayground";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";

export const metadata: Metadata = {
  title: "Analytics search · Research · The Gonsalves Family",
  description: "Ask plain-language questions against the published family tree analytics API.",
};

export default async function ResearchNlSearchPage() {
  const treeId = await getPublicResearchTreeId();

  return (
    <ResearchPageShell
      title="Analytics search"
      description="Ask questions about names, places, events, and more in plain language."
    >
      <NlSearchPlayground treeId={treeId} />
    </ResearchPageShell>
  );
}
