export type PersonOverlayNavId =
  | "birth"
  | "death"
  | "families"
  | "sources"
  | "media"
  | "events"
  | "notes"
  | "explore";

/** Stable element ids for scrolling from the section quick-jump footer. */
export const PERSON_DETAIL_SECTION_DOM_ID: Record<PersonOverlayNavId, string> = {
  birth: "person-detail-section-birth",
  death: "person-detail-section-death",
  families: "person-detail-section-families",
  sources: "person-detail-section-sources",
  media: "person-detail-section-media",
  events: "person-detail-section-events",
  notes: "person-detail-section-notes",
  explore: "person-detail-section-explore",
};

export const DEFAULT_SECTION_OPEN: Record<PersonOverlayNavId, boolean> = {
  birth: true,
  death: true,
  families: true,
  sources: true,
  media: true,
  events: true,
  notes: false,
  explore: false,
};
