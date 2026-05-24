import { prisma } from "@/lib/database/prisma";
import { formatNoteLinkedEventLabel } from "@ligneous/gedcom-events";
import { markdownToPlainPreview } from "@ligneous/gedcom-events";
import type { PublicNote, PublicNoteLink, PublicNoteLinkKind } from "@/lib/notes/public-note-types";
import { stripSlashesFromName } from "@/lib/surnames/surname-query";
import { resolveTreeFileUuid } from "@/lib/tree";

function noteDisplayNumber(xref: string | null, ordinal: number): string {
  if (xref) {
    const digits = xref.replace(/[^0-9]/g, "");
    if (digits) {
      const n = parseInt(digits, 10);
      if (Number.isFinite(n)) return `#${String(n).padStart(2, "0")}`;
    }
  }
  return `#${String(ordinal).padStart(2, "0")}`;
}

function familyLabel(husband: string | null | undefined, wife: string | null | undefined): string {
  const h = stripSlashesFromName(husband);
  const w = stripSlashesFromName(wife);
  if (h && w) return `${h} & ${w}`;
  return h || w || "Family";
}

export async function loadPublicNotes(): Promise<PublicNote[]> {
  const fileUuid = await resolveTreeFileUuid();
  if (!fileUuid) return [];

  const rows = await prisma.gedcomNote.findMany({
    where: { fileUuid },
    include: {
      individualNotes: {
        include: {
          individual: { select: { id: true, fullName: true } },
        },
      },
      familyNotes: {
        include: {
          family: {
            select: {
              id: true,
              husbandId: true,
              wifeId: true,
              husband: { select: { id: true, fullName: true } },
              wife: { select: { id: true, fullName: true } },
            },
          },
        },
      },
      eventNotes: {
        include: {
          event: { select: { id: true, eventType: true, customType: true } },
        },
      },
      sourceNotes: {
        include: {
          source: { select: { id: true, title: true, xref: true } },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return rows.map((note, index) => {
    const linkedTargets: PublicNoteLink[] = [];
    const linkedIndividualIds: string[] = [];
    const linkedFamilyPartnerIndividualIds: string[] = [];
    const linkKindSet = new Set<PublicNoteLinkKind>();

    for (const link of note.individualNotes) {
      const name = stripSlashesFromName(link.individual?.fullName);
      const id = link.individual?.id;
      if (name && id) {
        linkKindSet.add("individual");
        linkedIndividualIds.push(id);
        linkedTargets.push({
          kind: "individual",
          label: name,
          href: `/individuals/${id}`,
        });
      }
    }

    for (const link of note.familyNotes) {
      const id = link.family?.id;
      if (!id) continue;
      linkKindSet.add("family");
      const husbandId = link.family?.husband?.id ?? link.family?.husbandId;
      const wifeId = link.family?.wife?.id ?? link.family?.wifeId;
      if (husbandId) linkedFamilyPartnerIndividualIds.push(husbandId);
      if (wifeId) linkedFamilyPartnerIndividualIds.push(wifeId);
      const label = familyLabel(link.family?.husband?.fullName, link.family?.wife?.fullName);
      linkedTargets.push({
        kind: "family",
        label,
        href: `/families/${id}`,
      });
    }

    for (const link of note.eventNotes) {
      const et = link.event?.eventType;
      if (!et) continue;
      linkKindSet.add("event");
      linkedTargets.push({
        kind: "event",
        label: formatNoteLinkedEventLabel(et, link.event?.customType ?? null),
        href: null,
      });
    }

    for (const link of note.sourceNotes) {
      const title = link.source?.title?.trim() || link.source?.xref?.trim();
      if (title) {
        linkKindSet.add("source");
        linkedTargets.push({
          kind: "source",
          label: title,
          href: null,
        });
      }
    }

    const uniquePartnerIds = [...new Set(linkedFamilyPartnerIndividualIds)];

    const contentPlain = markdownToPlainPreview(note.content, 10_000);
    const contentPreview = markdownToPlainPreview(note.content, 320);
    const xref = note.xref?.trim() || null;
    const linkedLabels = linkedTargets.map((t) => t.label).join(" ");

    return {
      id: note.id,
      xref,
      displayNumber: noteDisplayNumber(xref, index + 1),
      contentPreview,
      searchText: [xref, contentPlain, linkedLabels].filter(Boolean).join(" ").toLowerCase(),
      isTopLevel: note.isTopLevel,
      createdAt: note.createdAt.toISOString(),
      linkedTargets,
      linkKinds: [...linkKindSet],
      linkedIndividualIds,
      linkedFamilyPartnerIndividualIds: uniquePartnerIds,
    };
  });
}
