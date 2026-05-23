import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { fullPlaceLabelFromGedcomPlace, GEDCOM_PLACE_DISPLAY_SELECT } from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import type { PublicPlace, PublicPlaceProfile } from "@/components/places/types";

function familyTitle(
  husband: { fullName: string | null; xref: string } | null,
  wife: { fullName: string | null; xref: string } | null,
  xref: string,
): string {
  const names = [husband, wife]
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => formatGedcomFullNameForDisplay(p.fullName ?? p.xref));
  return names.length > 0 ? names.join(" & ") : xref;
}

export async function loadPublicPlaces(): Promise<PublicPlace[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = await prisma.gedcomPlace.findMany({
    where: { fileUuid },
    select: {
      id: true,
      ...GEDCOM_PLACE_DISPLAY_SELECT,
      latitude: true,
      longitude: true,
      _count: {
        select: {
          individualBirthPlaces: true,
          individualDeathPlaces: true,
          familyMarriagePlaces: true,
        },
      },
    },
    orderBy: [{ country: "asc" }, { state: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => {
    // Prefer resolved coordinates when available (more accurate / curated by admin)
    const resolved = row.resolvedLink?.resolvedPlace;
    const lat = resolved?.latitude ?? row.latitude;
    const lon = resolved?.longitude ?? row.longitude;
    return {
      id: row.id,
      label: fullPlaceLabelFromGedcomPlace(row) ?? row.original,
      name: row.name,
      county: row.county,
      state: row.state,
      country: row.country,
      latitude: lat != null ? Number(lat) : null,
      longitude: lon != null ? Number(lon) : null,
      birthCount: row._count.individualBirthPlaces,
      deathCount: row._count.individualDeathPlaces,
      marriageCount: row._count.familyMarriagePlaces,
      profileHref: `/tree/places/${row.id}`,
    };
  });
}

export async function loadPublicPlaceById(id: string): Promise<PublicPlaceProfile | null> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return null;

  const row = await prisma.gedcomPlace.findFirst({
    where: { id, fileUuid },
    select: {
      id: true,
      ...GEDCOM_PLACE_DISPLAY_SELECT,
      latitude: true,
      longitude: true,
      individualBirthPlaces: {
        select: { id: true, fullName: true, xref: true, birthYear: true },
        orderBy: { birthYear: "asc" },
      },
      individualDeathPlaces: {
        select: { id: true, fullName: true, xref: true, deathYear: true },
        orderBy: { deathYear: "asc" },
      },
      familyMarriagePlaces: {
        select: {
          id: true,
          xref: true,
          marriageYear: true,
          husband: { select: { fullName: true, xref: true } },
          wife: { select: { fullName: true, xref: true } },
        },
        orderBy: { marriageYear: "asc" },
      },
    },
  });

  if (!row) return null;

  const label = fullPlaceLabelFromGedcomPlace(row) ?? row.original;
  const resolved = row.resolvedLink?.resolvedPlace;
  const lat = resolved?.latitude ?? row.latitude;
  const lon = resolved?.longitude ?? row.longitude;

  return {
    id: row.id,
    label,
    name: row.name,
    county: row.county,
    state: row.state,
    country: row.country,
    latitude: lat != null ? Number(lat) : null,
    longitude: lon != null ? Number(lon) : null,
    birthCount: row.individualBirthPlaces.length,
    deathCount: row.individualDeathPlaces.length,
    marriageCount: row.familyMarriagePlaces.length,
    profileHref: `/tree/places/${row.id}`,
    birthIndividuals: row.individualBirthPlaces.map((i) => ({
      id: i.id,
      name: formatGedcomFullNameForDisplay(i.fullName ?? i.xref),
      year: i.birthYear ?? null,
      profileHref: `/individuals/${i.id}`,
    })),
    deathIndividuals: row.individualDeathPlaces.map((i) => ({
      id: i.id,
      name: formatGedcomFullNameForDisplay(i.fullName ?? i.xref),
      year: i.deathYear ?? null,
      profileHref: `/individuals/${i.id}`,
    })),
    marriageFamilies: row.familyMarriagePlaces.map((f) => ({
      id: f.id,
      title: familyTitle(f.husband, f.wife, f.xref),
      year: f.marriageYear ?? null,
      profileHref: `/families/${f.id}`,
    })),
  };
}
