import { displayGivenName } from "@/lib/given-names/given-name-query";

/** Exact catalog given name → individuals linked via name forms. */
export function publicIndividualsHrefForGivenNameId(givenNameId: string): string {
  return `/individuals?givenNameId=${encodeURIComponent(givenNameId)}`;
}

/** Link to public individuals list filtered by given-name prefix (typeahead / legacy). */
export function publicIndividualsHrefForGivenName(givenName: string): string {
  const label = displayGivenName(givenName);
  if (!label || label === "Unknown") return "/individuals";
  return `/individuals?givenName=${encodeURIComponent(label)}`;
}
