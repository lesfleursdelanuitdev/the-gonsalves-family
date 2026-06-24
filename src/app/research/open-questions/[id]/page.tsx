import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenQuestionDetailPage } from "@/components/research/OpenQuestionDetailPage";
import { loadPublicOpenQuestionById } from "@/lib/research/load-public-open-questions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const question = await loadPublicOpenQuestionById(id);
  if (!question) {
    return {
      title: "Open question · Research · The Gonsalves Family",
    };
  }

  return {
    title: `${question.question} · Open questions · Research · The Gonsalves Family`,
    description: question.details?.trim() || "Unresolved research item in the published family tree.",
  };
}

export default async function ResearchOpenQuestionDetailRoute({ params }: { params: Params }) {
  const { id } = await params;
  const question = await loadPublicOpenQuestionById(id);
  if (!question) notFound();

  return <OpenQuestionDetailPage question={question} />;
}
