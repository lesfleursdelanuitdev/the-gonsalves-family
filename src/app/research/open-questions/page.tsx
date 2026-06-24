import type { Metadata } from "next";
import { OpenQuestionsPage } from "@/components/research/OpenQuestionsPage";
import { loadPublicOpenQuestions } from "@/lib/research/load-public-open-questions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open questions · Research · The Gonsalves Family",
  description: "Unresolved research items in the published tree.",
};

export default async function ResearchOpenQuestionsPage() {
  const questions = await loadPublicOpenQuestions();

  return <OpenQuestionsPage questions={questions} />;
}
