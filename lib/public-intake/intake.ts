import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { TREE_NAME } from "@/lib/tree";

export type IntakeValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,64}$/;
type ContributionAttachmentKind = "image" | "document" | "audio" | "video" | "other";
const SAFE_ATTACHMENT_TYPES = new Map<string, ContributionAttachmentKind>([
  ["image/jpeg", "image"],
  ["image/png", "image"],
  ["image/gif", "image"],
  ["image/webp", "image"],
  ["application/pdf", "document"],
  ["text/plain", "document"],
  ["text/csv", "document"],
  ["application/msword", "document"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "document"],
  ["application/rtf", "document"],
  ["audio/mpeg", "audio"],
  ["audio/mp3", "audio"],
  ["audio/wav", "audio"],
  ["audio/x-wav", "audio"],
  ["audio/ogg", "audio"],
  ["audio/aac", "audio"],
  ["audio/mp4", "audio"],
  ["audio/x-m4a", "audio"],
  ["audio/flac", "audio"],
  ["video/mp4", "video"],
  ["video/webm", "video"],
  ["video/quicktime", "video"],
]);
const MAX_ATTACHMENT_BYTES_BY_KIND: Record<ContributionAttachmentKind, number> = {
  image: 10 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  other: 0,
};
export const MAX_CONTRIBUTION_ATTACHMENTS = 8;
export const MAX_CONTRIBUTION_ATTACHMENT_BYTES = 100 * 1024 * 1024;
export const MAX_CONTRIBUTION_TOTAL_ATTACHMENT_BYTES = 125 * 1024 * 1024;

export function badRequest(errors: Record<string, string>) {
  return NextResponse.json({ error: "Invalid submission", errors }, { status: 400 });
}

export function acceptedHoneypotResponse() {
  return NextResponse.json({ ok: true, received: true }, { status: 202 });
}

export function getRequestMeta(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return {
    ipAddress: truncate(forwardedFor || realIp || null, 45),
    userAgent: truncate(request.headers.get("user-agent"), 1024),
  };
}

export function checkRateLimit(request: NextRequest, scope: string, max = 5, windowMs = 10 * 60 * 1000) {
  const meta = getRequestMeta(request);
  const key = `${scope}:${meta.ipAddress || "unknown"}`;
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count > max) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }
  return null;
}

export async function parseJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

export function isSpamHoneypot(body: Record<string, unknown> | FormData): boolean {
  const values =
    body instanceof FormData
      ? ["website", "company", "homepage", "url"].map((key) => body.get(key))
      : ["website", "company", "homepage", "url"].map((key) => body[key]);
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

export async function resolvePublicIntakeTreeId(requestedTreeId: unknown): Promise<IntakeValidationResult<{ treeId: string; gedcomFileId: string | null }>> {
  const tree = await prisma.tree.findFirst({
    where: { name: TREE_NAME, isPublic: true },
    select: { id: true, gedcomFileId: true },
  });
  if (!tree) {
    return { ok: false, errors: { treeId: "Public tree is not configured." } };
  }

  const normalizedRequestedTreeId = sanitizeOptionalText(requestedTreeId, 64);
  if (normalizedRequestedTreeId && normalizedRequestedTreeId !== tree.id) {
    return { ok: false, errors: { treeId: "Submission tree does not match this public site." } };
  }
  return { ok: true, data: { treeId: tree.id, gedcomFileId: tree.gedcomFileId } };
}

export function sanitizeRequiredText(
  value: unknown,
  field: string,
  errors: Record<string, string>,
  opts: { max: number; min?: number },
): string {
  const cleaned = sanitizeText(value, opts.max);
  const min = opts.min ?? 1;
  if (!cleaned || cleaned.length < min) {
    errors[field] = "Required.";
    return "";
  }
  return cleaned;
}

export function sanitizeOptionalText(value: unknown, max: number): string | null {
  const cleaned = sanitizeText(value, max);
  return cleaned || null;
}

export function sanitizeEmail(value: unknown, field: string, errors: Record<string, string>): string {
  const email = sanitizeText(value, 255).toLowerCase();
  if (!email) {
    errors[field] = "Required.";
  } else if (!EMAIL_RE.test(email)) {
    errors[field] = "Enter a valid email address.";
  }
  return email;
}

export function sanitizeUsername(value: unknown, field: string, errors: Record<string, string>): string {
  const username = sanitizeText(value, 255);
  if (!username) {
    errors[field] = "Required.";
  } else if (!USERNAME_RE.test(username)) {
    errors[field] = "Use 3-64 letters, numbers, dots, underscores, or hyphens.";
  }
  return username;
}

export type ContributionTypeValue = "memory" | "suggestion" | "recipe" | "language" | "folklore";

const CONTRIBUTION_TYPES = new Set<ContributionTypeValue>([
  "memory",
  "suggestion",
  "recipe",
  "language",
  "folklore",
]);

export function sanitizeContributionType(value: unknown, errors: Record<string, string>): ContributionTypeValue {
  if (typeof value === "string" && CONTRIBUTION_TYPES.has(value as ContributionTypeValue)) {
    return value as ContributionTypeValue;
  }
  errors.type = "Choose a contribution type.";
  return "memory";
}

export function formString(form: FormData, key: string): string | null {
  const value = form.get(key);
  return typeof value === "string" ? value : null;
}

export function formFiles(form: FormData): File[] {
  return [...form.getAll("attachments"), ...form.getAll("files")].filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
}

export function validateAttachmentFiles(files: File[]): Record<string, string> {
  const errors: Record<string, string> = {};
  if (files.length > MAX_CONTRIBUTION_ATTACHMENTS) {
    errors.attachments = `Upload up to ${MAX_CONTRIBUTION_ATTACHMENTS} files.`;
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_CONTRIBUTION_TOTAL_ATTACHMENT_BYTES) {
    errors.attachments = "Uploads must be 125 MB or smaller in total.";
  }
  for (const [index, file] of files.entries()) {
    const mimeType = file.type.trim().toLowerCase();
    const kind = attachmentKindForMimeType(mimeType);
    if (kind === "other") {
      errors[`attachments.${index}`] = "Only images, documents, audio, or video files are allowed.";
    } else if (file.size > MAX_ATTACHMENT_BYTES_BY_KIND[kind]) {
      errors[`attachments.${index}`] = attachmentSizeMessage(kind);
    }
  }
  return errors;
}

export async function saveContributionAttachments(contributionId: string, files: File[]) {
  const root = process.env.PUBLIC_INTAKE_STORAGE_DIR || path.join(process.cwd(), "storage", "public-intake");
  const contributionDir = path.join(root, "contributions", contributionId);
  await mkdir(contributionDir, { recursive: true });

  const saved: Array<{
    kind: ContributionAttachmentKind;
    storageKey: string;
    fileName: string | null;
    mimeType: string | null;
    byteSize: bigint;
    diskPath: string;
  }> = [];

  for (const file of files) {
    const kind = attachmentKindForMimeType(file.type.trim().toLowerCase());
    const safeName = safeBasename(file.name || "upload");
    const storedName = `${randomUUID()}_${safeName}`;
    const diskPath = path.join(contributionDir, kind, storedName);
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
    saved.push({
      kind,
      storageKey: `public-intake/contributions/${contributionId}/${kind}/${storedName}`,
      fileName: safeName,
      mimeType: file.type.trim() || null,
      byteSize: BigInt(file.size),
      diskPath,
    });
  }

  return saved;
}

export function attachmentKindForMimeType(mimeType: string): ContributionAttachmentKind {
  return SAFE_ATTACHMENT_TYPES.get(mimeType.trim().toLowerCase()) ?? "other";
}

function attachmentSizeMessage(kind: ContributionAttachmentKind): string {
  const mb = Math.floor(MAX_ATTACHMENT_BYTES_BY_KIND[kind] / 1024 / 1024);
  return `${kind[0].toUpperCase()}${kind.slice(1)} file must be ${mb} MB or smaller.`;
}

export async function cleanupSavedAttachments(saved: Array<{ diskPath: string }>) {
  await Promise.all(saved.map((file) => unlink(file.diskPath).catch(() => {})));
}

function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, max);
}

function truncate(value: string | null | undefined, max: number): string | null {
  const cleaned = sanitizeText(value, max);
  return cleaned || null;
}

function safeBasename(name: string): string {
  const ext = path.extname(name).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 12);
  const base = path
    .basename(name, path.extname(name))
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "upload"}${ext || ""}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
