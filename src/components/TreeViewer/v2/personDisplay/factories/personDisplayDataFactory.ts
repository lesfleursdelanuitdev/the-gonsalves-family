import type { PersonDisplayData } from "../types";

export interface BuildPersonDisplayDataParams {
  personId: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  dates?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  xref?: string | null;
  uuid?: string | null;
  hasMultipleFamiliesAsChild?: boolean;
}

export function buildPersonDisplayData(
  params: BuildPersonDisplayDataParams
): PersonDisplayData {
  return {
    personId: params.personId,
    xref: params.xref ?? null,
    uuid: params.uuid ?? null,
    name: params.name,
    firstName: params.firstName ?? null,
    lastName: params.lastName ?? null,
    dates: params.dates ?? null,
    avatarUrl: params.avatarUrl ?? null,
    gender: params.gender ?? null,
    metadata: {
      hasMultipleFamiliesAsChild: Boolean(params.hasMultipleFamiliesAsChild),
    },
  };
}
