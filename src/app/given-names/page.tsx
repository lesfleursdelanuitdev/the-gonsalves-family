import { GivenNamesPage } from "@/components/given-names/GivenNamesPage";
import { loadPublicGivenNames } from "@/lib/given-names/load-public-given-names";

export default async function GivenNamesRoutePage() {
  const givenNames = await loadPublicGivenNames();
  return <GivenNamesPage givenNames={givenNames} />;
}
