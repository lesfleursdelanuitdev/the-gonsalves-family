import { NextResponse } from "next/server";
import { authCookieName, getCurrentUserFromToken } from "@ligneous/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/database/prisma";

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(authCookieName())?.value ?? null;
    const user = await getCurrentUserFromToken(prisma, token, { touchSession: false });
    return NextResponse.json({ user: user ?? null });
  } catch (error) {
    console.error("Public auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
