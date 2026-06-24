/** Anchor ids for the mobile-only profile column (`md:hidden`). Must not match desktop section ids. */
export const MOBILE_PROFILE_SECTION_ID = {
  overview: "profile-m-overview",
  family: "profile-m-family",
  associates: "profile-m-associates",
  events: "profile-m-events",
  media: "profile-m-media",
  charts: "profile-m-charts",
  notes: "profile-m-notes",
  stories: "profile-m-stories",
  openQuestions: "profile-m-open-questions",
  relationship: "profile-m-relationship",
} as const;

export type MobileProfileSectionKey = keyof typeof MOBILE_PROFILE_SECTION_ID;

export function mobileProfileSectionHref(key: MobileProfileSectionKey): string {
  return `#${MOBILE_PROFILE_SECTION_ID[key]}`;
}
