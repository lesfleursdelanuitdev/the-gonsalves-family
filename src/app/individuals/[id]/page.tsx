import { notFound } from "next/navigation";
import { IndividualProfilePage as IndividualProfileView } from "@/components/individuals/IndividualProfilePage";
import { loadPublicIndividualById } from "@/lib/individuals/load-public-individuals";

type Params = Promise<{ id: string }>;

export default async function IndividualProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const person = await loadPublicIndividualById(id);
  if (!person) return notFound();

  return <IndividualProfileView person={person} />;
}
