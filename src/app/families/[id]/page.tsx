import { notFound } from "next/navigation";
import { FamilyProfilePage as FamilyProfileView } from "@/components/families/FamilyProfilePage";
import { loadPublicFamilyById } from "@/lib/families/load-public-family-by-id";

type Params = Promise<{ id: string }>;

export default async function FamilyProfileRoute({ params }: { params: Params }) {
  const { id } = await params;
  const family = await loadPublicFamilyById(id);
  if (!family) return notFound();

  return <FamilyProfileView family={family} />;
}
