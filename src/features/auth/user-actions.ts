"use server";

import { requireRole } from "@/features/auth/session";
import {
  listUsers,
  setUserRole,
  setUserWhitelisted,
  createUser,
  deleteUser,
  getUserByEmail,
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

export async function createUserAction(
  email: string,
  role: UserRole
): Promise<{ error?: string; user?: Awaited<ReturnType<typeof createUser>> }> {
  await requireRole("admin");
  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "A user with that email already exists." };
  }
  const user = await createUser({ email, role });
  return { user };
}

export async function deleteUserAction(userId: string): Promise<{ error?: string }> {
  const session = await requireRole("admin");
  if (userId === session.user.id) {
    return { error: "You cannot delete your own account." };
  }
  await deleteUser(userId);
  return {};
}
