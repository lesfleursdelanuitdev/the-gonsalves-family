import type { AlbumViewModel } from "@ligneous/album-view";
import { filterFeaturedIndividualsForViewer } from "@/lib/auth/living-person-privacy";
import type { PublicViewer } from "@/lib/auth/public-viewer";

type LinkedPerson = {
  id: string;
  isLiving?: boolean;
};

function filterLinkedPeople<T extends LinkedPerson>(people: T[] | undefined, viewer: PublicViewer): T[] {
  return filterFeaturedIndividualsForViewer(people ?? [], viewer);
}

export function applyAlbumViewModelLivingPrivacy(
  model: AlbumViewModel,
  viewer: PublicViewer,
): AlbumViewModel {
  const media = model.media.map((item) => ({
    ...item,
    linkedIndividuals: filterLinkedPeople(item.linkedIndividuals, viewer),
  }));

  const coverMedia =
    model.coverMedia != null
      ? {
          ...model.coverMedia,
          linkedIndividuals: filterLinkedPeople(model.coverMedia.linkedIndividuals, viewer),
        }
      : null;

  return {
    ...model,
    media,
    coverMedia,
    linkedIndividuals: filterLinkedPeople(model.linkedIndividuals, viewer),
  };
}
