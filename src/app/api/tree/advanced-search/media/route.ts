import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { resolveTreeFileUuid, resolveTreeId } from "@/lib/tree";
import {
  applyLivingPrivacyToGedcomMediaSearchItem,
  batchGedcomMediaIdsWithLivingLinkedPeople,
} from "@/lib/auth/living-exclusive-media";
import { resolvePublicViewer } from "@/lib/auth/public-viewer-context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function esc(s: string) { return s.replace(/\\/g,"\\\\").replace(/%/g,"\\%").replace(/_/g,"\\_"); }
function pct(s: string) { return `%${esc(s)}%`; }
type P = unknown[];
function qp(p: P, v: unknown): string { p.push(v); return `$${p.length}`; }

type MediaType = "image" | "document" | "audio" | "video" | "story" | "other";

function normalizeMediaType(source: string, form: string | null): MediaType {
  if (source === "story") return "story";
  const f = (form ?? "").toLowerCase().trim();
  if (f === "image" || f.startsWith("image/") || ["jpeg","jpg","png","gif","tiff","tif","bmp","webp"].includes(f)) return "image";
  if (f === "audio" || f.startsWith("audio/") || ["mp3","wav","ogg","aac","flac","m4a"].includes(f)) return "audio";
  if (f === "video" || f.startsWith("video/") || ["mp4","avi","mov","wmv","mkv","webm","mpg","mpeg"].includes(f)) return "video";
  if (f === "document" || f.startsWith("text/") || f.startsWith("application/")
    || ["pdf","doc","docx","txt","text","rtf","html"].includes(f)) return "document";
  return "other";
}

// Static SQL conditions — no params (constant literals only)
const GEDCOM_TYPE: Record<string, string> = {
  image:    `(LOWER(gm.form) IN ('jpeg','jpg','png','gif','tiff','tif','bmp','webp','image') OR gm.form ILIKE 'image/%')`,
  document: `(LOWER(gm.form) IN ('pdf','doc','docx','text','txt','rtf','html') OR gm.form ILIKE 'text/%' OR gm.form ILIKE 'application/%')`,
  audio:    `(LOWER(gm.form) IN ('mp3','wav','ogg','aac','flac','m4a','audio') OR gm.form ILIKE 'audio/%')`,
  video:    `(LOWER(gm.form) IN ('mp4','avi','mov','wmv','mkv','webm','mpg','mpeg','video') OR gm.form ILIKE 'video/%')`,
};

// ---------------------------------------------------------------------------
// Fragment builders — each returns a SELECT that fits the UNION shape
// (id, source, title, form_display, file_ref, slug, kind)
// ---------------------------------------------------------------------------
function gedcomFragment(
  p: P, fileUuid: string, title: string | null,
  fileTypes: string[], // empty = no type filter
  linkedToKind: string | null, linkedToId: string | null,
  tagId: string | null, albumId: string | null,
): string {
  const w: string[] = [];
  w.push(`gm.file_uuid = ${qp(p, fileUuid)}::uuid`);
  if (title) w.push(`gm.title ILIKE ${qp(p, pct(title))}`);
  if (fileTypes.length > 0) {
    const parts = fileTypes.map(t => GEDCOM_TYPE[t]).filter(Boolean);
    if (parts.length) w.push(`(${parts.join(" OR ")})`);
  }
  if (tagId)   w.push(`EXISTS (SELECT 1 FROM gedcom_media_app_tags x WHERE x.gedcom_media_id = gm.id AND x.tag_id = ${qp(p, tagId)}::uuid)`);
  if (albumId) w.push(`EXISTS (SELECT 1 FROM album_gedcom_media x WHERE x.gedcom_media_id = gm.id AND x.album_id = ${qp(p, albumId)}::uuid)`);
  if (linkedToKind === "person" && linkedToId)
    w.push(`EXISTS (SELECT 1 FROM gedcom_individual_media_v2 x WHERE x.media_id = gm.id AND x.individual_id = ${qp(p, linkedToId)}::uuid)`);
  else if (linkedToKind === "family" && linkedToId)
    w.push(`EXISTS (SELECT 1 FROM gedcom_family_media_v2 x WHERE x.media_id = gm.id AND x.family_id = ${qp(p, linkedToId)}::uuid)`);
  else if (linkedToKind === "event" && linkedToId)
    w.push(`EXISTS (SELECT 1 FROM gedcom_event_media_v2 x WHERE x.media_id = gm.id AND x.event_id = ${qp(p, linkedToId)}::uuid)`);
  return `SELECT gm.id::text, 'gedcom'::text AS source, gm.title::text AS title,
    COALESCE(LOWER(gm.form),'other')::text AS form_display, gm.file_ref::text AS file_ref,
    NULL::text AS slug, NULL::text AS kind
  FROM gedcom_media_v2 gm
  WHERE ${w.join("\n    AND ")}`;
}

function siteFragment(
  p: P, treeId: string, title: string | null,
  forms: string[], // 'image'|'document'|'audio'|'video' (empty = no filter)
  tagId: string | null, albumId: string | null,
): string {
  const w: string[] = [];
  w.push(`sm.tree_id = ${qp(p, treeId)}::uuid`);
  w.push(`sm.deleted_at IS NULL`);
  if (title) w.push(`sm.title ILIKE ${qp(p, pct(title))}`);
  if (forms.length > 0) {
    const places = forms.map(f => qp(p, f)).join(", ");
    w.push(`sm.form::text IN (${places})`);
  }
  if (tagId)   w.push(`EXISTS (SELECT 1 FROM site_media_tags x WHERE x.site_media_id = sm.id AND x.tag_id = ${qp(p, tagId)}::uuid)`);
  if (albumId) w.push(`EXISTS (SELECT 1 FROM album_site_media x WHERE x.site_media_id = sm.id AND x.album_id = ${qp(p, albumId)}::uuid)`);
  return `SELECT sm.id::text, 'site'::text AS source, sm.title::text AS title,
    sm.form::text AS form_display, sm.file_ref::text AS file_ref,
    NULL::text AS slug, NULL::text AS kind
  FROM site_media sm
  WHERE ${w.join("\n    AND ")}`;
}

function userFragment(
  p: P, treeId: string, title: string | null,
  forms: string[],
  tagId: string | null, albumId: string | null,
): string {
  const w: string[] = [];
  w.push(`um.tree_id = ${qp(p, treeId)}::uuid`);
  w.push(`um.deleted_at IS NULL`);
  if (title) w.push(`um.title ILIKE ${qp(p, pct(title))}`);
  if (forms.length > 0) {
    const places = forms.map(f => qp(p, f)).join(", ");
    w.push(`um.form::text IN (${places})`);
  }
  if (tagId)   w.push(`EXISTS (SELECT 1 FROM user_media_tags x WHERE x.user_media_id = um.id AND x.tag_id = ${qp(p, tagId)}::uuid)`);
  if (albumId) w.push(`EXISTS (SELECT 1 FROM album_user_media x WHERE x.user_media_id = um.id AND x.album_id = ${qp(p, albumId)}::uuid)`);
  return `SELECT um.id::text, 'user'::text AS source, um.title::text AS title,
    um.form::text AS form_display, um.storage_key::text AS file_ref,
    NULL::text AS slug, NULL::text AS kind
  FROM user_media um
  WHERE ${w.join("\n    AND ")}`;
}

function storyFragment(
  p: P, treeId: string, title: string | null,
  linkedToKind: string | null, linkedToId: string | null,
  tagId: string | null, albumId: string | null,
): string {
  const w: string[] = [];
  w.push(`s.tree_id = ${qp(p, treeId)}::uuid`);
  w.push(`s.deleted_at IS NULL`);
  w.push(`s.is_published = true`);
  if (title) w.push(`s.title ILIKE ${qp(p, pct(title))}`);
  if (tagId)   w.push(`EXISTS (SELECT 1 FROM story_tags x WHERE x.story_id = s.id AND x.tag_id = ${qp(p, tagId)}::uuid)`);
  if (albumId) w.push(`EXISTS (SELECT 1 FROM album_stories x WHERE x.story_id = s.id AND x.album_id = ${qp(p, albumId)}::uuid)`);
  if (linkedToKind === "person" && linkedToId)
    w.push(`EXISTS (SELECT 1 FROM story_individuals x WHERE x.story_id = s.id AND x.individual_id = ${qp(p, linkedToId)}::uuid)`);
  else if (linkedToKind === "family" && linkedToId)
    w.push(`EXISTS (SELECT 1 FROM story_families x WHERE x.story_id = s.id AND x.family_id = ${qp(p, linkedToId)}::uuid)`);
  else if (linkedToKind === "event" && linkedToId)
    w.push(`EXISTS (SELECT 1 FROM story_events x WHERE x.story_id = s.id AND x.event_id = ${qp(p, linkedToId)}::uuid)`);
  return `SELECT s.id::text, 'story'::text AS source, s.title::text AS title,
    'story'::text AS form_display, s.cover_media_id::text AS file_ref,
    s.slug::text AS slug, s.kind::text AS kind
  FROM stories s
  WHERE ${w.join("\n    AND ")}`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const [fileUuid, treeId] = await Promise.all([resolveTreeFileUuid(), resolveTreeId()]);
    if (!fileUuid || !treeId) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    const sp = req.nextUrl.searchParams;
    const title       = sp.get("title")?.trim() || null;
    const mediaTypes  = (sp.get("mediaTypes") ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const linkedToKind = sp.get("linkedToKind")?.trim() || null; // person|family|event
    const linkedToId   = sp.get("linkedToId")?.trim() || null;
    const tagId        = sp.get("tagId")?.trim() || null;
    const albumId      = sp.get("albumId")?.trim() || null;
    const limit  = Math.min(50, Math.max(1, parseInt(sp.get("limit")  ?? "20", 10) || 20));
    const offset = Math.max(0,           parseInt(sp.get("offset") ?? "0",  10) || 0);

    const hasTypeFilter = mediaTypes.length > 0;
    const fileTypes  = mediaTypes.filter(t => ["image","document","audio","video"].includes(t));
    const wantsFile  = !hasTypeFilter || fileTypes.length > 0;
    const wantsStory = !hasTypeFilter || mediaTypes.includes("story");
    // "recipe" type: not in schema yet — always returns zero results (greyed-out chip only)

    const hasLinkedTo = !!(linkedToKind && linkedToId);

    // Site/user media excluded when a linked-to entity is specified
    const includeGedcom = wantsFile;
    const includeSite   = wantsFile && !hasLinkedTo;
    const includeUser   = wantsFile && !hasLinkedTo;
    const includeStory  = wantsStory;

    if (!includeGedcom && !includeSite && !includeUser && !includeStory) {
      return NextResponse.json({ items: [], total: 0, hasMore: false, limit, offset });
    }

    const p: P = [];
    const frags: string[] = [];
    const lt = hasLinkedTo ? linkedToKind : null;
    const lid = hasLinkedTo ? linkedToId : null;
    const ft = hasTypeFilter ? fileTypes : [];

    if (includeGedcom) frags.push(gedcomFragment(p, fileUuid, title, ft, lt, lid, tagId, albumId));
    if (includeSite)   frags.push(siteFragment(p, treeId, title, ft, tagId, albumId));
    if (includeUser)   frags.push(userFragment(p, treeId, title, ft, tagId, albumId));
    if (includeStory)  frags.push(storyFragment(p, treeId, title, lt, lid, tagId, albumId));

    const union = frags.join("\n  UNION ALL\n  ");

    const countP = [...p];
    const rowP   = [...p, limit, offset];
    const lRef   = `$${rowP.length - 1}`;
    const oRef   = `$${rowP.length}`;

    const countSql = `SELECT COUNT(*) AS n FROM (${union}) AS _m`;
    const rowsSql  = `SELECT * FROM (${union}) AS _m ORDER BY LOWER(_m.title) NULLS LAST, _m.id LIMIT ${lRef} OFFSET ${oRef}`;

    const [countRows, itemRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ n: bigint }>>(countSql, ...countP),
      prisma.$queryRawUnsafe<Array<{
        id: string; source: string; title: string | null;
        form_display: string | null; file_ref: string | null;
        slug: string | null; kind: string | null;
      }>>(rowsSql, ...rowP),
    ]);

    const total = Number(countRows[0]?.n ?? 0);

    const viewer = await resolvePublicViewer();
    const gedcomIds = itemRows.filter((r) => r.source === "gedcom").map((r) => r.id);
    const gatedMediaIds = await batchGedcomMediaIdsWithLivingLinkedPeople(prisma, fileUuid, gedcomIds);

    const items = itemRows.map((r) => {
      const base = {
        id: r.id,
        source: r.source as "gedcom" | "site" | "user" | "story",
        title: r.title,
        mediaType: normalizeMediaType(r.source, r.form_display),
        fileRef: r.file_ref,
        slug: r.slug,
        kind: r.kind,
        profileHref:
          r.source === "story"
            ? r.slug
              ? `/stories/${r.slug}`
              : `/stories/${r.id}`
            : `/media/${r.id}`,
      };
      if (r.source !== "gedcom") return base;
      return applyLivingPrivacyToGedcomMediaSearchItem(
        base,
        viewer,
        gatedMediaIds.has(r.id),
      );
    });

    return NextResponse.json({ items, total, hasMore: offset + items.length < total, limit, offset });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
