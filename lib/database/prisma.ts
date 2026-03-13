/**
 * Read-only Prisma client for the-gonsalves-family.
 * Connects to ligneous_frontend using a read-only database user.
 *
 * Uses the shared @ligneous/prisma schema.
 * Set DATABASE_URL in .env.local to the read-only connection string:
 *   postgresql://gonsalves_readonly:PASSWORD@HOST:5432/ligneous_frontend?sslmode=disable
 */

import { PrismaClient } from "@ligneous/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local for read-only access to the ligneous_frontend database."
    );
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Lazily initialized - only connects when first used (avoids build-time errors). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});

export default prisma;
