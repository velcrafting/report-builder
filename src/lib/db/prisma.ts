import { PrismaClient } from "@prisma/client";

declare global {
  var __ledgerPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__ledgerPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__ledgerPrisma = prisma;
}
