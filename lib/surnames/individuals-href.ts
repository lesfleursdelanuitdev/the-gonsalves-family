import { displaySurname } from "@/lib/surnames/surname-query";

/** Exact catalog surname → individuals linked via name forms. */
export function publicIndividualsHrefForSurnameId(surnameId: string): string {
  return `/individuals?surnameId=${encodeURIComponent(surnameId)}`;
}

/** Link to public individuals list filtered by GEDCOM surname prefix (typeahead / legacy). */
export function publicIndividualsHrefForSurname(surname: string): string {
  const lastName = displaySurname(surname);
  if (!lastName) return "/individuals";
  return `/individuals?lastName=${encodeURIComponent(lastName)}`;
}
