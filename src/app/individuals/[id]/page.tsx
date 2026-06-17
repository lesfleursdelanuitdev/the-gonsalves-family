import { notFound, redirect } from "next/navigation";
import { IndividualProfilePage as IndividualProfileView } from "@/components/individuals/IndividualProfilePage";
import { buildLoginWallPath } from "@/lib/auth/public-viewer-context";
import { canViewFullIndividual, resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import { loadPublicIndividualById } from "@/lib/individuals/load-public-individuals";
import { loadIndividualLivingStatus } from "@/lib/individuals/load-individual-living-status";

type Params = Promise<{ id: string }>;

export default async function IndividualProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const [viewer, livingStatus] = await Promise.all([resolvePublicViewer(), loadIndividualLivingStatus(id)]);
  if (!livingStatus) return notFound();

  if (!canViewFullIndividual(viewer, livingStatus.isLiving)) {
    redirect(buildLoginWallPath(`/individuals/${encodeURIComponent(id)}`));
  }

  const person = await loadPublicIndividualById(id, viewer);
  if (!person) return notFound();

  return <IndividualProfileView person={person} />;
}
