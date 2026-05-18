import { SurnamesPage } from "@/components/surnames/SurnamesPage";
import { loadPublicSurnames } from "@/lib/surnames/load-public-surnames";

export default async function SurnamesRoutePage() {
  const surnames = await loadPublicSurnames();
  return <SurnamesPage surnames={surnames} />;
}
