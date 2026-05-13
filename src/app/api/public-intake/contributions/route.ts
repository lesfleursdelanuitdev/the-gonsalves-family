import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import {
  acceptedHoneypotResponse,
  badRequest,
  checkRateLimit,
  cleanupSavedAttachments,
  formFiles,
  formString,
  getRequestMeta,
  isSpamHoneypot,
  parseJsonObject,
  resolvePublicIntakeTreeId,
  sanitizeContributionType,
  sanitizeEmail,
  sanitizeOptionalText,
  sanitizeRequiredText,
  saveContributionAttachments,
  validateAttachmentFiles,
} from "@/lib/public-intake/intake";

export const runtime = "nodejs";

type ContributionFields = {
  treeId?: unknown;
  contributorFirstName?: unknown;
  contributorLastName?: unknown;
  contributorEmail?: unknown;
  type?: unknown;
  content?: unknown;
  individualXrefs?: unknown;
  relatedIndividualXref?: unknown;
  relatedFamilyXref?: unknown;
  relatedPlace?: unknown;
  relatedDate?: unknown;
};

const MAX_RELATED_INDIVIDUALS = 20;

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "contribution", 3);
  if (limited) return limited;

  const contentType = request.headers.get("content-type") ?? "";
  const parsed =
    contentType.includes("multipart/form-data")
      ? await parseMultipartContribution(request)
      : await parseJsonContribution(request);

  if (!parsed) return badRequest({ body: "Expected JSON or multipart form data." });
  if (isSpamHoneypot(parsed.raw)) return acceptedHoneypotResponse();

  const treeResult = await resolvePublicIntakeTreeId(parsed.fields.treeId);
  if (!treeResult.ok) return badRequest(treeResult.errors);

  const errors = validateContributionFields(parsed.fields);
  Object.assign(errors, validateAttachmentFiles(parsed.files));
  const individualXrefs = extractIndividualXrefs(parsed.fields, errors);
  const resolvedIndividuals = await resolveContributionIndividuals(treeResult.data.gedcomFileId, individualXrefs, errors);
  if (Object.keys(errors).length > 0) return badRequest(errors);

  const contributionId = randomUUID();
  const saved = await saveContributionAttachments(contributionId, parsed.files);

  try {
    const meta = getRequestMeta(request);
    const fields = buildContributionData(parsed.fields, individualXrefs[0] ?? null);
    const created = await prisma.contribution.create({
      data: {
        id: contributionId,
        treeId: treeResult.data.treeId,
        ...fields,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        attachments: saved.length
          ? {
              create: saved.map(({ diskPath: _diskPath, ...file }) => file),
            }
          : undefined,
        individuals: resolvedIndividuals.length
          ? {
              create: resolvedIndividuals.map((individual, index) => ({
                individualId: individual.id,
                fileUuid: individual.fileUuid,
                individualXref: individual.xref,
                individualNameSnapshot: individual.fullName,
                birthDateSnapshot: individual.birthDateDisplay,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        attachments: { select: { id: true, kind: true, fileName: true, mimeType: true } },
        individuals: { select: { id: true, individualXref: true, individualNameSnapshot: true } },
      },
    });
    return NextResponse.json({ contribution: created }, { status: 201 });
  } catch (error) {
    await cleanupSavedAttachments(saved);
    console.error("[public-intake/contributions]", error);
    return NextResponse.json({ error: "Could not save contribution." }, { status: 500 });
  }
}

async function parseJsonContribution(request: NextRequest) {
  const body = await parseJsonObject(request);
  if (!body) return null;
  return { raw: body, fields: body as ContributionFields, files: [] as File[] };
}

async function parseMultipartContribution(request: NextRequest) {
  try {
    const form = await request.formData();
    return {
      raw: form,
      fields: {
        treeId: formString(form, "treeId"),
        contributorFirstName: formString(form, "contributorFirstName"),
        contributorLastName: formString(form, "contributorLastName"),
        contributorEmail: formString(form, "contributorEmail"),
        type: formString(form, "type"),
        content: formString(form, "content"),
        individualXrefs: formStrings(form, "individualXrefs"),
        relatedIndividualXref: formString(form, "relatedIndividualXref"),
        relatedFamilyXref: formString(form, "relatedFamilyXref"),
        relatedPlace: formString(form, "relatedPlace"),
        relatedDate: formString(form, "relatedDate"),
      },
      files: formFiles(form),
    };
  } catch {
    return null;
  }
}

function validateContributionFields(fields: ContributionFields): Record<string, string> {
  const errors: Record<string, string> = {};
  sanitizeRequiredText(fields.contributorFirstName, "contributorFirstName", errors, { max: 255 });
  sanitizeRequiredText(fields.contributorLastName, "contributorLastName", errors, { max: 255 });
  sanitizeEmail(fields.contributorEmail, "contributorEmail", errors);
  sanitizeContributionType(fields.type, errors);
  sanitizeRequiredText(fields.content, "content", errors, { max: 8000, min: 10 });
  return errors;
}

function buildContributionData(fields: ContributionFields, firstIndividualXref: string | null) {
  return {
    contributorFirstName: sanitizeRequiredText(fields.contributorFirstName, "contributorFirstName", {}, { max: 255 }),
    contributorLastName: sanitizeRequiredText(fields.contributorLastName, "contributorLastName", {}, { max: 255 }),
    contributorEmail: sanitizeEmail(fields.contributorEmail, "contributorEmail", {}),
    type: sanitizeContributionType(fields.type, {}),
    content: sanitizeRequiredText(fields.content, "content", {}, { max: 8000, min: 10 }),
    relatedIndividualXref: firstIndividualXref ?? sanitizeOptionalText(fields.relatedIndividualXref, 50),
    relatedFamilyXref: sanitizeOptionalText(fields.relatedFamilyXref, 50),
    relatedPlace: sanitizeOptionalText(fields.relatedPlace, 255),
    relatedDate: sanitizeOptionalText(fields.relatedDate, 255),
  };
}

function formStrings(form: FormData, key: string): string[] {
  return [...form.getAll(key), ...form.getAll(`${key}[]`)].filter(
    (value): value is string => typeof value === "string",
  );
}

function extractIndividualXrefs(fields: ContributionFields, errors: Record<string, string>): string[] {
  const rawValues: unknown[] = [];
  if (Array.isArray(fields.individualXrefs)) {
    rawValues.push(...fields.individualXrefs);
  } else if (fields.individualXrefs != null) {
    rawValues.push(fields.individualXrefs);
  }
  if (fields.relatedIndividualXref != null) {
    rawValues.push(fields.relatedIndividualXref);
  }

  const seen = new Set<string>();
  const xrefs: string[] = [];
  for (const raw of rawValues) {
    const values = typeof raw === "string" ? raw.split(",") : [raw];
    for (const value of values) {
      const xref = sanitizeOptionalText(value, 50);
      if (!xref || seen.has(xref)) continue;
      seen.add(xref);
      xrefs.push(xref);
    }
  }

  if (xrefs.length > MAX_RELATED_INDIVIDUALS) {
    errors.individualXrefs = `Choose up to ${MAX_RELATED_INDIVIDUALS} people.`;
    return xrefs.slice(0, MAX_RELATED_INDIVIDUALS);
  }
  return xrefs;
}

async function resolveContributionIndividuals(
  fileUuid: string | null,
  xrefs: string[],
  errors: Record<string, string>,
) {
  if (xrefs.length === 0) return [];
  if (!fileUuid) {
    errors.individualXrefs = "Public tree is not linked to a GEDCOM file.";
    return [];
  }

  const rows = await prisma.gedcomIndividual.findMany({
    where: { fileUuid, xref: { in: xrefs } },
    select: {
      id: true,
      fileUuid: true,
      xref: true,
      fullName: true,
      birthDateDisplay: true,
    },
  });
  const byXref = new Map(rows.map((row) => [row.xref, row]));
  const missing = xrefs.filter((xref) => !byXref.has(xref));
  if (missing.length > 0) {
    errors.individualXrefs = "One or more selected people could not be found.";
  }
  return xrefs.map((xref) => byXref.get(xref)).filter((row): row is (typeof rows)[number] => Boolean(row));
}
