import { notFound } from "next/navigation";
import { SurnameProfilePage } from "@/components/surnames/SurnameProfilePage";
import { loadPublicSurnameById } from "@/lib/surnames/load-public-surname-by-id";

type Params = Promise<{ id: string }>;

export default async function SurnameProfileRoute({ params }: { params: Params }) {
  const { id } = await params;
  const surname = await loadPublicSurnameById(id);
  if (!surname) return notFound();

  return <SurnameProfilePage surname={surname} />;
}
