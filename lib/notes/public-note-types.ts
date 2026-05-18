export type PublicNoteLinkKind = "individual" | "family" | "event" | "source";

export type PublicNoteLink = {
  kind: PublicNoteLinkKind;
  label: string;
  href: string | null;
};

export type PublicNote = {
  id: string;
  xref: string | null;
  /** Display label for card header, e.g. "#01". */
  displayNumber: string;
  contentPreview: string;
  searchText: string;
  isTopLevel: boolean;
  createdAt: string;
  linkedTargets: PublicNoteLink[];
  /** Distinct link kinds present on this note (for entity-type filter). */
  linkKinds: PublicNoteLinkKind[];
  linkedIndividualIds: string[];
  /** Partner individual ids on linked families (for person filter via spouse names). */
  linkedFamilyPartnerIndividualIds: string[];
};

export type NotesSelectedPerson = {
  id: string;
  fullName: string;
};
