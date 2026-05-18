import {
  buildSurnameStatisticsForIndividualIds,
  type SurnameStatisticsPayload,
} from "@/lib/surnames/build-surname-statistics";
import { fetchIndividualIdsForGivenNameId } from "@/lib/given-names/given-name-query";

export type GivenNameStatisticsPayload = SurnameStatisticsPayload;

export async function buildGivenNameStatisticsForIndividualIds(
  ids: string[],
): Promise<GivenNameStatisticsPayload> {
  return buildSurnameStatisticsForIndividualIds(ids);
}

export async function buildGivenNameStatisticsForGivenNameId(
  givenNameId: string,
): Promise<GivenNameStatisticsPayload> {
  const ids = await fetchIndividualIdsForGivenNameId(givenNameId);
  return buildGivenNameStatisticsForIndividualIds(ids);
}