import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { NlSearchPlayground } from "@/components/research/NlSearchPlayground";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";

export const metadata: Metadata = {
  title: "Natural language search · The Gonsalves Family",
  description: "Try plain-language questions against the published family tree analytics API.",
};

export default async function ResearchNlSearchPage() {
  const treeId = await getPublicResearchTreeId();

  return (
    <div className="bg-bg min-h-screen text-text">
      <Navbar />
      <main>
        <NlSearchPlayground treeId={treeId} />
      </main>
    </div>
  );
}
