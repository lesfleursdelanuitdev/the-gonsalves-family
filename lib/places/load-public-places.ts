import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import { fullPlaceLabelFromGedcomPlace, GEDCOM_PLACE_DISPLAY_SELECT } from "@/lib/gedcom-place-display";
import { formatGedcomFullNameForDisplay } from "@/lib/individual-mapper";
import {
  formatMinimalLivingLabel,
  redactPlacePersonForViewer,
  shouldRedactLivingPerson,
} from "@/lib/auth/living-person-privacy";
import { buildLoginWallPath } from "@/lib/auth/public-viewer";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";
import type { PublicPlace, PublicPlaceProfile } from "@/components/places/types";

function familyTitle(
  husband: { fullName: string | null; xref: string; isLiving?: boolean; birthYear?: number | null } | null,
  wife: { fullName: string | null; xref: string; isLiving?: boolean; birthYear?: number | null } | null,
  xref: string,
  viewer: Awaited<ReturnType<typeof resolvePublicViewer>>,
): string {
  const formatPartner = (p: NonNullable<typeof husband>) => {
    const name = formatGedcomFullNameForDisplay(p.fullName ?? p.xref);
    if (p.isLiving && shouldRedactLivingPerson(viewer, true)) {
      return formatMinimalLivingLabel(name, p.birthYear ?? null);
    }
    return name;
  };
  const names = [husband, wife]
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map(formatPartner);
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
        select: { id: true, fullName: true, xref: true, birthYear: true, isLiving: true },
        orderBy: { birthYear: "asc" },
      },
      individualDeathPlaces: {
        select: { id: true, fullName: true, xref: true, deathYear: true, isLiving: true },
        orderBy: { deathYear: "asc" },
      },
      familyMarriagePlaces: {
        select: {
          id: true,
          xref: true,
          marriageYear: true,
          husband: { select: { fullName: true, xref: true, isLiving: true, birthYear: true } },
          wife: { select: { fullName: true, xref: true, isLiving: true, birthYear: true } },
        },
        orderBy: { marriageYear: "asc" },
      },
    },
  });

  if (!row) return null;

  const viewer = await resolvePublicViewer();
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
    birthIndividuals: row.individualBirthPlaces.map((i) =>
      redactPlacePersonForViewer(
        {
          id: i.id,
          name: formatGedcomFullNameForDisplay(i.fullName ?? i.xref),
          year: i.birthYear ?? null,
          profileHref: `/individuals/${i.id}`,
          isLiving: i.isLiving,
        },
        viewer,
      ),
    ),
    deathIndividuals: row.individualDeathPlaces.map((i) =>
      redactPlacePersonForViewer(
        {
          id: i.id,
          name: formatGedcomFullNameForDisplay(i.fullName ?? i.xref),
          year: i.deathYear ?? null,
          profileHref: `/individuals/${i.id}`,
          isLiving: i.isLiving,
        },
        viewer,
      ),
    ),
    marriageFamilies: row.familyMarriagePlaces.map((f) => {
      const hasLivingPartner = Boolean(f.husband?.isLiving || f.wife?.isLiving);
      const profileHref = `/families/${f.id}`;
      return {
        id: f.id,
        title: familyTitle(f.husband, f.wife, f.xref, viewer),
        year: f.marriageYear ?? null,
        profileHref:
          hasLivingPartner && shouldRedactLivingPerson(viewer, true)
            ? buildLoginWallPath(profileHref)
            : profileHref,
      };
    }),
  };
}
