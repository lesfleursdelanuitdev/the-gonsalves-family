import { FamiliesPage } from "@/components/families/FamiliesPage";
import { loadPublicFamilies } from "@/lib/families/load-public-families";

export default async function FamiliesRoutePage() {
  const families = await loadPublicFamilies();
  return <FamiliesPage families={families} />;
}
