"use server";

import { requireRole } from "@/features/auth/session";
import { createDepartment, deleteDepartment, listDepartments } from "@/lib/db/departments";

export async function listDepartmentsAction() {
  await requireRole("admin");
  return listDepartments();
}

export async function createDepartmentAction(label: string) {
  await requireRole("admin");
  const trimmed = label.trim();
  if (!trimmed) return { error: "Department name is required." };
  // Derive a slug value from the label
  const value = trimmed.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  try {
    const dept = await createDepartment({ value, label: trimmed });
    return { department: dept };
  } catch {
    return { error: "A department with that name already exists." };
  }
}

export async function deleteDepartmentAction(id: string) {
  await requireRole("admin");
  await deleteDepartment(id);
}
