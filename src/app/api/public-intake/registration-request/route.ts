import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import {
  acceptedHoneypotResponse,
  badRequest,
  checkRateLimit,
  getRequestMeta,
  isSpamHoneypot,
  parseJsonObject,
  resolvePublicIntakeTreeId,
  sanitizeEmail,
  sanitizeRequiredText,
  sanitizeUsername,
} from "@/lib/public-intake/intake";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "registration-request", 5);
  if (limited) return limited;

  const body = await parseJsonObject(request);
  if (!body) return badRequest({ body: "Expected a JSON object." });
  if (isSpamHoneypot(body)) return acceptedHoneypotResponse();

  const treeResult = await resolvePublicIntakeTreeId(body.treeId);
  if (!treeResult.ok) return badRequest(treeResult.errors);

  const errors: Record<string, string> = {};
  const firstName = sanitizeRequiredText(body.firstName, "firstName", errors, { max: 255 });
  const lastName = sanitizeRequiredText(body.lastName, "lastName", errors, { max: 255 });
  const email = sanitizeEmail(body.email, "email", errors);
  const preferredUsername = sanitizeUsername(body.preferredUsername, "preferredUsername", errors);
  const requestDetails = sanitizeRequiredText(body.requestDetails, "requestDetails", errors, {
    max: 4000,
    min: 10,
  });

  if (Object.keys(errors).length > 0) return badRequest(errors);

  try {
    const meta = getRequestMeta(request);
    const created = await prisma.registrationRequest.create({
      data: {
        treeId: treeResult.data.treeId,
        firstName,
        lastName,
        email,
        preferredUsername,
        requestDetails,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("[public-intake/registration-request]", error);
    return NextResponse.json({ error: "Could not save registration request." }, { status: 500 });
  }
}
