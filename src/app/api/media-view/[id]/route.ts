import { NextRequest, NextResponse } from "next/server";
import type { AlbumViewModel } from "@ligneous/album-view";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid } from "@/lib/tree";
import {
  parseSourceFromSearchParams,
  sourceToAlbumApiQuery,
} from "@/lib/album/public-album-links";
import {
  resolveCuratedAlbumViewModelPublic,
  resolveGeneratedAlbumViewModelPublic,
  resolveMainPhotosViewModelPublic,
  type MainPhotosViewModel,
} from "@/lib/album/resolve-public-album-view-model";
import { filterFeaturedIndividualsForViewer } from "@/lib/auth/living-person-privacy";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const mediaId = (id ?? "").trim();
    if (!mediaId) {
      return NextResponse.json({ error: "Missing media id" }, { status: 400 });
    }

    const fileUuid = await resolveTreeFileUuid();
    if (!fileUuid) {
      return NextResponse.json({ error: "Tree not configured" }, { status: 503 });
    }

    const kindParam = (request.nextUrl.searchParams.get("kind") ?? "").trim().toLowerCase();

    let model: AlbumViewModel | MainPhotosViewModel | null;
    let sourceQuery: string;
    if (kindParam === "mainphotos") {
      model = await resolveMainPhotosViewModelPublic(prisma, fileUuid);
      sourceQuery = "kind=mainPhotos";
    } else {
      const source = parseSourceFromSearchParams(request.nextUrl.searchParams);
      if (!source) {
        return NextResponse.json({ error: "Missing or invalid source query" }, { status: 400 });
      }
      model =
        source.type === "album"
          ? await resolveCuratedAlbumViewModelPublic(prisma, fileUuid, source.albumId)
          : await resolveGeneratedAlbumViewModelPublic(prisma, fileUuid, source);
      sourceQuery = sourceToAlbumApiQuery(source);
    }
    if (!model) return NextResponse.json({ error: "Album/source not found" }, { status: 404 });

    const membership = model.media.find((m) => m.id === mediaId);
    if (!membership) {
      return NextResponse.json({ error: "Media is not part of this shared source" }, { status: 404 });
    }

    const media = await prisma.gedcomMedia.findFirst({
      where: { id: mediaId, fileUuid },
      select: {
        id: true,
        title: true,
        fileRef: true,
        form: true,
        description: true,
        placeLinks: {
          select: {
            place: {
              select: { id: true, original: true, name: true, county: true, state: true, country: true },
            },
          },
        },
        dateLinks: {
          select: {
            date: {
              select: {
                id: true,
                original: true,
                dateType: true,
                year: true,
                month: true,
                day: true,
                endYear: true,
                endMonth: true,
                endDay: true,
              },
            },
          },
        },
        eventMedia: {
          select: {
            event: {
              select: {
                id: true,
                eventType: true,
                customType: true,
                individualEvents: {
                  select: {
                    individual: { select: { id: true, fullName: true, xref: true } },
                  },
                  take: 1,
                },
                familyEvents: {
                  select: {
                    family: {
                      select: {
                        husband: { select: { id: true, fullName: true, xref: true } },
                        wife: { select: { id: true, fullName: true, xref: true } },
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
        },
        familyMedia: {
          select: {
            family: {
              select: {
                id: true,
                husband: { select: { fullName: true, xref: true } },
                wife: { select: { fullName: true, xref: true } },
              },
            },
          },
        },
        appTags: {
          select: { tag: { select: { id: true, name: true } } },
        },
        albumLinks: {
          select: { album: { select: { id: true, name: true } } },
        },
      },
    });

    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    const albums = media.albumLinks
      .map((x) => x.album)
      .filter((a): a is { id: string; name: string } => Boolean(a))
      .map((a) => ({ id: a.id, name: a.name }));

    const viewer = await resolvePublicViewer();
    const linkedIndividuals = filterFeaturedIndividualsForViewer(
      membership.linkedIndividuals ?? [],
      viewer,
    );

    return NextResponse.json({
      source: {
        kind: model.kind,
        title: model.title,
        description: model.description ?? null,
        totalCount: model.totalCount,
        coverMedia: model.coverMedia
          ? {
              id: model.coverMedia.id,
              title: model.coverMedia.title,
              fileRef: model.coverMedia.fileRef,
              form: model.coverMedia.form,
            }
          : null,
      },
      media: {
        id: media.id,
        title: media.title,
        fileRef: media.fileRef,
        form: media.form,
        description: media.description,
        linkedIndividuals,
        places: media.placeLinks.map((x) => x.place).filter(Boolean),
        dates: media.dateLinks.map((x) => x.date).filter(Boolean),
        events: media.eventMedia.map((x) => x.event).filter(Boolean),
        families: media.familyMedia.map((x) => x.family).filter(Boolean),
        tags: media.appTags.map((x) => x.tag).filter(Boolean),
        albums,
      },
      sourceQuery,
    });
  } catch (err) {
    console.error("[api/media-view/[id]]", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Media view failed", detail }, { status: 500 });
  }
}
