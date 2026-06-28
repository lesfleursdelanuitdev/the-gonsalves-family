import type { PublicProfileNote } from "@/lib/notes/public-profile-note";

export interface PublicEvent {
  id: string;
  eventType: string;
  typeLabel: string;
  customType: string | null;
  eventLabel: string | null;
  value: string | null;
  cause: string | null;
  dateLabel: string | null;
  year: number | null;
  placeLabel: string | null;
  placeHref: string | null;
  subjectName: string | null;
  subjectHref: string | null;
  profileHref: string;
  privacyRestricted: boolean;
  loginHref: string | null;
}

export interface PublicEventProfile extends PublicEvent {
  notes: PublicProfileNote[];
}
