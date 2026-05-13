import { IndividualsPage } from "@/components/individuals/IndividualsPage";
import { loadPublicIndividuals } from "@/lib/individuals/load-public-individuals";

export default async function IndividualsRoutePage() {
  const individuals = await loadPublicIndividuals();
  return <IndividualsPage individuals={individuals} />;
}
