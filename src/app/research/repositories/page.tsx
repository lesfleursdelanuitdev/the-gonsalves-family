import type { Metadata } from "next";
import { loadPublicRepositories } from "@/lib/research/load-public-repositories";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { repositoryDisplayLabel } from "@/components/research/repository-label";

export const metadata: Metadata = {
  title: "Repositories · Research · The Gonsalves Family",
  description: "Archives and holding institutions in the published tree.",
};

export default async function ResearchRepositoriesPage() {
  const repositories = await loadPublicRepositories();

  return (
    <ResearchPageShell
      title="Repositories"
      description="Libraries, archives, and other institutions where sources are held."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Research", href: "/research" }, { label: "Repositories" }]}
    >
      {repositories.length === 0 ? (
        <p className="text-muted text-center text-sm">No repositories in the published tree.</p>
      ) : (
        <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface/40">
          {repositories.map((repo) => (
            <li key={repo.id} className="px-5 py-4">
              <p className="text-heading font-medium">{repositoryDisplayLabel(repo)}</p>
            </li>
          ))}
        </ul>
      )}
    </ResearchPageShell>
  );
}
