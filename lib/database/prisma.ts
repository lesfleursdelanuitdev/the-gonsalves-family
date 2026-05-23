/**
 * Limited Prisma client for the-gonsalves-family.
 * Connects to ligneous_frontend using a public-site database user.
 *
 * The database role should be read-only for genealogy/core tables and write-only
 * for public intake tables (`registration_requests`, `contact_messages`,
 * `contributions`, and `contribution_attachments`).
 *
 * Uses the shared @ligneous/prisma schema.
 * Set DATABASE_URL in .env.local to the public-site connection string:
 *   postgresql://gonsalves_readonly:PASSWORD@HOST:5432/ligneous_frontend?sslmode=disable
 */

import { PrismaClient } from "@ligneous/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function databasePoolMax(): number {
  const raw = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "3", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 3;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local for limited public-site access to the ligneous_frontend database."
    );
  }

  const pool = new pg.Pool({
    connectionString: url,
    max: databasePoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * True when the generated client includes models added in the place-resolution migration
 * (20260523170000_place_resolution). If false the cached client pre-dates that migration
 * and must be replaced so queries using `resolvedLink` on GedcomPlace don't fail.
 */
function prismaClientHasExpectedDelegates(client: PrismaClient): boolean {
  const o = client as unknown as Record<string, unknown>;
  return o.resolvedPlace != null;
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma && prismaClientHasExpectedDelegates(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }
  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

/** Lazily initialized - only connects when first used (avoids build-time errors). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});

export default prisma;
