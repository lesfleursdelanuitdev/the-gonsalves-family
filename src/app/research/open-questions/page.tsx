import type { Metadata } from "next";
import { loadPublicOpenQuestions } from "@/lib/research/load-public-open-questions";
import { ResearchPageShell } from "@/components/research/ResearchPageShell";

export const metadata: Metadata = {
  title: "Open questions · Research · The Gonsalves Family",
  description: "Unresolved research items in the published tree.",
};

export default async function ResearchOpenQuestionsPage() {
  const questions = await loadPublicOpenQuestions();

  return (
    <ResearchPageShell
      title="Open questions"
      description="Items that still need verification, sources, or clarification."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Research", href: "/research" }, { label: "Open questions" }]}
    >
      {questions.length === 0 ? (
        <p className="text-muted text-center text-sm">No open questions in the published tree.</p>
      ) : (
        <ol className="space-y-4">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="rounded-xl border border-border-subtle bg-surface/50 px-5 py-4"
            >
              <p className="text-heading font-medium">
                <span className="text-muted mr-2 font-normal tabular-nums">{index + 1}.</span>
                {q.question}
              </p>
              {q.details ? (
                <p className="text-muted mt-2 text-sm leading-relaxed">{q.details}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </ResearchPageShell>
  );
}
