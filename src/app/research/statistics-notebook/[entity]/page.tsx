import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { StatsEntityShell } from "@/components/statistics/StatsEntityShell";
import { StatisticsAnalyticsEnginePreview } from "@/components/statistics/StatisticsAnalyticsEnginePreview";
import { StatisticsNotebookMobileNav } from "@/components/statistics/StatisticsNotebookMobileNav";
import { getPublicResearchTreeId } from "@/lib/research-public-tree";
import { getEntityBySlug, VALID_ENTITY_SLUGS } from "@/lib/stats-entities";

type Params = { entity: string };

export async function generateStaticParams() {
  return VALID_ENTITY_SLUGS.map((entity) => ({ entity }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { entity: slug } = await params;
  const def = getEntityBySlug(slug);
  if (!def) return { title: "Statistics notebook · The Gonsalves Family" };
  return {
    title: `${def.question} · Statistics · The Gonsalves Family`,
    description: def.description,
  };
}

export default async function StatisticsEntityPage({ params }: { params: Promise<Params> }) {
  const { entity: slug } = await params;
  const def = getEntityBySlug(slug);
  if (!def) notFound();

  const treeId = await getPublicResearchTreeId();

  return (
    <ResearchPageShell
      title={def.question}
      description={def.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Research", href: "/research" },
        { label: "Statistics notebook", href: "/research/statistics-notebook" },
        { label: def.name },
      ]}
      wideContent
    >
      <StatsEntityShell toc={def.toc}>
        <StatisticsAnalyticsEnginePreview treeId={treeId} entity={slug} />
      </StatsEntityShell>
      <StatisticsNotebookMobileNav />
    </ResearchPageShell>
  );
}
