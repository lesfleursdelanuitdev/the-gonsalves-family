export type PublicIndividualRole =
  | "Family Patriarch"
  | "Family Matriarch"
  | "Son"
  | "Daughter"
  | "Ancestor";

export type PublicIndividual = {
  id: string;
  /** GEDCOM xref for tree viewer deep links (`root=…`). */
  xref: string;
  fullName: string;
  birthYear: number | null;
  deathYear: number | null;
  currentLocationLabel: string | null;
  placeLabels: string[];
  age: number | null;
  childrenCount: number;
  role: PublicIndividualRole | null;
  gender: string | null;
  sex: string | null;
  hasPartner: boolean;
  hasChildren: boolean;
  /** GEDCOM DEAT event has a non-empty `CAUS` / cause field. */
  hasDeathCause: boolean;
  portraitSrc: string | null;
};

export type PublicIndividualRelation = {
  id: string;
  fullName: string;
  birthYear: number | null;
  deathYear: number | null;
  portraitSrc: string | null;
  relationship: string;
};

export type PublicIndividualFamilyGroup = {
  id: string;
  xref: string;
  pedigreeLabel: string | null;
  parents: PublicIndividualRelation[];
  partners: PublicIndividualRelation[];
  children: PublicIndividualRelation[];
  childrenCount: number;
};

export type PublicIndividualTimelineItem = {
  id: string;
  dateLabel: string;
  title: string;
  place: string | null;
  description: string;
  context: "Personal event" | "Family" | "Parent" | "Sibling" | "Grandparent" | "Child" | "Grandchild";
};

export type PublicIndividualPhoto = {
  id: string;
  title: string;
  src: string;
};

export type PublicIndividualNote = {
  id: string;
  xref: string | null;
  content: string;
};

export type PublicIndividualAssociate = PublicIndividualRelation & {
  relationLabel: string;
};

export type PublicIndividualOpenQuestion = {
  id: string;
  question: string;
  details: string | null;
  status: string;
  createdAtLabel: string;
};

export type PublicIndividualLinkedAccount = {
  id: string;
  displayName: string;
  username: string;
  verified: boolean;
  linkedAtLabel: string;
};

export type PublicIndividualProfile = PublicIndividual & {
  biography: string;
  birthDateLabel: string | null;
  birthPlace: string | null;
  deathDateLabel: string | null;
  deathPlace: string | null;
  gender: string | null;
  religion: string | null;
  occupation: string | null;
  nationality: string | null;
  partner: PublicIndividualRelation | null;
  partners: PublicIndividualRelation[];
  /** Legacy shape kept so older serialized payloads do not crash during rollout. */
  spouse?: PublicIndividualRelation | null;
  spouses?: PublicIndividualRelation[];
  parents: PublicIndividualRelation[];
  siblings: PublicIndividualRelation[];
  children: PublicIndividualRelation[];
  familiesAsChild: PublicIndividualFamilyGroup[];
  familiesAsPartner: PublicIndividualFamilyGroup[];
  timeline: PublicIndividualTimelineItem[];
  photos: PublicIndividualPhoto[];
  notes: PublicIndividualNote[];
  associates: PublicIndividualAssociate[];
  openQuestions: PublicIndividualOpenQuestion[];
  linkedAccounts: PublicIndividualLinkedAccount[];
};
