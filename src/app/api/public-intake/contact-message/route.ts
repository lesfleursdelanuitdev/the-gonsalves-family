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
  sanitizeOptionalText,
  sanitizeRequiredText,
} from "@/lib/public-intake/intake";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "contact-message", 5);
  if (limited) return limited;

  const body = await parseJsonObject(request);
  if (!body) return badRequest({ body: "Expected a JSON object." });
  if (isSpamHoneypot(body)) return acceptedHoneypotResponse();

  const treeResult = await resolvePublicIntakeTreeId(body.treeId);
  if (!treeResult.ok) return badRequest(treeResult.errors);

  const errors: Record<string, string> = {};
  const email = sanitizeEmail(body.email, "email", errors);
  const message = sanitizeRequiredText(body.message, "message", errors, { max: 6000, min: 10 });
  const firstName = sanitizeOptionalText(body.firstName, 255);
  const lastName = sanitizeOptionalText(body.lastName, 255);
  const subject = sanitizeOptionalText(body.subject, 255);

  if (Object.keys(errors).length > 0) return badRequest(errors);

  try {
    const meta = getRequestMeta(request);
    const created = await prisma.contactMessage.create({
      data: {
        treeId: treeResult.data.treeId,
        firstName,
        lastName,
        email,
        subject,
        message,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({ message: created }, { status: 201 });
  } catch (error) {
    console.error("[public-intake/contact-message]", error);
    return NextResponse.json({ error: "Could not save contact message." }, { status: 500 });
  }
}
