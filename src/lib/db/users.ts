/**
 * Repository: Users
 *
 * Typed loaders and writers for the User model.
 */

import { UserRole, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type UserRow = Prisma.UserGetPayload<Record<string, never>>;

export type UserSummary = Pick<
  UserRow,
  "id" | "email" | "name" | "role" | "isWhitelisted" | "createdAt"
>;

// ── Readers ──────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<UserSummary[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}

export async function getUserByEmail(
  email: string
): Promise<UserSummary | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}

export async function getUserById(id: string): Promise<UserSummary | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}

/** Return only whitelisted users for a given role. */
export async function listWhitelistedUsersByRole(
  role: UserRole
): Promise<UserSummary[]> {
  return prisma.user.findMany({
    where: { role, isWhitelisted: true },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}

// ── Writers ──────────────────────────────────────────────────────────────────

export type UpsertUserInput = {
  email: string;
  name?: string;
  role?: UserRole;
  isWhitelisted?: boolean;
};

/** Upsert a user by email — used by the auth callback. */
export async function upsertUserByEmail(
  data: UpsertUserInput
): Promise<UserSummary> {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: data.role,
      isWhitelisted: data.isWhitelisted,
    },
    create: {
      email: data.email,
      name: data.name,
      role: data.role ?? "viewer",
      isWhitelisted: data.isWhitelisted ?? false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}

export async function setUserRole(
  id: string,
  role: UserRole
): Promise<UserSummary> {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}

export async function setUserWhitelisted(
  id: string,
  isWhitelisted: boolean
): Promise<UserSummary> {
  return prisma.user.update({
    where: { id },
    data: { isWhitelisted },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isWhitelisted: true,
      createdAt: true,
    },
  });
}
