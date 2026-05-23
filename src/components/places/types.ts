export interface PublicPlace {
  id: string;
  label: string;
  name: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  birthCount: number;
  deathCount: number;
  marriageCount: number;
  profileHref: string;
}

export interface PublicPlacePerson {
  id: string;
  name: string;
  year: number | null;
  profileHref: string;
}

export interface PublicPlaceFamily {
  id: string;
  title: string;
  year: number | null;
  profileHref: string;
}

export interface PublicPlaceProfile extends PublicPlace {
  birthIndividuals: PublicPlacePerson[];
  deathIndividuals: PublicPlacePerson[];
  marriageFamilies: PublicPlaceFamily[];
}
