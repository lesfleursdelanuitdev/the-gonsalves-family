import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveGedcomMediaFileRef } from "@/lib/images";

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
    const url = resolveGedcomMediaFileRef(gedcom.fileRef.trim());
    return NextResponse.json({ url, form: gedcom.form ?? null, title: gedcom.title ?? null });
  }

  const site = await prisma.siteMedia.findFirst({
    where: { id: mediaId },
    select: { fileRef: true, storageKey: true, form: true, title: true },
  });
  if (site) {
    const ref = site.fileRef?.trim() || site.storageKey?.trim();
    if (ref) {
      const url = resolveGedcomMediaFileRef(ref);
      return NextResponse.json({ url, form: site.form ?? null, title: site.title ?? null });
    }
  }

  const user = await prisma.userMedia.findFirst({
    where: { id: mediaId },
    select: { fileRef: true, storageKey: true, form: true, title: true },
  });
  if (user) {
    const ref = user.fileRef?.trim() || user.storageKey?.trim();
    if (ref) {
      const url = resolveGedcomMediaFileRef(ref);
      return NextResponse.json({ url, form: user.form ?? null, title: user.title ?? null });
    }
  }

  return NextResponse.json({ error: "Media not found" }, { status: 404 });
}
