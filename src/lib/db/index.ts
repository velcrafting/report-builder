/**
 * lib/db barrel export
 *
 * Import from "@/lib/db" to get the Prisma singleton and all repository helpers.
 * Import from individual modules if you need only specific types without
 * pulling in the whole surface.
 */

export { prisma } from "./prisma";
export * from "./periods";
export * from "./users";
export * from "./imports";
export * from "./fieldRegistry";
export * from "./reportDrafts";
export * from "./outputs";
export * from "./annotations";
export * from "./rollups";
// Note: shareLinks.ts is a standalone module imported directly (not barrel-exported)
// to avoid conflicts with ShareLinkRow in outputs.ts.
