export interface PersonDetailOverlayPerson {
  name: string;
  xref: string;
  uuid: string | null;
  isLiving?: boolean;
  birthYear?: number | null;
}

export interface PersonDetailOverlayProps {
  person: PersonDetailOverlayPerson;
  onClose: () => void;
  /** When set, person name links inside the overlay open that profile in place of the current one. */
  onSelectLinkedPerson?: (person: PersonDetailOverlayPerson) => void;
  isMobile?: boolean;
}

export interface DetailEvent {
  eventType: string;
  customType: string | null;
  value: string | null;
  cause: string | null;
  dateOriginal: string | null;
  /** From `gedcom_dates_v2.date_type` when present. */
  dateType: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  placeOriginal: string | null;
  placeName: string | null;
  sortOrder: number;
  source: string;
  familyId: string | null;
  childXref: string | null;
  childName?: string | null;
  spouseName?: string | null;
  spouseXref?: string | null;
}

export interface BasicPersonDetails {
  name: string | null;
  xref: string;
  uuid: string;
  living: boolean;
  gender: string | null;
  birth: { date: string | null; place: string | null; event: DetailEvent | null };
  death: { date: string | null; place: string | null; event: DetailEvent | null };
}

/** GET `/api/tree/individuals/[xref]/detail/media` */
export interface IndividualMediaPeekItem {
  id: string;
  title: string | null;
  fileRef: string | null;
  form: string | null;
}

export interface IndividualMediaPeek {
  individualId: string;
  albumTitle: string;
  totalCount: number;
  profile: IndividualMediaPeekItem | null;
  /** Resolved display image (raster profile or stable linked fallback); use for overlay header/cover. */
  displayPhoto?: IndividualMediaPeekItem | null;
  samples: IndividualMediaPeekItem[];
}

export interface FamiliesAsChildResponse {
  familiesOfOrigin: {
    family: { id: string; xref: string };
    parents: { role: string; name: string | null; xref: string; gender?: string | null }[];
    /** From `gedcom_parent_child_v2` when both parents agree (e.g. `Parents (birth)`). */
    parentsLabel?: string;
    children: { name: string | null; xref: string; gender?: string | null }[];
  }[];
}

export interface FamiliesAsSpouseResponse {
  familiesAsSpouse: {
    family: { id: string; xref: string };
    spouse: { name: string | null; xref: string; gender?: string | null };
    children: { name: string | null; xref: string; gender?: string | null; birth?: { date: string | null; place: string | null } }[];
  }[];
}

export interface NotesResponse {
  notes: {
    id: string;
    xref: string | null;
    content: string;
    privacyRestricted?: boolean;
    loginHref?: string | null;
  }[];
}

export interface SourcesResponse {
  sources: {
    source: { id: string; xref: string; title: string | null; author: string | null; publication: string | null; text: string | null };
    page: string | null;
    quality: number | null;
    citationText: string | null;
  }[];
}

export interface EventsResponse {
  events: DetailEvent[];
}
