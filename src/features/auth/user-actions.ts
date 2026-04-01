"use server";

import { requireRole } from "@/features/auth/session";
import {
  listUsers,
  setUserRole,
  setUserWhitelisted,
} from "@/lib/db/users";
import type { UserRole } from "@prisma/client";

export async function listUsersAction() {
  await requireRole("admin");
  return listUsers();
}

export async function updateUserRole(
  userId: string,
  role: UserRole
) {
  await requireRole("admin");
  return setUserRole(userId, role);
}

export async function setUserWhitelistedAction(
  userId: string,
  isWhitelisted: boolean
) {
  await requireRole("admin");
  return setUserWhitelisted(userId, isWhitelisted);
}
