import { notFound } from "next/navigation";
import { PlaceProfilePage } from "@/components/places/PlaceProfilePage";
import { loadPublicPlaceById } from "@/lib/places/load-public-places";

type Params = Promise<{ id: string }>;

export default async function PlaceProfileRoute({ params }: { params: Params }) {
  const { id } = await params;
  const place = await loadPublicPlaceById(id);
  if (!place) return notFound();
  return <PlaceProfilePage place={place} />;
}
