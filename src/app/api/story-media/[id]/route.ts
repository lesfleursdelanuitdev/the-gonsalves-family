import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveGedcomMediaFileRef } from "@/lib/images";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", avif: "image/avif",
  svg: "image/svg+xml", bmp: "image/bmp", tiff: "image/tiff",
  pdf: "application/pdf", mp4: "video/mp4", mp3: "audio/mpeg",
};

function mimeFromPath(ref: string | null | undefined): string | null {
  const ext = ref?.split(".").pop()?.toLowerCase();
  return ext ? (EXT_MIME[ext] ?? null) : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const mediaId = (id ?? "").trim();
  if (!mediaId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Try gedcomMedia first (most common for archive images), then siteMedia, then userMedia.
  const gedcom = await prisma.gedcomMedia.findFirst({
    where: { id: mediaId },
    select: { fileRef: true, form: true, title: true },
  });
  if (gedcom?.fileRef?.trim()) {
    const ref = gedcom.fileRef.trim();
    const url = resolveGedcomMediaFileRef(ref);
    const mimeType = mimeFromPath(ref);
    return NextResponse.json({ url, fileRef: ref, form: gedcom.form ?? null, mimeType, title: gedcom.title ?? null });
  }

  const site = await prisma.siteMedia.findFirst({
    where: { id: mediaId },
    select: { fileRef: true, storageKey: true, mimeType: true, form: true, title: true },
  });
  if (site) {
    const ref = site.fileRef?.trim() || site.storageKey?.trim();
    if (ref) {
      const url = resolveGedcomMediaFileRef(ref);
      const mimeType = site.mimeType?.trim() || mimeFromPath(ref);
      return NextResponse.json({ url, fileRef: ref, form: site.form ?? null, mimeType: mimeType ?? null, title: site.title ?? null });
    }
  }

  const user = await prisma.userMedia.findFirst({
    where: { id: mediaId },
    select: { fileRef: true, storageKey: true, mimeType: true, form: true, title: true },
  });
  if (user) {
    const ref = user.fileRef?.trim() || user.storageKey?.trim();
    if (ref) {
      const url = resolveGedcomMediaFileRef(ref);
      const mimeType = user.mimeType?.trim() || mimeFromPath(ref);
      return NextResponse.json({ url, fileRef: ref, form: user.form ?? null, mimeType: mimeType ?? null, title: user.title ?? null });
    }
  }

  return NextResponse.json({ error: "Media not found" }, { status: 404 });
}
