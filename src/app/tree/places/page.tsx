import { PlacesPage } from "@/components/places/PlacesPage";
import { loadPublicPlaces } from "@/lib/places/load-public-places";

export default async function PlacesRoutePage() {
  const places = await loadPublicPlaces();
  return <PlacesPage places={places} />;
}
