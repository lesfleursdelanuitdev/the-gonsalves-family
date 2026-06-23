import type { AlbumViewModel, MediaSummary } from "@ligneous/album-view";
import { buildPublicMediaPath } from "@/lib/album/public-album-links";
import {
  collapseLinkedIndividualsForViewer,
  countFeaturedPeople,
} from "@/lib/auth/living-person-privacy";
import {
  isMediaLinkedToAnyLivingPeople,
  LIVING_MEDIA_PLACEHOLDER_COVER,
  shouldGateLivingLinkedEntity,
  type MediaLivingLinkInput,
} from "@/lib/auth/living-exclusive-media";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import type { PublicViewer } from "@/lib/auth/public-viewer";

function mediaHasLivingLinkedPeople(media: MediaSummary): boolean {
  const people = media.linkedIndividuals ?? [];
  return people.some((person) => person.isLiving);
}

function redactMediaItemForViewer(
  media: MediaSummary,
  viewer: PublicViewer,
  source: AlbumViewModel["source"],
): MediaSummary {
  const hasLiving = mediaHasLivingLinkedPeople(media);
  const privacyRestricted = shouldGateLivingLinkedEntity(viewer, hasLiving);
  const linkedIndividuals = collapseLinkedIndividualsForViewer(media.linkedIndividuals ?? [], viewer);

  if (!privacyRestricted) {
    return { ...media, linkedIndividuals, privacyRestricted: false };
  }

  return {
    ...media,
    fileRef: LIVING_MEDIA_PLACEHOLDER_COVER,
    linkedIndividuals,
    privacyRestricted: true,
    loginHref: buildLoginWallPath(buildPublicMediaPath(source, media.id)),
  };
}

export function applyAlbumViewModelLivingPrivacy(
  model: AlbumViewModel,
  viewer: PublicViewer,
  mediaLivingLinksById?: Map<string, MediaLivingLinkInput>,
): AlbumViewModel {
  const media = model.media.map((item) => {
    const livingInput = mediaLivingLinksById?.get(item.id);
    const hasLiving = livingInput
      ? isMediaLinkedToAnyLivingPeople(livingInput)
      : mediaHasLivingLinkedPeople(item);
    const privacyRestricted = shouldGateLivingLinkedEntity(viewer, hasLiving);
    const linkedIndividuals = collapseLinkedIndividualsForViewer(item.linkedIndividuals ?? [], viewer);

    if (!privacyRestricted) {
      return { ...item, linkedIndividuals, privacyRestricted: false };
    }

    return {
      ...item,
      fileRef: LIVING_MEDIA_PLACEHOLDER_COVER,
      linkedIndividuals,
      privacyRestricted: true,
      loginHref: buildLoginWallPath(buildPublicMediaPath(model.source, item.id)),
    };
  });

  const coverMedia =
    model.coverMedia != null ? redactMediaItemForViewer(model.coverMedia, viewer, model.source) : null;

  return {
    ...model,
    media,
    coverMedia,
    linkedIndividuals: collapseLinkedIndividualsForViewer(model.linkedIndividuals ?? [], viewer),
  };
}

export { countFeaturedPeople };
