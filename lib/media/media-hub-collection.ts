/** Query `?collection=` on `/media`; reserved for future filtered views. */
export type MediaHubCollectionId = "mixed" | "photos" | "documents" | "video" | "audio";

const ALLOWED = new Set<string>(["mixed", "photos", "documents", "video", "audio"]);

export function parseMediaHubCollection(raw: string | undefined | null): MediaHubCollectionId {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v === "mixed") return "mixed";
  if (ALLOWED.has(v)) return v as MediaHubCollectionId;
  return "mixed";
}

export function mediaHubCollectionHref(id: MediaHubCollectionId): string {
  if (id === "mixed") return "/media";
  return `/media?collection=${encodeURIComponent(id)}`;
}

export const MEDIA_HUB_COLLECTION_NAV: ReadonlyArray<{
  id: MediaHubCollectionId;
  label: string;
  /** Shorter label for very narrow horizontal scroll strips */
  shortLabel: string;
}> = [
  { id: "mixed", label: "Mixed media", shortLabel: "Mixed" },
  { id: "photos", label: "Photos only", shortLabel: "Photos" },
  { id: "documents", label: "Documents only", shortLabel: "Docs" },
  { id: "video", label: "Video only", shortLabel: "Video" },
  { id: "audio", label: "Audio only", shortLabel: "Audio" },
];
