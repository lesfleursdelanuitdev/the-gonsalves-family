import type { Metadata } from "next";
import { loadPublicSources } from "@/lib/research/load-public-sources";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";
import { sourceDisplayLabel } from "@/components/research/source-label";

export const metadata: Metadata = {
  title: "Sources · Research · The Gonsalves Family",
  description: "Citations and documentary references in the published tree.",
};

export default async function ResearchSourcesPage() {
  const sources = await loadPublicSources();

  return (
    <ResearchPageShell
      title="Sources"
      description="GEDCOM source records linked to people, families, and events."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Research", href: "/research" }, { label: "Sources" }]}
    >
      {sources.length === 0 ? (
        <p className="text-muted text-center text-sm">No sources in the published tree.</p>
      ) : (
        <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface/40">
          {sources.map((source) => (
            <li key={source.id} className="px-5 py-4">
              <p className="text-heading font-medium">{sourceDisplayLabel(source)}</p>
              {(source.author || source.publication) && (
                <p className="text-muted mt-1 text-sm">
                  {[source.author, source.publication].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ResearchPageShell>
  );
}
