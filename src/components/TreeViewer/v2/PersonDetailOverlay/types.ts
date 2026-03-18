export interface PersonDetailOverlayPerson {
  name: string;
  xref: string;
  uuid: string | null;
}

export interface PersonDetailOverlayProps {
  person: PersonDetailOverlayPerson;
  onClose: () => void;
  isMobile?: boolean;
}

export interface DetailEvent {
  eventType: string;
  customType: string | null;
  value: string | null;
  cause: string | null;
  dateOriginal: string | null;
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

export interface FamiliesAsChildResponse {
  familiesOfOrigin: {
    family: { id: string; xref: string };
    parents: { role: string; name: string | null; xref: string; gender?: string | null }[];
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
  notes: { id: string; xref: string | null; content: string }[];
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
