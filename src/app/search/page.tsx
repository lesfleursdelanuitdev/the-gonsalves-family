import { AdvancedSearchPage } from "@/components/search/AdvancedSearchPage";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";

export const metadata = {
  title: "Advanced Search · The Gonsalves Family",
  description: "Search the Gonsalves family tree by name, place, dates, and family relationships.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; q?: string }>;
}) {
  const [nlTreeId, params] = await Promise.all([getPublicResearchTreeId(), searchParams]);
  return <AdvancedSearchPage nlTreeId={nlTreeId} initialMode={params.mode} initialQ={params.q} />;
}
