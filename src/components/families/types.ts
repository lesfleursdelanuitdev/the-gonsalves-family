import type { PublicProfileNote } from "@/lib/notes/public-profile-note";
import type { PublicProfileTimelineItem } from "@/lib/timeline/public-timeline";

export type DivorcedStatus = "yes" | "no" | "unknown";

export type PublicFamilyPartner = {
  id: string;
  xref: string;
  fullName: string;
  portraitSrc: string | null;
  sex: string | null;
  gender: string | null;
};

export type PublicFamily = {
  id: string;
  xref: string;
  /** Display title, e.g. "Maria Silva & John Gonsalves". */
  title: string;
  partners: PublicFamilyPartner[];
  childrenCount: number;
  marriageDateLabel: string | null;
  marriagePlaceLabel: string | null;
  marriageYear: number | null;
  divorcedStatus: DivorcedStatus;
  albumHref: string;
  profileHref: string;
};

export type PublicFamilyMemberRole = "Partner" | "Child";

export type PublicFamilyMember = {
  id: string;
  xref: string;
  fullName: string;
  role: PublicFamilyMemberRole;
  sex: string | null;
  gender: string | null;
  birthDateLabel: string | null;
  deathDateLabel: string | null;
  birthYear: number | null;
  deathYear: number | null;
  partnersCount: number;
  childrenCount: number;
  portraitSrc: string | null;
  profileHref: string;
};

export type PublicFamilyProfile = PublicFamily & {
  members: PublicFamilyMember[];
  timeline: PublicProfileTimelineItem[];
  notes: PublicProfileNote[];
};
