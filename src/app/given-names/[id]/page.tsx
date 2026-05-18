import { notFound } from "next/navigation";
import { GivenNameProfilePage } from "@/components/given-names/GivenNameProfilePage";
import { loadPublicGivenNameById } from "@/lib/given-names/load-public-given-name-by-id";

type Params = Promise<{ id: string }>;

export default async function GivenNameProfileRoute({ params }: { params: Params }) {
  const { id } = await params;
  const givenName = await loadPublicGivenNameById(id);
  if (!givenName) return notFound();

  return <GivenNameProfilePage givenName={givenName} />;
}
